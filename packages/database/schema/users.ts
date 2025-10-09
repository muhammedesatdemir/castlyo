// schema/users.ts
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { userRoleEnum, userStatusEnum, genderEnum, talentGenderEnum, cityCodeEnum } from './enums';

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull(),
  status: userStatusEnum("status").notNull().default("PENDING"),
  emailVerified: boolean("email_verified").notNull().default(false),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

/**
 * TALENT profil tablosu
 */
export const talentProfiles = pgTable("talent_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),

  displayName: text("display_name"),
  bio: text("bio"),
  headline: text("headline"),
  // Dual city model: store free-text label and normalized code
  cityLabel: text("city_label"),
  city: cityCodeEnum("city"),
  country: text("country"),

  // API'nin beklediği isim alanları (users tablosundan da gelebilir)
  firstName: text("first_name"),
  lastName: text("last_name"),

  heightCm: integer("height_cm"),
  weightKg: integer("weight_kg"),

  // Profile image
  profileImage: text("profile_image"),
  
  // Personal info
  birthDate: text("birth_date"), // ISO date string
  gender: talentGenderEnum("gender"),
  resumeUrl: text("resume_url"),
  
  // API'nin beklediği ek alanlar
  specialties: text("specialties").array(), // PostgreSQL text[] array
  skills: text("skills").array(), // PostgreSQL text[] array
  languages: text("languages").array(), // PostgreSQL text[] array
  experience: text("experience"),

  // Publish status for discovery
  isPublic: boolean("is_public").notNull().default(false),
  publishedAt: timestamp("published_at"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type TalentProfile = typeof talentProfiles.$inferSelect;
export type NewTalentProfile = typeof talentProfiles.$inferInsert;

/**
 * AGENCY profil tablosu
 */
export const agencyProfiles = pgTable("agency_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),

  agencyName: text("agency_name"),
  companyName: text("company_name"), // API'nin beklediği alan
  about: text("about"),
  website: text("website"),
  address: text("address"),
  city: text("city"),
  country: text("country"),
  taxNumber: text("tax_number"),

  // Contact
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),

  // Expertise
  specialties: text("specialties").array(),

  // Verification
  isVerified: boolean("is_verified").notNull().default(false),
  verificationDocKey: text("verification_doc_key"),
  
  // **EKSİKLERİ EKLE** - Diğer servisler bu alanları kullanıyor
  logo: text("logo"),
  documentUrl: text("document_url"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AgencyProfile = typeof agencyProfiles.$inferSelect;
export type NewAgencyProfile = typeof agencyProfiles.$inferInsert;

/**
 * Guardian contacts table for minors (under 18)
 */
export const guardianContacts = pgTable("guardian_contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  talentProfileId: uuid("talent_profile_id")
    .notNull()
    .references(() => talentProfiles.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  relation: text("relation").notNull(), // 'mother' | 'father' | 'guardian' | 'other'
  phone: text("phone").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  onePerProfile: uniqueIndex("guardian_contacts_one_per_profile").on(t.talentProfileId),
}));

export type GuardianContact = typeof guardianContacts.$inferSelect;
export type NewGuardianContact = typeof guardianContacts.$inferInsert;
