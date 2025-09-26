import { pgTable, uuid, text, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';
import { subscriptionPlanTypeEnum, subscriptionAudienceEnum } from './enums';

export const subscriptionPlans = pgTable('subscription_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  planType: subscriptionPlanTypeEnum('plan_type').notNull(),
  audience: subscriptionAudienceEnum('audience').default('BOTH'),
  priceCents: integer('price_cents').default(0),
  
  // API'nin beklediği backward compatibility field
  price: integer('price'), // Legacy field - same as priceCents
  
  currency: text('currency').default('TRY'),
  durationDays: integer('duration_days').default(30),
  features: jsonb('features').default([]),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const userSubscriptions = pgTable('user_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  planId: uuid('plan_id').notNull().references(() => subscriptionPlans.id),
  status: text('status').$type<'ACTIVE'|'CANCELED'|'EXPIRED'|'PAST_DUE'>().default('ACTIVE'),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  
  // API'nin beklediği ek alanlar
  startDate: timestamp('start_date'), // Legacy field - same as periodStart
  endDate: timestamp('end_date'), // Legacy field - same as periodEnd
  autoRenew: boolean('auto_renew').default(true),
  cancelledAt: timestamp('cancelled_at'),
  
  paidAmountCents: integer('paid_amount_cents').default(0),
  externalPaymentId: text('external_payment_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const userEntitlements = pgTable('user_entitlements', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subscriptionId: uuid('subscription_id').references(() => userSubscriptions.id),
  entitlementType: text('entitlement_type').notNull(), // e.g., 'MESSAGE_CREDITS'
  balance: integer('balance').default(0).notNull(),
  totalAllocated: integer('total_allocated').default(0).notNull(),
  source: text('source').default('SUBSCRIPTION').notNull(), // SUBSCRIPTION | MANUAL
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type NewSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type NewUserSubscription = typeof userSubscriptions.$inferInsert;
export type UserEntitlement = typeof userEntitlements.$inferSelect;
export type NewUserEntitlement = typeof userEntitlements.$inferInsert;