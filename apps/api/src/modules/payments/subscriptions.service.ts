import { 
  Injectable, 
  Inject, 
  BadRequestException,
  NotFoundException 
} from '@nestjs/common';
import { eq, and, gte, or } from 'drizzle-orm';
// DATABASE_CONNECTION import removed - using 'DRIZZLE' directly
import { 
  users,
  subscriptionPlans,
  userSubscriptions,
  userEntitlements
} from '@castlyo/database';
import type { Database } from '@castlyo/database';

@Injectable()
export class SubscriptionsService {
  constructor(
    @Inject('DRIZZLE') private readonly db: Database,
  ) {}

  async getAvailablePlans(userType?: 'TALENT' | 'AGENCY') {
    let whereConditions = [eq(subscriptionPlans.isActive, true)];

    if (userType) {
      whereConditions.push(or(
        eq(subscriptionPlans.audience, userType as any),
        eq(subscriptionPlans.audience, 'BOTH')
      ));
    }

    const plans = await this.db.select({ id: subscriptionPlans.id, audience: subscriptionPlans.audience, priceCents: subscriptionPlans.priceCents, isActive: subscriptionPlans.isActive, durationDays: subscriptionPlans.durationDays, planType: subscriptionPlans.planType })
      .from(subscriptionPlans)
      .where(and(...whereConditions))
      .orderBy(subscriptionPlans.priceCents);

    return plans;
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
          gte(userSubscriptions.periodEnd, new Date())
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

  async activateSubscription(userId: string, planId: string) {
    // Get plan details
    const plan = await this.db.select({ id: subscriptionPlans.id, durationDays: subscriptionPlans.durationDays })
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);

    if (!plan.length) {
      throw new NotFoundException('Subscription plan not found');
    }

    const planData = plan[0];

    // Calculate subscription period using durationDays
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + planData.durationDays * 24 * 60 * 60 * 1000);

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
        status: 'ACTIVE',
        periodStart: startDate,
        periodEnd: endDate,
        autoRenew: true,
      })
      .returning();

    // Setup entitlements for the user
    await this.setupUserEntitlements(userId, planId, planData);

    return newSubscription[0];
  }

  async cancelSubscription(userId: string, subscriptionId: string) {
    // Verify subscription belongs to user
    const subscription = await this.db.select({ id: userSubscriptions.id, userId: userSubscriptions.userId, status: userSubscriptions.status })
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
        status: 'CANCELED',
        autoRenew: false,
        cancelledAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(userSubscriptions.id, subscriptionId));

    return { success: true, message: 'Subscription cancelled successfully' };
  }

  async renewSubscription(subscriptionId: string) {
    const subscription = await this.db.select({ id: userSubscriptions.id })
      .from(userSubscriptions)
      .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(eq(userSubscriptions.id, subscriptionId))
      .limit(1);

    if (!subscription.length) {
      throw new NotFoundException('Subscription not found');
    }

    const { user_subscriptions: subData, subscription_plans: planData } = subscription[0] as any;

    if (!subData.autoRenew) {
      return { success: false, message: 'Auto-renewal is disabled' };
    }

    // Calculate new end date
    const newEndDate = new Date(subData.endDate);
    newEndDate.setDate(newEndDate.getDate() + planData.durationDays);

    // Update subscription
    await this.db.update(userSubscriptions)
      .set({
        periodEnd: newEndDate,
        updatedAt: new Date()
      })
      .where(eq(userSubscriptions.id, subscriptionId));

    // Reset entitlements for the new period
    await this.resetUserEntitlements(subData.userId, subData.planId, planData);

    return { success: true, message: 'Subscription renewed successfully' };
  }

  private async setupUserEntitlements(userId: string, planId: string, planData: any) {
    const features = planData.features || {};
    const entitlements: Array<{ type: string; balance: number; totalAllocated: number; }> = [];

    if (typeof features.applicationQuota === 'number') {
      entitlements.push({ type: 'APPLICATION_QUOTA', balance: features.applicationQuota, totalAllocated: features.applicationQuota });
    }
    if (typeof features.jobPostQuota === 'number') {
      entitlements.push({ type: 'JOB_POST_QUOTA', balance: features.jobPostQuota, totalAllocated: features.jobPostQuota });
    }
    if (typeof features.contactPermissionQuota === 'number') {
      entitlements.push({ type: 'CONTACT_PERMISSION_QUOTA', balance: features.contactPermissionQuota, totalAllocated: features.contactPermissionQuota });
    }
    if (typeof features.boostDays === 'number') {
      entitlements.push({ type: 'PROFILE_BOOST_DAYS', balance: features.boostDays, totalAllocated: features.boostDays });
    }

    if (entitlements.length > 0) {
      await this.db.insert(userEntitlements).values(
        entitlements.map(e => ({
          userId,
          subscriptionId: undefined,
          entitlementType: e.type as any,
          balance: e.balance,
          totalAllocated: e.totalAllocated,
          source: 'SUBSCRIPTION',
        }))
      );
    }
  }

  private async resetUserEntitlements(userId: string, planId: string, planData: any) {
    await this.db.delete(userEntitlements)
      .where(eq(userEntitlements.userId, userId));

    await this.setupUserEntitlements(userId, planId, planData);
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
    const entitlements = await this.db.select({ id: userEntitlements.id, entitlementType: userEntitlements.entitlementType, balance: userEntitlements.balance, totalAllocated: userEntitlements.totalAllocated })
      .from(userEntitlements)
      .where(eq(userEntitlements.userId, userId));

    return entitlements;
  }

  async checkEntitlement(userId: string, entitlementType: string): Promise<{
    hasAccess: boolean;
    remaining: number;
    total: number;
  }> {
    const entitlement = await this.db.select({ id: userEntitlements.id, entitlementType: userEntitlements.entitlementType, balance: userEntitlements.balance, totalAllocated: userEntitlements.totalAllocated })
      .from(userEntitlements)
      .where(
        and(
          eq(userEntitlements.userId, userId),
          eq(userEntitlements.entitlementType, entitlementType as any)
        )
      )
      .limit(1);

    if (!entitlement.length) {
      return { hasAccess: false, remaining: 0, total: 0 };
    }

    const ent = entitlement[0] as any;
    const remaining = ent.balance;

    return {
      hasAccess: remaining > 0,
      remaining,
      total: ent.totalAllocated,
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
        balance: entitlement.remaining - amount,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(userEntitlements.userId, userId),
          eq(userEntitlements.entitlementType, entitlementType as any)
        )
      );

    return {
      success: true,
      remaining: entitlement.remaining - amount,
    };
  }
}
