import { pgTable, uuid, varchar, text, timestamp, jsonb, pgEnum, boolean, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// Enums
export const auditActionEnum = pgEnum('audit_action', [
  'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'DOWNLOAD', 'EXPORT'
]);
export const auditEntityTypeEnum = pgEnum('audit_entity_type', [
  'USER', 'TALENT_PROFILE', 'AGENCY_PROFILE', 'JOB_POST', 'APPLICATION', 'MESSAGE', 'PAYMENT', 'SUBSCRIPTION'
]);

// Audit logs - for compliance and security tracking
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Who performed the action
  userId: uuid('user_id').references(() => users.id),
  userEmail: varchar('user_email', { length: 255 }),
  userRole: varchar('user_role', { length: 50 }),
  
  // What action was performed
  action: auditActionEnum('action').notNull(),
  entityType: auditEntityTypeEnum('entity_type').notNull(),
  entityId: uuid('entity_id'),
  
  // Context and details
  description: text('description'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  
  // Request context
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  requestId: uuid('request_id'),
  sessionId: varchar('session_id', { length: 255 }),
  
  // Additional metadata
  metadata: jsonb('metadata'),
  
  // Timing
  performedAt: timestamp('performed_at').defaultNow().notNull(),
  
  // Retention
  retentionUntil: timestamp('retention_until'),
});

// Security events - for monitoring suspicious activities
export const securityEvents = pgTable('security_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Event details
  eventType: varchar('event_type', { length: 100 }).notNull(), // 'FAILED_LOGIN', 'SUSPICIOUS_ACTIVITY', etc.
  severity: varchar('severity', { length: 20 }).notNull(), // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  description: text('description').notNull(),
  
  // User context
  userId: uuid('user_id').references(() => users.id),
  userEmail: varchar('user_email', { length: 255 }),
  
  // Request context
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  requestPath: varchar('request_path', { length: 500 }),
  
  // Additional data
  eventData: jsonb('event_data'),
  
  // Resolution
  isResolved: boolean('is_resolved').default(false).notNull(),
  resolvedBy: uuid('resolved_by').references(() => users.id),
  resolvedAt: timestamp('resolved_at'),
  resolutionNotes: text('resolution_notes'),
  
  // Timing
  detectedAt: timestamp('detected_at').defaultNow().notNull(),
  
  // Retention
  retentionUntil: timestamp('retention_until'),
});

// Content moderation logs
export const moderationLogs = pgTable('moderation_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // What was moderated
  entityType: varchar('entity_type', { length: 50 }).notNull(), // 'PROFILE', 'MESSAGE', 'JOB_POST'
  entityId: uuid('entity_id').notNull(),
  
  // Moderation details
  moderationType: varchar('moderation_type', { length: 50 }).notNull(), // 'AUTOMATIC', 'MANUAL', 'REPORTED'
  action: varchar('action', { length: 50 }).notNull(), // 'APPROVED', 'REJECTED', 'FLAGGED', 'SUSPENDED'
  reason: text('reason'),
  
  // Moderator info
  moderatedBy: uuid('moderated_by').references(() => users.id),
  isAutomatic: boolean('is_automatic').default(false).notNull(),
  
  // Content details
  originalContent: text('original_content'),
  flaggedContent: text('flagged_content'),
  confidence: decimal('confidence', { precision: 5, scale: 4 }), // for automatic moderation
  
  // Reporter info (if reported by user)
  reportedBy: uuid('reported_by').references(() => users.id),
  reportReason: varchar('report_reason', { length: 100 }),
  
  // Additional data
  moderationData: jsonb('moderation_data'),
  
  moderatedAt: timestamp('moderated_at').defaultNow().notNull(),
});

// GDPR/KVKV data requests
export const dataRequests = pgTable('data_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Requester details
  userId: uuid('user_id').references(() => users.id).notNull(),
  requestType: varchar('request_type', { length: 50 }).notNull(), // 'EXPORT', 'DELETE', 'RECTIFICATION'
  
  // Request details
  description: text('description'),
  dataTypes: jsonb('data_types').$type<string[]>().default([]), // specific data types requested
  
  // Processing
  status: varchar('status', { length: 50 }).default('PENDING').notNull(), // 'PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED'
  processedBy: uuid('processed_by').references(() => users.id),
  processedAt: timestamp('processed_at'),
  
  // Output
  resultData: jsonb('result_data'),
  resultFileUrl: varchar('result_file_url', { length: 500 }),
  
  // Legal compliance
  legalBasis: varchar('legal_basis', { length: 100 }),
  rejectionReason: text('rejection_reason'),
  
  // Timing
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  dueDate: timestamp('due_date').notNull(), // legal deadline
  completedAt: timestamp('completed_at'),
  
  // Communication
  notificationsSent: jsonb('notifications_sent').$type<{
    type: string;
    sentAt: string;
    recipient: string;
  }[]>().default([]),
});

// Relations
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const securityEventsRelations = relations(securityEvents, ({ one }) => ({
  user: one(users, {
    fields: [securityEvents.userId],
    references: [users.id],
  }),
  resolver: one(users, {
    fields: [securityEvents.resolvedBy],
    references: [users.id],
  }),
}));

export const moderationLogsRelations = relations(moderationLogs, ({ one }) => ({
  moderator: one(users, {
    fields: [moderationLogs.moderatedBy],
    references: [users.id],
  }),
  reporter: one(users, {
    fields: [moderationLogs.reportedBy],
    references: [users.id],
  }),
}));

export const dataRequestsRelations = relations(dataRequests, ({ one }) => ({
  user: one(users, {
    fields: [dataRequests.userId],
    references: [users.id],
  }),
  processor: one(users, {
    fields: [dataRequests.processedBy],
    references: [users.id],
  }),
}));
