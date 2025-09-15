import { pgTable, uuid, varchar, text, timestamp, boolean, pgEnum, jsonb, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['TALENT', 'AGENCY', 'ADMIN']);
export const userStatusEnum = pgEnum('user_status', ['PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED']);
export const genderEnum = pgEnum('gender', ['MALE', 'FEMALE', 'OTHER']);

// Users table - base user information
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull(),
  status: userStatusEnum('status').default('PENDING').notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  phoneVerified: boolean('phone_verified').default(false).notNull(),
  twoFactorEnabled: boolean('two_factor_enabled').default(false).notNull(),
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Talent profiles - for individual users (actors, models, etc.)
export const talentProfiles = pgTable('talent_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  displayName: varchar('display_name', { length: 200 }),
  bio: text('bio'),
  dateOfBirth: timestamp('date_of_birth'),
  gender: genderEnum('gender'),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 100 }).default('TR'),
  
  // Physical attributes
  height: integer('height'), // in cm
  weight: integer('weight'), // in kg
  eyeColor: varchar('eye_color', { length: 50 }),
  hairColor: varchar('hair_color', { length: 50 }),
  
  // Professional info
  experience: text('experience'),
  skills: jsonb('skills').$type<string[]>().default([]),
  languages: jsonb('languages').$type<string[]>().default([]),
  specialties: jsonb('specialties').$type<string[]>().default([]), // acting, modeling, voice-over, etc.
  
  // Media
  profilePhotoUrl: text('profile_photo_url').default(null), // Avatar URL
  profilePhotoKey: text('profile_photo_key').default(null), // (Opsiyonel) S3/Supabase path
  portfolioImages: jsonb('portfolio_images').$type<string[]>().default([]),
  portfolioVideos: jsonb('portfolio_videos').$type<string[]>().default([]),
  
  // Visibility settings
  isPublic: boolean('is_public').default(true).notNull(),
  visibility: varchar('visibility', { length: 30 }).default('public').notNull(), // public, only-applied-agencies, private
  boostedUntil: timestamp('boosted_until'),
  profileViews: integer('profile_views').default(0).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Agency profiles - for companies/agencies
export const agencyProfiles = pgTable('agency_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull().unique(),
  companyName: varchar('company_name', { length: 200 }).notNull(),
  tradeName: varchar('trade_name', { length: 200 }),
  taxNumber: varchar('tax_number', { length: 50 }),
  description: text('description'),
  website: varchar('website', { length: 500 }),
  
  // Contact info
  contactPerson: varchar('contact_person', { length: 200 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 20 }),
  
  // Address
  address: text('address'),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 100 }).default('TR'),
  
  // Verification
  isVerified: boolean('is_verified').default(false).notNull(),
  verificationDocuments: jsonb('verification_documents').$type<string[]>().default([]),
  verifiedAt: timestamp('verified_at'),
  verifiedBy: uuid('verified_by').references(() => users.id),
  
  // Company logo and media
  logo: varchar('logo', { length: 500 }),
  coverImage: varchar('cover_image', { length: 500 }),
  
  // Specialties and focus areas
  specialties: jsonb('specialties').$type<string[]>().default([]), // film, tv, commercial, fashion, etc.
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// KVKK and consent management
export const userConsents = pgTable('user_consents', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  consentType: varchar('consent_type', { length: 100 }).notNull(), // 'KVKK', 'MARKETING', 'COMMUNICATION'
  version: varchar('version', { length: 20 }).notNull(),
  consented: boolean('consented').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  consentedAt: timestamp('consented_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  talentProfile: one(talentProfiles),
  agencyProfile: one(agencyProfiles),
  consents: many(userConsents),
}));

export const talentProfilesRelations = relations(talentProfiles, ({ one }) => ({
  user: one(users, {
    fields: [talentProfiles.userId],
    references: [users.id],
  }),
}));

export const agencyProfilesRelations = relations(agencyProfiles, ({ one }) => ({
  user: one(users, {
    fields: [agencyProfiles.userId],
    references: [users.id],
  }),
  verifier: one(users, {
    fields: [agencyProfiles.verifiedBy],
    references: [users.id],
  }),
}));

export const userConsentsRelations = relations(userConsents, ({ one }) => ({
  user: one(users, {
    fields: [userConsents.userId],
    references: [users.id],
  }),
}));
