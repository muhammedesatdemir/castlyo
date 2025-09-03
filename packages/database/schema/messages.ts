import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, pgEnum, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, talentProfiles, agencyProfiles } from './users';
import { contactPermissions } from './permissions';

// Enums
export const messageStatusEnum = pgEnum('message_status', ['SENT', 'DELIVERED', 'READ', 'DELETED']);
export const threadStatusEnum = pgEnum('thread_status', ['ACTIVE', 'ARCHIVED', 'BLOCKED']);
export const offerStatusEnum = pgEnum('offer_status', ['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED']);

// Message threads - conversation containers
export const messageThreads = pgTable('message_threads', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Participants
  agencyId: uuid('agency_id').references(() => agencyProfiles.id).notNull(),
  talentId: uuid('talent_id').references(() => talentProfiles.id).notNull(),
  contactPermissionId: uuid('contact_permission_id').references(() => contactPermissions.id),
  
  // Thread metadata
  subject: varchar('subject', { length: 300 }),
  status: threadStatusEnum('status').default('ACTIVE').notNull(),
  
  // Last activity
  lastMessageAt: timestamp('last_message_at'),
  lastMessagePreview: text('last_message_preview'),
  
  // Participant read status
  agencyLastReadAt: timestamp('agency_last_read_at'),
  talentLastReadAt: timestamp('talent_last_read_at'),
  agencyUnreadCount: integer('agency_unread_count').default(0).notNull(),
  talentUnreadCount: integer('talent_unread_count').default(0).notNull(),
  
  // Archive/block status
  archivedByAgency: boolean('archived_by_agency').default(false).notNull(),
  archivedByTalent: boolean('archived_by_talent').default(false).notNull(),
  blockedBy: uuid('blocked_by').references(() => users.id),
  blockedAt: timestamp('blocked_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Individual messages
export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  threadId: uuid('thread_id').references(() => messageThreads.id).notNull(),
  senderId: uuid('sender_id').references(() => users.id).notNull(),
  
  // Message content
  content: text('content').notNull(),
  attachments: jsonb('attachments').$type<{
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
  }[]>().default([]),
  
  // Message metadata
  status: messageStatusEnum('status').default('SENT').notNull(),
  isSystemMessage: boolean('is_system_message').default(false).notNull(),
  
  // Read receipts
  readBy: jsonb('read_by').$type<{
    userId: string;
    readAt: string;
  }[]>().default([]),
  
  // Editing and deletion
  editedAt: timestamp('edited_at'),
  deletedAt: timestamp('deleted_at'),
  deletedBy: uuid('deleted_by').references(() => users.id),
  
  // Reply functionality
  replyToMessageId: uuid('reply_to_message_id').references(() => messages.id),
  
  sentAt: timestamp('sent_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Message templates - for common responses
export const messageTemplates = pgTable('message_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  // Template details
  name: varchar('name', { length: 200 }).notNull(),
  subject: varchar('subject', { length: 300 }),
  content: text('content').notNull(),
  
  // Categorization
  category: varchar('category', { length: 100 }), // 'RESPONSE', 'FOLLOW_UP', 'REJECTION', etc.
  tags: jsonb('tags').$type<string[]>().default([]),
  
  // Usage
  isPublic: boolean('is_public').default(false).notNull(),
  usageCount: integer('usage_count').default(0).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Notification preferences
export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull().unique(),
  
  // Email notifications
  emailNewMessage: boolean('email_new_message').default(true).notNull(),
  emailApplicationUpdate: boolean('email_application_update').default(true).notNull(),
  emailPermissionRequest: boolean('email_permission_request').default(true).notNull(),
  emailJobMatch: boolean('email_job_match').default(true).notNull(),
  emailMarketing: boolean('email_marketing').default(false).notNull(),
  
  // SMS notifications
  smsEnabled: boolean('sms_enabled').default(false).notNull(),
  smsImportantOnly: boolean('sms_important_only').default(true).notNull(),
  
  // Push notifications
  pushEnabled: boolean('push_enabled').default(true).notNull(),
  pushNewMessage: boolean('push_new_message').default(true).notNull(),
  pushApplicationUpdate: boolean('push_application_update').default(true).notNull(),
  
  // Frequency settings
  emailDigestFrequency: varchar('email_digest_frequency', { length: 20 }).default('DAILY').notNull(), // 'NONE', 'DAILY', 'WEEKLY'
  quietHoursStart: varchar('quiet_hours_start', { length: 5 }), // e.g., '22:00'
  quietHoursEnd: varchar('quiet_hours_end', { length: 5 }), // e.g., '08:00'
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// System notifications/announcements
export const systemNotifications = pgTable('system_notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Content
  title: varchar('title', { length: 300 }).notNull(),
  content: text('content').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'INFO', 'WARNING', 'MAINTENANCE', 'FEATURE'
  
  // Targeting
  targetUserRole: varchar('target_user_role', { length: 20 }), // 'TALENT', 'AGENCY', 'ALL'
  targetUsers: jsonb('target_users').$type<string[]>(), // specific user IDs
  
  // Scheduling
  publishAt: timestamp('publish_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
  
  // Status
  isActive: boolean('is_active').default(true).notNull(),
  priority: integer('priority').default(0).notNull(), // higher = more important
  
  // Analytics
  viewCount: integer('view_count').default(0).notNull(),
  clickCount: integer('click_count').default(0).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User notification read status
export const userNotificationReads = pgTable('user_notification_reads', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  notificationId: uuid('notification_id').references(() => systemNotifications.id).notNull(),
  readAt: timestamp('read_at').defaultNow().notNull(),
});

// Job offers - for talent casting/project offers
export const offers = pgTable('offers', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Participants
  agencyId: uuid('agency_id').references(() => users.id).notNull(),
  talentId: uuid('talent_id').references(() => users.id).notNull(),
  contactPermissionId: uuid('contact_permission_id').references(() => contactPermissions.id),
  
  // Offer details
  title: varchar('title', { length: 300 }).notNull(),
  description: text('description').notNull(),
  projectType: varchar('project_type', { length: 100 }), // film, dizi, reklam, etc.
  
  // Financial details
  budgetMin: integer('budget_min'),
  budgetMax: integer('budget_max'),
  currency: varchar('currency', { length: 10 }).default('TRY').notNull(),
  paymentTerms: text('payment_terms'),
  
  // Timeline
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  applicationDeadline: timestamp('application_deadline'),
  
  // Location and requirements
  location: varchar('location', { length: 200 }),
  requirements: jsonb('requirements').$type<string[]>().default([]),
  
  // Status and workflow
  status: offerStatusEnum('status').default('PENDING').notNull(),
  respondedAt: timestamp('responded_at'),
  responseMessage: text('response_message'),
  
  // Expiration
  expiresAt: timestamp('expires_at'),
  
  // Metadata
  isUrgent: boolean('is_urgent').default(false).notNull(),
  tags: jsonb('tags').$type<string[]>().default([]),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const messageThreadsRelations = relations(messageThreads, ({ one, many }) => ({
  agency: one(agencyProfiles, {
    fields: [messageThreads.agencyId],
    references: [agencyProfiles.id],
  }),
  talent: one(talentProfiles, {
    fields: [messageThreads.talentId],
    references: [talentProfiles.id],
  }),
  contactPermission: one(contactPermissions, {
    fields: [messageThreads.contactPermissionId],
    references: [contactPermissions.id],
  }),
  blocker: one(users, {
    fields: [messageThreads.blockedBy],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  thread: one(messageThreads, {
    fields: [messages.threadId],
    references: [messageThreads.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  deleter: one(users, {
    fields: [messages.deletedBy],
    references: [users.id],
  }),
  replyToMessage: one(messages, {
    fields: [messages.replyToMessageId],
    references: [messages.id],
  }),
  replies: many(messages),
}));

export const messageTemplatesRelations = relations(messageTemplates, ({ one }) => ({
  user: one(users, {
    fields: [messageTemplates.userId],
    references: [users.id],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

export const userNotificationReadsRelations = relations(userNotificationReads, ({ one }) => ({
  user: one(users, {
    fields: [userNotificationReads.userId],
    references: [users.id],
  }),
  notification: one(systemNotifications, {
    fields: [userNotificationReads.notificationId],
    references: [systemNotifications.id],
  }),
}));

export const offersRelations = relations(offers, ({ one }) => ({
  agency: one(users, {
    fields: [offers.agencyId],
    references: [users.id],
  }),
  talent: one(users, {
    fields: [offers.talentId],
    references: [users.id],
  }),
  contactPermission: one(contactPermissions, {
    fields: [offers.contactPermissionId],
    references: [contactPermissions.id],
  }),
}));
