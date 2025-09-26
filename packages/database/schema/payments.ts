import { pgTable, uuid, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';
import { userSubscriptions } from './subscriptions';
import { paymentProviderEnum, paymentStatusEnum } from './enums';

export const paymentTransactions = pgTable('payment_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subscriptionId: uuid('subscription_id').references(() => userSubscriptions.id),
  provider: paymentProviderEnum('provider').default('MOCK'),
  amountCents: integer('amount_cents').notNull(),
  
  // API'nin beklediği ek alanlar (backward compatibility)
  amount: integer('amount'), // Legacy field - same as amountCents but different name
  completedAt: timestamp('completed_at'),
  failureReason: text('failure_reason'),
  providerResponse: jsonb('provider_response'),
  providerTransactionId: text('provider_transaction_id'),
  
  currency: text('currency').default('TRY'),
  status: paymentStatusEnum('status').notNull(),
  providerRef: text('provider_ref'),
  raw: jsonb('raw'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type NewPaymentTransaction = typeof paymentTransactions.$inferInsert;
