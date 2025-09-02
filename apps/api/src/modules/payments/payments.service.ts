import { 
  Injectable, 
  Inject, 
  BadRequestException,
  NotFoundException 
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../config/database.module';
import { 
  users,
  subscriptionPlans,
  userSubscriptions,
  paymentTransactions
} from '@packages/database/schema';
import { CreateCheckoutSessionDto, PaymentWebhookDto } from './dto/payment.dto';
import { SubscriptionsService } from './subscriptions.service';
import type { Database } from '@packages/database';

export interface PaymentProvider {
  createCheckoutSession(
    planId: string,
    userId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<{
    checkoutUrl: string;
    sessionId: string;
  }>;
  
  verifyWebhook(signature: string, payload: any): boolean;
}

// Mock payment provider for development
class MockPaymentProvider implements PaymentProvider {
  async createCheckoutSession(
    planId: string,
    userId: string,
    successUrl: string,
    cancelUrl: string
  ) {
    // In development, return a mock checkout URL
    const sessionId = `mock_session_${Date.now()}`;
    return {
      checkoutUrl: `http://localhost:3000/checkout/mock?session=${sessionId}&plan=${planId}&user=${userId}`,
      sessionId,
    };
  }

  verifyWebhook(signature: string, payload: any): boolean {
    // Mock verification always returns true in development
    return true;
  }
}

@Injectable()
export class PaymentsService {
  private paymentProvider: PaymentProvider;

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private configService: ConfigService,
    private subscriptionsService: SubscriptionsService,
  ) {
    // Initialize payment provider based on configuration
    const providerType = this.configService.get('PAYMENT_PROVIDER', 'mock');
    
    switch (providerType) {
      case 'iyzico':
        // TODO: Implement iyzico provider
        this.paymentProvider = new MockPaymentProvider();
        break;
      case 'stripe':
        // TODO: Implement Stripe provider
        this.paymentProvider = new MockPaymentProvider();
        break;
      default:
        this.paymentProvider = new MockPaymentProvider();
    }
  }

  async createCheckoutSession(userId: string, checkoutData: CreateCheckoutSessionDto) {
    // Get user
    const user = await this.db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      throw new NotFoundException('User not found');
    }

    // Get subscription plan
    const plan = await this.db.select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, checkoutData.planId))
      .limit(1);

    if (!plan.length || !plan[0].isActive) {
      throw new BadRequestException('Invalid or inactive subscription plan');
    }

    // Check if user already has an active subscription
    const existingSubscription = await this.subscriptionsService.getUserActiveSubscription(userId);
    if (existingSubscription && plan[0].userType === existingSubscription.plan.userType) {
      throw new BadRequestException('User already has an active subscription for this user type');
    }

    // Create payment transaction record
    const transaction = await this.db.insert(paymentTransactions)
      .values({
        userId,
        planId: checkoutData.planId,
        amount: plan[0].price,
        currency: plan[0].currency,
        status: 'PENDING',
        provider: this.configService.get('PAYMENT_PROVIDER', 'mock'),
      })
      .returning();

    // Create checkout session with payment provider
    const successUrl = checkoutData.successUrl || 
      `${this.configService.get('FRONTEND_URL')}/payment/success`;
    const cancelUrl = checkoutData.cancelUrl || 
      `${this.configService.get('FRONTEND_URL')}/payment/cancel`;

    const checkoutSession = await this.paymentProvider.createCheckoutSession(
      checkoutData.planId,
      userId,
      successUrl,
      cancelUrl
    );

    // Update transaction with session ID
    await this.db.update(paymentTransactions)
      .set({
        providerTransactionId: checkoutSession.sessionId,
        updatedAt: new Date()
      })
      .where(eq(paymentTransactions.id, transaction[0].id));

    return {
      checkoutUrl: checkoutSession.checkoutUrl,
      transactionId: transaction[0].id,
    };
  }

  async handlePaymentWebhook(webhookData: PaymentWebhookDto) {
    // Verify webhook signature
    if (webhookData.signature && 
        !this.paymentProvider.verifyWebhook(webhookData.signature, webhookData)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    // Find transaction
    const transaction = await this.db.select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.providerTransactionId, webhookData.paymentId))
      .limit(1);

    if (!transaction.length) {
      throw new NotFoundException('Transaction not found');
    }

    const transactionRecord = transaction[0];

    // Update transaction status
    await this.db.update(paymentTransactions)
      .set({
        status: webhookData.status,
        providerResponse: webhookData,
        completedAt: webhookData.status === 'COMPLETED' ? new Date() : null,
        failureReason: webhookData.failureReason,
        updatedAt: new Date()
      })
      .where(eq(paymentTransactions.id, transactionRecord.id));

    // If payment is successful, create/update subscription
    if (webhookData.status === 'COMPLETED') {
      await this.subscriptionsService.activateSubscription(
        transactionRecord.userId,
        transactionRecord.planId,
        transactionRecord.id
      );
    }

    return { success: true };
  }

  async getPaymentHistory(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const transactions = await this.db.select({
      id: paymentTransactions.id,
      amount: paymentTransactions.amount,
      currency: paymentTransactions.currency,
      status: paymentTransactions.status,
      createdAt: paymentTransactions.createdAt,
      completedAt: paymentTransactions.completedAt,
      failureReason: paymentTransactions.failureReason,
      plan: {
        name: subscriptionPlans.name,
        description: subscriptionPlans.description,
      }
    })
      .from(paymentTransactions)
      .leftJoin(subscriptionPlans, eq(paymentTransactions.planId, subscriptionPlans.id))
      .where(eq(paymentTransactions.userId, userId))
      .orderBy(paymentTransactions.createdAt)
      .limit(limit)
      .offset(offset);

    return transactions;
  }

  async getTransactionDetails(transactionId: string, userId: string) {
    const transaction = await this.db.select()
      .from(paymentTransactions)
      .leftJoin(subscriptionPlans, eq(paymentTransactions.planId, subscriptionPlans.id))
      .where(eq(paymentTransactions.id, transactionId))
      .limit(1);

    if (!transaction.length) {
      throw new NotFoundException('Transaction not found');
    }

    // Verify user ownership
    if (transaction[0].payment_transactions.userId !== userId) {
      throw new BadRequestException('Unauthorized access to transaction');
    }

    return transaction[0];
  }

  // Mock payment completion for development
  async mockCompletePayment(transactionId: string) {
    if (this.configService.get('NODE_ENV') !== 'development') {
      throw new BadRequestException('Mock payments only available in development');
    }

    const transaction = await this.db.select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.id, transactionId))
      .limit(1);

    if (!transaction.length) {
      throw new NotFoundException('Transaction not found');
    }

    const transactionRecord = transaction[0];

    if (transactionRecord.status !== 'PENDING') {
      throw new BadRequestException('Transaction is not in pending state');
    }

    // Simulate successful payment
    const webhookData: PaymentWebhookDto = {
      eventType: 'payment.completed',
      paymentId: transactionRecord.providerTransactionId,
      orderId: transactionRecord.id,
      userId: transactionRecord.userId,
      amount: transactionRecord.amount,
      currency: transactionRecord.currency,
      status: 'COMPLETED',
    };

    return this.handlePaymentWebhook(webhookData);
  }
}
