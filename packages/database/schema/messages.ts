import { pgTable, uuid, text, timestamp, jsonb, foreignKey, integer, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';
import { messageTypeEnum } from './enums';

export const messageThreads = pgTable('message_threads', {
  id: uuid('id').defaultRandom().primaryKey(),
  agencyId: uuid('agency_id').notNull().references(() => users.id),
  talentId: uuid('talent_id').notNull().references(() => users.id),
  
  // API'nin beklediği ek alanlar
  subject: text('subject'),
  agencyUnreadCount: integer('agency_unread_count').default(0),
  talentUnreadCount: integer('talent_unread_count').default(0),
  archivedByAgency: boolean('archived_by_agency').default(false),
  archivedByTalent: boolean('archived_by_talent').default(false),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  lastMessageAt: timestamp('last_message_at'),
});

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  threadId: uuid('thread_id').notNull().references(() => messageThreads.id),
  senderId: uuid('sender_id').notNull().references(() => users.id),
  messageType: messageTypeEnum('message_type').default('TEXT'),
  content: text('content').notNull(),
  contentPlain: text('content_plain'),
  attachments: jsonb('attachments').$type<Array<{url:string; name?:string; type?:string}>>().default([] as any),
  replyToMessageId: uuid('reply_to_message_id'),
  sentAt: timestamp('sent_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  replyToFk: foreignKey({
    columns: [table.replyToMessageId],
    foreignColumns: [table.id],
    name: 'messages_reply_to_fk',
  }).onDelete('set null'),
}));

export type MessageThread = typeof messageThreads.$inferSelect;
export type NewMessageThread = typeof messageThreads.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;