import { 
  Injectable, 
  Inject, 
  BadRequestException,
  NotFoundException 
} from '@nestjs/common';
import { eq, and, gte, lte } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../config/database.module';
import { 
  users,
  subscriptionPlans,
  userSubscriptions,
  planEntitlements,
  userEntitlements
} from '@packages/database/schema';
import type { Database } from '@packages/database';

@Injectable()
export class SubscriptionsService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
  ) {}

  async getAvailablePlans(userType?: 'TALENT' | 'AGENCY') {
    let query = this.db.select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true));

    if (userType) {
      query = query.where(eq(subscriptionPlans.userType, userType));
    }

    const plans = await query.orderBy(subscriptionPlans.price);

    // Get entitlements for each plan
    const plansWithEntitlements = await Promise.all(
      plans.map(async (plan) => {
        const entitlements = await this.db.select()
          .from(planEntitlements)
          .where(eq(planEntitlements.planId, plan.id));

        return {
          ...plan,
          entitlements,
        };
      })
    );

    return plansWithEntitlements;
  }

  async getUserActiveSubscription(userId: string) {
    const activeSubscription = await this.db.select({
      subscription: userSubscriptions,
      plan: subscriptionPlans,
    })
      .from(userSubscriptions)
      .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'ACTIVE'),
          gte(userSubscriptions.endsAt, new Date())
        )
      )
      .limit(1);

    return activeSubscription[0] || null;
  }

  async getUserSubscriptionHistory(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const subscriptions = await this.db.select({
      subscription: userSubscriptions,
      plan: subscriptionPlans,
    })
      .from(userSubscriptions)
      .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(eq(userSubscriptions.userId, userId))
      .orderBy(userSubscriptions.createdAt)
      .limit(limit)
      .offset(offset);

    return subscriptions;
  }

  async activateSubscription(userId: string, planId: string, paymentTransactionId: string) {
    // Get plan details
    const plan = await this.db.select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);

    if (!plan.length) {
      throw new NotFoundException('Subscription plan not found');
    }

    const planData = plan[0];

    // Calculate subscription period
    const startDate = new Date();
    const endDate = new Date();
    
    switch (planData.billingCycle) {
      case 'MONTHLY':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'QUARTERLY':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'YEARLY':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      default:
        throw new BadRequestException('Invalid billing cycle');
    }

    // Deactivate any existing active subscriptions for the same user type
    await this.db.update(userSubscriptions)
      .set({
        status: 'EXPIRED',
        updatedAt: new Date()
      })
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'ACTIVE')
        )
      );

    // Create new subscription
    const newSubscription = await this.db.insert(userSubscriptions)
      .values({
        userId,
        planId,
        paymentTransactionId,
        status: 'ACTIVE',
        startsAt: startDate,
        endsAt: endDate,
        autoRenew: true,
      })
      .returning();

    // Setup entitlements for the user
    await this.setupUserEntitlements(userId, planId);

    return newSubscription[0];
  }

  async cancelSubscription(userId: string, subscriptionId: string) {
    // Verify subscription belongs to user
    const subscription = await this.db.select()
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.id, subscriptionId),
          eq(userSubscriptions.userId, userId)
        )
      )
      .limit(1);

    if (!subscription.length) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription[0].status !== 'ACTIVE') {
      throw new BadRequestException('Subscription is not active');
    }

    // Cancel subscription (it will remain active until end date)
    await this.db.update(userSubscriptions)
      .set({
        status: 'CANCELLED',
        autoRenew: false,
        cancelledAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(userSubscriptions.id, subscriptionId));

    return { success: true, message: 'Subscription cancelled successfully' };
  }

  async renewSubscription(subscriptionId: string) {
    const subscription = await this.db.select()
      .from(userSubscriptions)
      .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(eq(userSubscriptions.id, subscriptionId))
      .limit(1);

    if (!subscription.length) {
      throw new NotFoundException('Subscription not found');
    }

    const { user_subscriptions: subData, subscription_plans: planData } = subscription[0];

    if (!subData.autoRenew) {
      return { success: false, message: 'Auto-renewal is disabled' };
    }

    // Calculate new end date
    const newEndDate = new Date(subData.endsAt);
    
    switch (planData.billingCycle) {
      case 'MONTHLY':
        newEndDate.setMonth(newEndDate.getMonth() + 1);
        break;
      case 'QUARTERLY':
        newEndDate.setMonth(newEndDate.getMonth() + 3);
        break;
      case 'YEARLY':
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        break;
    }

    // Update subscription
    await this.db.update(userSubscriptions)
      .set({
        endsAt: newEndDate,
        renewedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(userSubscriptions.id, subscriptionId));

    // Reset entitlements for the new period
    await this.resetUserEntitlements(subData.userId, subData.planId);

    return { success: true, message: 'Subscription renewed successfully' };
  }

  private async setupUserEntitlements(userId: string, planId: string) {
    // Get plan entitlements
    const planEntitlementsList = await this.db.select()
      .from(planEntitlements)
      .where(eq(planEntitlements.planId, planId));

    // Create user entitlements based on plan
    const userEntitlementValues = planEntitlementsList.map(entitlement => ({
      userId,
      entitlementType: entitlement.entitlementType,
      entitlementValue: entitlement.entitlementValue,
      usedValue: 0,
      resetDate: this.calculateResetDate(entitlement.resetPeriod),
    }));

    if (userEntitlementValues.length > 0) {
      await this.db.insert(userEntitlements).values(userEntitlementValues);
    }
  }

  private async resetUserEntitlements(userId: string, planId: string) {
    // Delete existing entitlements
    await this.db.delete(userEntitlements)
      .where(eq(userEntitlements.userId, userId));

    // Setup new entitlements
    await this.setupUserEntitlements(userId, planId);
  }

  private calculateResetDate(resetPeriod: string): Date | null {
    if (resetPeriod === 'NEVER') return null;

    const resetDate = new Date();
    
    switch (resetPeriod) {
      case 'DAILY':
        resetDate.setDate(resetDate.getDate() + 1);
        break;
      case 'WEEKLY':
        resetDate.setDate(resetDate.getDate() + 7);
        break;
      case 'MONTHLY':
        resetDate.setMonth(resetDate.getMonth() + 1);
        break;
      case 'YEARLY':
        resetDate.setFullYear(resetDate.getFullYear() + 1);
        break;
    }

    return resetDate;
  }

  async getUserEntitlements(userId: string) {
    const entitlements = await this.db.select()
      .from(userEntitlements)
      .where(eq(userEntitlements.userId, userId));

    return entitlements;
  }

  async checkEntitlement(userId: string, entitlementType: string): Promise<{
    hasAccess: boolean;
    remaining: number;
    total: number;
  }> {
    const entitlement = await this.db.select()
      .from(userEntitlements)
      .where(
        and(
          eq(userEntitlements.userId, userId),
          eq(userEntitlements.entitlementType, entitlementType)
        )
      )
      .limit(1);

    if (!entitlement.length) {
      return { hasAccess: false, remaining: 0, total: 0 };
    }

    const ent = entitlement[0];
    const remaining = ent.entitlementValue - ent.usedValue;

    return {
      hasAccess: remaining > 0,
      remaining,
      total: ent.entitlementValue,
    };
  }

  async consumeEntitlement(userId: string, entitlementType: string, amount = 1) {
    const entitlement = await this.checkEntitlement(userId, entitlementType);

    if (!entitlement.hasAccess || entitlement.remaining < amount) {
      throw new BadRequestException(`Insufficient ${entitlementType} quota`);
    }

    // Update used value
    await this.db.update(userEntitlements)
      .set({
        usedValue: entitlement.total - entitlement.remaining + amount,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(userEntitlements.userId, userId),
          eq(userEntitlements.entitlementType, entitlementType)
        )
      );

    return {
      success: true,
      remaining: entitlement.remaining - amount,
    };
  }
}
