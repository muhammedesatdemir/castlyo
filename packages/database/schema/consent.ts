import { pgTable, uuid, text, timestamp, boolean, inet } from 'drizzle-orm/pg-core';
import { users } from './users';
import { auditActionEnum } from './enums';

export const userConsents = pgTable('user_consents', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  acceptedTerms: boolean('accepted_terms').notNull(),
  acceptedPrivacy: boolean('accepted_privacy').notNull(),
  termsVersion: text('terms_version').notNull(),
  privacyVersion: text('privacy_version').notNull(),
  acceptedIp: inet('accepted_ip'),
  acceptedAt: timestamp('accepted_at').notNull().defaultNow(),
});

// Legacy consent table for backward compatibility
export const legacyUserConsents = pgTable('legacy_user_consents', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  consentType: text('consent_type').notNull(),
  version: text('version').notNull(),
  consented: boolean('consented').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  consentedAt: timestamp('consented_at').notNull().defaultNow(),
});

export const consentLogs = pgTable('consent_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  userRole: text('user_role').notNull(),
  action: auditActionEnum('action').notNull(),
  resource: text('resource'),
  resourceId: text('resource_id'),
  details: text('details'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type UserConsent = typeof userConsents.$inferSelect;
export type NewUserConsent = typeof userConsents.$inferInsert;
export type ConsentLog = typeof consentLogs.$inferSelect;
export type NewConsentLog = typeof consentLogs.$inferInsert;
