import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { users, talentProfiles } from './users';
import { jobApplications } from './jobs';
import { permissionStatusEnum } from './enums';

export const contactPermissions = pgTable('contact_permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  applicationId: uuid('application_id').notNull().references(() => jobApplications.id, { onDelete: 'cascade' }),
  agencyId: uuid('agency_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  talentId: uuid('talent_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: permissionStatusEnum('status').default('REQUESTED'),
  
  // API'nin beklediği ek alanlar
  granted: boolean('granted').default(false),
  requestedAt: timestamp('requested_at').defaultNow(),
  revokedAt: timestamp('revoked_at'),
  requestContext: text('request_context'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  
  requestMessage: text('request_message'),
  grantedByUserId: uuid('granted_by_user_id').references(() => users.id),
  grantedAt: timestamp('granted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type ContactPermission = typeof contactPermissions.$inferSelect;
export type NewContactPermission = typeof contactPermissions.$inferInsert;