import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, pgEnum, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, agencyProfiles, talentProfiles } from './users';

// Enums
export const jobStatusEnum = pgEnum('job_status', ['DRAFT', 'ACTIVE', 'CLOSED', 'CANCELLED']);
export const jobTypeEnum = pgEnum('job_type', ['FILM', 'TV_SERIES', 'COMMERCIAL', 'THEATER', 'FASHION', 'MUSIC_VIDEO', 'PHOTO_SHOOT', 'OTHER']);
export const applicationStatusEnum = pgEnum('application_status', ['PENDING', 'REVIEWED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED']);
export const contactPermissionStatusEnum = pgEnum('contact_permission_status', ['PENDING', 'GRANTED', 'DENIED', 'EXPIRED']);

// Job posts - casting calls and opportunities
export const jobPosts = pgTable('job_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  agencyId: uuid('agency_id').references(() => agencyProfiles.id).notNull(),
  
  // Basic info
  title: varchar('title', { length: 300 }).notNull(),
  description: text('description').notNull(),
  jobType: jobTypeEnum('job_type').notNull(),
  projectName: varchar('project_name', { length: 200 }),
  
  // Requirements
  requirements: text('requirements'),
  ageMin: integer('age_min'),
  ageMax: integer('age_max'),
  genderRequirement: varchar('gender_requirement', { length: 20 }), // 'MALE', 'FEMALE', 'ANY'
  heightMin: integer('height_min'),
  heightMax: integer('height_max'),
  skills: jsonb('skills').$type<string[]>().default([]),
  languages: jsonb('languages').$type<string[]>().default([]),
  
  // Location and timing
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 100 }).default('TR'),
  shootingStartDate: timestamp('shooting_start_date'),
  shootingEndDate: timestamp('shooting_end_date'),
  applicationDeadline: timestamp('application_deadline'),
  
  // Budget and compensation
  budgetRange: varchar('budget_range', { length: 100 }), // e.g., "1000-5000 TL"
  paymentType: varchar('payment_type', { length: 50 }), // 'HOURLY', 'DAILY', 'PROJECT', 'ROYALTY'
  additionalBenefits: text('additional_benefits'),
  
  // Status and visibility
  status: jobStatusEnum('status').default('DRAFT').notNull(),
  isUrgent: boolean('is_urgent').default(false).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  
  // Quotas and limits (based on agency package)
  maxApplications: integer('max_applications').default(50).notNull(),
  currentApplications: integer('current_applications').default(0).notNull(),
  
  // SEO and tags
  slug: varchar('slug', { length: 400 }).unique(),
  tags: jsonb('tags').$type<string[]>().default([]),
  
  // Dates
  publishedAt: timestamp('published_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Job applications - when talents apply to jobs
export const jobApplications = pgTable('job_applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobId: uuid('job_id').references(() => jobPosts.id).notNull(),
  talentId: uuid('talent_id').references(() => talentProfiles.id).notNull(),
  
  // Application content
  coverLetter: text('cover_letter'),
  selectedMedia: jsonb('selected_media').$type<string[]>().default([]), // specific photos/videos for this application
  additionalNotes: text('additional_notes'),
  
  // Status tracking
  status: applicationStatusEnum('status').default('PENDING').notNull(),
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewNotes: text('review_notes'),
  
  // Analytics
  profileViewedByAgency: boolean('profile_viewed_by_agency').default(false).notNull(),
  profileViewedAt: timestamp('profile_viewed_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Contact permissions - for secure communication
export const contactPermissions = pgTable('contact_permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  applicationId: uuid('application_id').references(() => jobApplications.id).notNull(),
  agencyId: uuid('agency_id').references(() => agencyProfiles.id).notNull(),
  talentId: uuid('talent_id').references(() => talentProfiles.id).notNull(),
  
  // Permission details
  requestMessage: text('request_message'),
  status: contactPermissionStatusEnum('status').default('PENDING').notNull(),
  responseMessage: text('response_message'),
  
  // Timing
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  respondedAt: timestamp('responded_at'),
  expiresAt: timestamp('expires_at'),
  
  // What information can be shared
  allowEmail: boolean('allow_email').default(false).notNull(),
  allowPhone: boolean('allow_phone').default(false).notNull(),
  allowMessaging: boolean('allow_messaging').default(true).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Job views tracking (for analytics)
export const jobViews = pgTable('job_views', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobId: uuid('job_id').references(() => jobPosts.id).notNull(),
  viewerId: uuid('viewer_id').references(() => users.id),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  viewedAt: timestamp('viewed_at').defaultNow().notNull(),
});

// Relations
export const jobPostsRelations = relations(jobPosts, ({ one, many }) => ({
  agency: one(agencyProfiles, {
    fields: [jobPosts.agencyId],
    references: [agencyProfiles.id],
  }),
  applications: many(jobApplications),
  views: many(jobViews),
}));

export const jobApplicationsRelations = relations(jobApplications, ({ one, many }) => ({
  job: one(jobPosts, {
    fields: [jobApplications.jobId],
    references: [jobPosts.id],
  }),
  talent: one(talentProfiles, {
    fields: [jobApplications.talentId],
    references: [talentProfiles.id],
  }),
  reviewer: one(users, {
    fields: [jobApplications.reviewedBy],
    references: [users.id],
  }),
  contactPermissions: many(contactPermissions),
}));

export const contactPermissionsRelations = relations(contactPermissions, ({ one }) => ({
  application: one(jobApplications, {
    fields: [contactPermissions.applicationId],
    references: [jobApplications.id],
  }),
  agency: one(agencyProfiles, {
    fields: [contactPermissions.agencyId],
    references: [agencyProfiles.id],
  }),
  talent: one(talentProfiles, {
    fields: [contactPermissions.talentId],
    references: [talentProfiles.id],
  }),
}));

export const jobViewsRelations = relations(jobViews, ({ one }) => ({
  job: one(jobPosts, {
    fields: [jobViews.jobId],
    references: [jobPosts.id],
  }),
  viewer: one(users, {
    fields: [jobViews.viewerId],
    references: [users.id],
  }),
}));
