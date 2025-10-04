import { pgTable, uuid, text, timestamp, boolean, integer, foreignKey } from 'drizzle-orm/pg-core';
import { users, agencyProfiles, talentProfiles } from './users';
import { locationTypeEnum, jobTypeEnum, experienceLevelEnum, genderRequirementEnum, jobStatusEnum } from './enums';

export const jobPosts = pgTable('job_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  agencyId: uuid('agency_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  city: text('city'),
  locationType: locationTypeEnum('location_type').default('ONSITE'),
  jobType: jobTypeEnum('job_type').notNull(),
  experienceLevel: experienceLevelEnum('experience_level'),
  genderRequirement: genderRequirementEnum('gender_requirement').default('ANY'),
  isUrgent: boolean('is_urgent').default(false),
  isFeatured: boolean('is_featured').default(false),
  applicationDeadline: timestamp('application_deadline'),
  publishedAt: timestamp('published_at'),
  salaryMin: integer('salary_min'),
  salaryMax: integer('salary_max'),
  ageMin: integer('age_min'),
  ageMax: integer('age_max'),
  currency: text('currency').default('TRY'),
  specialties: text('specialties').array().default([]),
  status: jobStatusEnum('status').default('DRAFT'),
  
  // API compatibility fields
  currentApplications: integer('current_applications').default(0),
  reviewNotes: text('review_notes'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const jobApplications = pgTable('job_applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobId: uuid('job_id').notNull().references(() => jobPosts.id, { onDelete: 'cascade' }),
  talentProfileId: uuid('talent_profile_id').notNull().references(() => talentProfiles.id, { onDelete: 'cascade' }),
  applicantUserId: uuid('applicant_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // API compatibility: talentId alias for talentProfileId
  talentId: uuid('talent_id').references(() => talentProfiles.id, { onDelete: 'cascade' }),
  
  status: text('status').$type<'SUBMITTED'|'REVIEWING'|'REJECTED'|'OFFERED'|'HIRED'>().default('SUBMITTED'),
  coverLetter: text('cover_letter'),
  reviewNotes: text('review_notes'), // API'nin beklediği alan
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const jobViews = pgTable('job_views', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobId: uuid('job_id').notNull().references(() => jobPosts.id, { onDelete: 'cascade' }),
  viewerUserId: uuid('viewer_user_id').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type JobPost = typeof jobPosts.$inferSelect;
export type NewJobPost = typeof jobPosts.$inferInsert;
export type JobApplication = typeof jobApplications.$inferSelect;
export type NewJobApplication = typeof jobApplications.$inferInsert;