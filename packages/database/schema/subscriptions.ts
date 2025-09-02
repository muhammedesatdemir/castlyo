import { pgTable, uuid, varchar, text, timestamp, integer, decimal, jsonb, pgEnum, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// Enums
export const planTypeEnum = pgEnum('plan_type', ['TALENT', 'AGENCY']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING']);
export const paymentStatusEnum = pgEnum('payment_status', ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']);
export const entitlementTypeEnum = pgEnum('entitlement_type', [
  'APPLICATION_QUOTA',
  'JOB_POST_QUOTA', 
  'CONTACT_PERMISSION_QUOTA',
  'PROFILE_BOOST_DAYS',
  'FEATURED_LISTING',
  'PRIORITY_SUPPORT',
  'ADVANCED_SEARCH',
  'ANALYTICS_ACCESS'
]);

// Subscription plans - available packages
export const subscriptionPlans = pgTable('subscription_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  planType: planTypeEnum('plan_type').notNull(),
  
  // Pricing
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('TRY').notNull(),
  durationDays: integer('duration_days').notNull(),
  
  // Features and limits
  features: jsonb('features').$type<{
    applicationQuota?: number;
    jobPostQuota?: number;
    contactPermissionQuota?: number;
    boostDays?: number;
    featuredListing?: boolean;
    prioritySupport?: boolean;
    advancedSearch?: boolean;
    analyticsAccess?: boolean;
    [key: string]: any;
  }>().default({}),
  
  // Status
  isActive: boolean('is_active').default(true).notNull(),
  isPopular: boolean('is_popular').default(false).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User subscriptions - active/past subscriptions
export const userSubscriptions = pgTable('user_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  planId: uuid('plan_id').references(() => subscriptionPlans.id).notNull(),
  
  // Subscription details
  status: subscriptionStatusEnum('status').default('PENDING').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  
  // Pricing (stored for historical record)
  paidAmount: decimal('paid_amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('TRY').notNull(),
  
  // Payment reference
  paymentProvider: varchar('payment_provider', { length: 50 }), // 'iyzico', 'stripe', etc.
  paymentId: varchar('payment_id', { length: 255 }),
  
  // Auto-renewal
  autoRenew: boolean('auto_renew').default(false).notNull(),
  renewalAttempts: integer('renewal_attempts').default(0).notNull(),
  
  // Cancellation
  cancelledAt: timestamp('cancelled_at'),
  cancellationReason: text('cancellation_reason'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User entitlements - current quotas and permissions
export const userEntitlements = pgTable('user_entitlements', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  subscriptionId: uuid('subscription_id').references(() => userSubscriptions.id),
  
  // Entitlement details
  type: entitlementTypeEnum('type').notNull(),
  balance: integer('balance').notNull(), // remaining quota
  totalAllocated: integer('total_allocated').notNull(), // original quota
  
  // Expiration
  expiresAt: timestamp('expires_at'),
  isExpired: boolean('is_expired').default(false).notNull(),
  
  // Source (can be from subscription, bonus, manual adjustment)
  source: varchar('source', { length: 100 }).default('SUBSCRIPTION').notNull(),
  notes: text('notes'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Payment transactions
export const paymentTransactions = pgTable('payment_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  subscriptionId: uuid('subscription_id').references(() => userSubscriptions.id),
  
  // Transaction details
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('TRY').notNull(),
  status: paymentStatusEnum('status').default('PENDING').notNull(),
  
  // Provider details
  provider: varchar('provider', { length: 50 }).notNull(), // 'iyzico', 'stripe', etc.
  providerTransactionId: varchar('provider_transaction_id', { length: 255 }),
  providerResponse: jsonb('provider_response'),
  
  // Payment method
  paymentMethod: varchar('payment_method', { length: 50 }), // 'credit_card', 'debit_card', etc.
  lastFourDigits: varchar('last_four_digits', { length: 4 }),
  
  // Timestamps
  initiatedAt: timestamp('initiated_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  failedAt: timestamp('failed_at'),
  
  // Failure details
  failureReason: text('failure_reason'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Entitlement usage tracking
export const entitlementUsage = pgTable('entitlement_usage', {
  id: uuid('id').defaultRandom().primaryKey(),
  entitlementId: uuid('entitlement_id').references(() => userEntitlements.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  // Usage details
  usageType: varchar('usage_type', { length: 100 }).notNull(), // 'APPLICATION_SUBMITTED', 'JOB_POSTED', etc.
  quantity: integer('quantity').default(1).notNull(),
  
  // Context
  relatedEntityId: uuid('related_entity_id'), // ID of job, application, etc.
  relatedEntityType: varchar('related_entity_type', { length: 50 }), // 'JOB', 'APPLICATION', etc.
  
  // Metadata
  metadata: jsonb('metadata'),
  
  usedAt: timestamp('used_at').defaultNow().notNull(),
});

// Relations
export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  subscriptions: many(userSubscriptions),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [userSubscriptions.userId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [userSubscriptions.planId],
    references: [subscriptionPlans.id],
  }),
  entitlements: many(userEntitlements),
  transactions: many(paymentTransactions),
}));

export const userEntitlementsRelations = relations(userEntitlements, ({ one, many }) => ({
  user: one(users, {
    fields: [userEntitlements.userId],
    references: [users.id],
  }),
  subscription: one(userSubscriptions, {
    fields: [userEntitlements.subscriptionId],
    references: [userSubscriptions.id],
  }),
  usageRecords: many(entitlementUsage),
}));

export const paymentTransactionsRelations = relations(paymentTransactions, ({ one }) => ({
  user: one(users, {
    fields: [paymentTransactions.userId],
    references: [users.id],
  }),
  subscription: one(userSubscriptions, {
    fields: [paymentTransactions.subscriptionId],
    references: [userSubscriptions.id],
  }),
}));

export const entitlementUsageRelations = relations(entitlementUsage, ({ one }) => ({
  entitlement: one(userEntitlements, {
    fields: [entitlementUsage.entitlementId],
    references: [userEntitlements.id],
  }),
  user: one(users, {
    fields: [entitlementUsage.userId],
    references: [users.id],
  }),
}));
