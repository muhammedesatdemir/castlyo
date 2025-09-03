import { pgTable, uuid, timestamp, boolean, text, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, talentProfiles, agencyProfiles } from './users';

// Contact permissions - tracks when agencies are allowed to contact talents
export const contactPermissions = pgTable('contact_permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  talentId: uuid('talent_id').references(() => users.id).notNull(),
  agencyId: uuid('agency_id').references(() => users.id).notNull(),
  granted: boolean('granted').default(false).notNull(),
  grantedAt: timestamp('granted_at'),
  revokedAt: timestamp('revoked_at'),
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  
  // Context about the permission request
  requestContext: text('request_context'), // Job posting, direct contact, etc.
  requestMessage: text('request_message'), // Message from agency to talent
  
  // Metadata
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Audit logs for all data sharing activities
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Who performed the action
  userId: uuid('user_id').references(() => users.id).notNull(),
  userRole: varchar('user_role', { length: 20 }).notNull(), // TALENT, AGENCY, ADMIN
  
  // What was the action
  action: varchar('action', { length: 50 }).notNull(), // CONTACT_REQUESTED, CONTACT_GRANTED, CONTACT_REVOKED, DATA_SHARED, DATA_ACCESSED
  resource: varchar('resource', { length: 50 }).notNull(), // TALENT_PROFILE, CONTACT_INFO, etc.
  resourceId: uuid('resource_id'), // ID of the resource being accessed
  
  // Who was affected
  targetUserId: uuid('target_user_id').references(() => users.id),
  
  // Context and details
  details: text('details'), // JSON string with additional context
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  
  // Success/failure
  success: boolean('success').default(true).notNull(),
  errorMessage: text('error_message'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Consent logs - tracks all KVKK and other consent activities
export const consentLogs = pgTable('consent_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  // Consent details
  consentType: varchar('consent_type', { length: 50 }).notNull(), // KVKK, MARKETING, COMMUNICATION, DATA_SHARING
  consentVersion: varchar('consent_version', { length: 20 }).notNull(),
  granted: boolean('granted').notNull(),
  
  // Context
  consentText: text('consent_text'), // The actual text that was consented to
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  
  // When it was given/revoked
  consentedAt: timestamp('consented_at').defaultNow().notNull(),
  revokedAt: timestamp('revoked_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const contactPermissionsRelations = relations(contactPermissions, ({ one }) => ({
  talent: one(users, {
    fields: [contactPermissions.talentId],
    references: [users.id],
  }),
  agency: one(users, {
    fields: [contactPermissions.agencyId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  targetUser: one(users, {
    fields: [auditLogs.targetUserId],
    references: [users.id],
  }),
}));

export const consentLogsRelations = relations(consentLogs, ({ one }) => ({
  user: one(users, {
    fields: [consentLogs.userId],
    references: [users.id],
  }),
}));
