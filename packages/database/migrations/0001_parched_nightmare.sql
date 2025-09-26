-- =========================
-- SAFE / IDEMPOTENT MIGRATION
-- =========================

-- Enum'lar: varsa yaratma sırasında hata yut
DO $$ BEGIN
  CREATE TYPE "public"."gender" AS ENUM ('MALE','FEMALE','OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- audit_action: yeni değerleri idempotent ekle
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'DATA_SHARED';
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'CONTACT_GRANTED';
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'CONTACT_REQUESTED';

-- Yeni tablolar (create table)
CREATE TABLE IF NOT EXISTS "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_user_id" uuid NOT NULL,
	"agency_profile_id" uuid,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"location" text,
	"category" text,
	"application_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"grantee_user_id" uuid NOT NULL,
	"talent_profile_id" uuid,
	"agency_profile_id" uuid,
	"scope" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "email_verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);

-- RLS kapatma: tablo yoksa hata vermesin
ALTER TABLE IF EXISTS "user_consents" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "contact_permissions" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "job_posts" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "job_views" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "message_templates" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "message_threads" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "notification_preferences" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "system_notifications" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "user_notification_reads" DISABLE ROW LEVEL SECURITY;

-- Eski tabloları varsa düşür
DROP TABLE IF EXISTS "user_consents" CASCADE;
DROP TABLE IF EXISTS "contact_permissions" CASCADE;
DROP TABLE IF EXISTS "job_posts" CASCADE;
DROP TABLE IF EXISTS "job_views" CASCADE;
DROP TABLE IF EXISTS "message_templates" CASCADE;
DROP TABLE IF EXISTS "message_threads" CASCADE;
DROP TABLE IF EXISTS "notification_preferences" CASCADE;
DROP TABLE IF EXISTS "system_notifications" CASCADE;
DROP TABLE IF EXISTS "user_notification_reads" CASCADE;

-- Eski FK'leri varsa düşür (yoksa hata verme)
ALTER TABLE IF EXISTS "agency_profiles" DROP CONSTRAINT IF EXISTS "agency_profiles_verified_by_users_id_fk";
ALTER TABLE IF EXISTS "agency_profiles" DROP CONSTRAINT IF EXISTS "agency_profiles_user_id_users_id_fk";
ALTER TABLE IF EXISTS "talent_profiles" DROP CONSTRAINT IF EXISTS "talent_profiles_user_id_users_id_fk";
ALTER TABLE IF EXISTS "job_applications" DROP CONSTRAINT IF EXISTS "job_applications_job_id_job_posts_id_fk";
ALTER TABLE IF EXISTS "job_applications" DROP CONSTRAINT IF EXISTS "job_applications_talent_id_talent_profiles_id_fk";
ALTER TABLE IF EXISTS "job_applications" DROP CONSTRAINT IF EXISTS "job_applications_reviewed_by_users_id_fk";
ALTER TABLE IF EXISTS "messages" DROP CONSTRAINT IF EXISTS "messages_thread_id_message_threads_id_fk";
ALTER TABLE IF EXISTS "messages" DROP CONSTRAINT IF EXISTS "messages_reply_to_message_id_messages_id_fk";

-- messages.status'ı enum'a çevirme akışı (güvenli)
-- 1) text'e çevir
ALTER TABLE IF EXISTS "messages" ALTER COLUMN "status" SET DATA TYPE text;
ALTER TABLE IF EXISTS "messages" ALTER COLUMN "status" SET DEFAULT 'SENT';

-- 2) eski tip varsa düşür
DROP TYPE IF EXISTS "public"."message_status";

-- 3) enum'u güvenli yarat
DO $$ BEGIN
  CREATE TYPE "public"."message_status" AS ENUM ('SENT','DELIVERED','READ');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4) default'u enum'a bağla + tip çevir
ALTER TABLE IF EXISTS "messages" ALTER COLUMN "status" SET DEFAULT 'SENT'::"public"."message_status";
ALTER TABLE IF EXISTS "messages" ALTER COLUMN "status" SET DATA TYPE "public"."message_status" USING "status"::"public"."message_status";

-- Bazı kolon tip/durum düzenlemeleri (tablolar varsa uygula)
ALTER TABLE IF EXISTS "agency_profiles" ALTER COLUMN "website" SET DATA TYPE text;
ALTER TABLE IF EXISTS "agency_profiles" ALTER COLUMN "city" SET DATA TYPE text;
ALTER TABLE IF EXISTS "agency_profiles" ALTER COLUMN "country" SET DATA TYPE text;
ALTER TABLE IF EXISTS "agency_profiles" ALTER COLUMN "country" DROP DEFAULT;

ALTER TABLE IF EXISTS "talent_profiles" ALTER COLUMN "display_name" SET DATA TYPE text;
ALTER TABLE IF EXISTS "talent_profiles" ALTER COLUMN "city" SET DATA TYPE text;
ALTER TABLE IF EXISTS "talent_profiles" ALTER COLUMN "country" SET DATA TYPE text;
ALTER TABLE IF EXISTS "talent_profiles" ALTER COLUMN "country" DROP DEFAULT;

ALTER TABLE IF EXISTS "users" ALTER COLUMN "email" SET DATA TYPE text;
ALTER TABLE IF EXISTS "users" ALTER COLUMN "phone" SET DATA TYPE text;
ALTER TABLE IF EXISTS "users" ALTER COLUMN "password_hash" SET DATA TYPE text;
ALTER TABLE IF EXISTS "users" ALTER COLUMN "password_hash" DROP NOT NULL;

ALTER TABLE IF EXISTS "users" ALTER COLUMN "role" SET DEFAULT 'TALENT';

-- messages.thread_id nullable
ALTER TABLE IF EXISTS "messages" ALTER COLUMN "thread_id" DROP NOT NULL;

-- Yeni kolonlar (idempotent)
ALTER TABLE IF EXISTS "agency_profiles" ADD COLUMN IF NOT EXISTS "agency_name" text;
ALTER TABLE IF EXISTS "agency_profiles" ADD COLUMN IF NOT EXISTS "about" text;

ALTER TABLE IF EXISTS "talent_profiles" ADD COLUMN IF NOT EXISTS "headline" text;
ALTER TABLE IF EXISTS "talent_profiles" ADD COLUMN IF NOT EXISTS "height_cm" integer;
ALTER TABLE IF EXISTS "talent_profiles" ADD COLUMN IF NOT EXISTS "weight_kg" integer;

ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "first_name" text;
ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "last_name" text;

-- "gender" enum tipi yukarıda garanti edildi
ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "gender" "gender";

ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "profile_photo_url" text;
ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "profile_photo_key" text;
ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;

ALTER TABLE IF EXISTS "job_applications" ADD COLUMN IF NOT EXISTS "talent_profile_id" uuid NOT NULL;
ALTER TABLE IF EXISTS "job_applications" ADD COLUMN IF NOT EXISTS "applicant_user_id" uuid NOT NULL;

ALTER TABLE IF EXISTS "messages" ADD COLUMN IF NOT EXISTS "is_pinned" boolean DEFAULT false NOT NULL;

-- Yeni FK'ler (idempotent oluşturma)
DO $$ BEGIN
  ALTER TABLE "jobs" ADD CONSTRAINT "jobs_agency_user_id_users_id_fk"
    FOREIGN KEY ("agency_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "jobs" ADD CONSTRAINT "jobs_agency_profile_id_agency_profiles_id_fk"
    FOREIGN KEY ("agency_profile_id") REFERENCES "public"."agency_profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "permissions" ADD CONSTRAINT "permissions_owner_user_id_users_id_fk"
    FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "permissions" ADD CONSTRAINT "permissions_grantee_user_id_users_id_fk"
    FOREIGN KEY ("grantee_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "permissions" ADD CONSTRAINT "permissions_talent_profile_id_talent_profiles_id_fk"
    FOREIGN KEY ("talent_profile_id") REFERENCES "public"."talent_profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "permissions" ADD CONSTRAINT "permissions_agency_profile_id_agency_profiles_id_fk"
    FOREIGN KEY ("agency_profile_id") REFERENCES "public"."agency_profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "agency_profiles" ADD CONSTRAINT "agency_profiles_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "talent_profiles" ADD CONSTRAINT "talent_profiles_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_id_jobs_id_fk"
    FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_talent_profile_id_talent_profiles_id_fk"
    FOREIGN KEY ("talent_profile_id") REFERENCES "public"."talent_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_applicant_user_id_users_id_fk"
    FOREIGN KEY ("applicant_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "messages" ADD CONSTRAINT "messages_reply_to_fk"
    FOREIGN KEY ("reply_to_message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Eski kolonları güvenle düşür (varsa)
ALTER TABLE IF EXISTS "agency_profiles" DROP COLUMN IF EXISTS "company_name";
ALTER TABLE IF EXISTS "agency_profiles" DROP COLUMN IF EXISTS "trade_name";
ALTER TABLE IF EXISTS "agency_profiles" DROP COLUMN IF EXISTS "tax_number";
ALTER TABLE IF EXISTS "agency_profiles" DROP COLUMN IF EXISTS "description";
ALTER TABLE IF EXISTS "agency_profiles" DROP COLUMN IF EXISTS "contact_person";
ALTER TABLE IF EXISTS "agency_profiles" DROP COLUMN IF EXISTS "contact_email";
ALTER TABLE IF EXISTS "agency_profiles" DROP COLUMN IF EXISTS "contact_phone";
ALTER TABLE IF EXISTS "agency_profiles" DROP COLUMN IF EXISTS "address";
ALTER TABLE IF EXISTS "agency_profiles" DROP COLUMN IF EXISTS "is_verified";
ALTER TABLE IF EXISTS "agency_profiles" DROP COLUMN IF EXISTS "verification_documents";
ALTER TABLE IF EXISTS "agency_profiles" DROP COLUMN IF EXISTS "verified_at";
ALTER TABLE IF EXISTS "agency_profiles" DROP COLUMN IF EXISTS "verified_by";
ALTER TABLE IF EXISTS "agency_profiles" DROP COLUMN IF EXISTS "logo";
ALTER TABLE IF EXISTS "agency_profiles" DROP COLUMN IF EXISTS "cover_image";
ALTER TABLE IF EXISTS "agency_profiles" DROP COLUMN IF EXISTS "specialties";

ALTER TABLE IF EXISTS "talent_profiles" DROP COLUMN IF EXISTS "first_name";
ALTER TABLE IF EXISTS "talent_profiles" DROP COLUMN IF EXISTS "last_name";
ALTER TABLE IF EXISTS "talent_profiles" DROP COLUMN IF EXISTS "date_of_birth";
ALTER TABLE IF EXISTS "talent_profiles" DROP COLUMN IF EXISTS "gender";
ALTER TABLE IF EXISTS "talent_profiles" DROP COLUMN IF EXISTS "height";
ALTER TABLE IF EXISTS "talent_profiles" DROP COLUMN IF EXISTS "weight";
ALTER TABLE IF EXISTS "talent_profiles" DROP COLUMN IF EXISTS "eye_color";
ALTER TABLE IF EXISTS "talent_profiles" DROP COLUMN IF EXISTS "hair_color";
ALTER TABLE IF EXISTS "talent_profiles" DROP COLUMN IF EXISTS "experience";
ALTER TABLE IF EXISTS "talent_profiles" DROP COLUMN IF EXISTS "skills";
ALTER TABLE IF EXISTS "talent_profiles" DROP COLUMN IF EXISTS "languages";
ALTER TABLE IF EXISTS "talent_profiles" DROP COLUMN IF EXISTS "specialties";
ALTER TABLE IF EXISTS "talent_profiles" DROP COLUMN IF EXISTS "profile_image";
ALTER TABLE IF EXISTS "talent_profiles" DROP COLUMN IF EXISTS "portfolio_images";
ALTER TABLE IF EXISTS "talent_profiles" DROP COLUMN IF EXISTS "portfolio_videos";
ALTER TABLE IF EXISTS "talent_profiles" DROP COLUMN IF EXISTS "is_public";
ALTER TABLE IF EXISTS "talent_profiles" DROP COLUMN IF EXISTS "boosted_until";
ALTER TABLE IF EXISTS "talent_profiles" DROP COLUMN IF EXISTS "profile_views";

ALTER TABLE IF EXISTS "users" DROP COLUMN IF EXISTS "status";
ALTER TABLE IF EXISTS "users" DROP COLUMN IF EXISTS "email_verified";
ALTER TABLE IF EXISTS "users" DROP COLUMN IF EXISTS "phone_verified";
ALTER TABLE IF EXISTS "users" DROP COLUMN IF EXISTS "two_factor_enabled";
ALTER TABLE IF EXISTS "users" DROP COLUMN IF EXISTS "last_login_at";

ALTER TABLE IF EXISTS "job_applications" DROP COLUMN IF EXISTS "talent_id";
ALTER TABLE IF EXISTS "job_applications" DROP COLUMN IF EXISTS "selected_media";
ALTER TABLE IF EXISTS "job_applications" DROP COLUMN IF EXISTS "additional_notes";
ALTER TABLE IF EXISTS "job_applications" DROP COLUMN IF EXISTS "status";
ALTER TABLE IF EXISTS "job_applications" DROP COLUMN IF EXISTS "reviewed_at";
ALTER TABLE IF EXISTS "job_applications" DROP COLUMN IF EXISTS "reviewed_by";
ALTER TABLE IF EXISTS "job_applications" DROP COLUMN IF EXISTS "review_notes";
ALTER TABLE IF EXISTS "job_applications" DROP COLUMN IF EXISTS "profile_viewed_by_agency";
ALTER TABLE IF EXISTS "job_applications" DROP COLUMN IF EXISTS "profile_viewed_at";

ALTER TABLE IF EXISTS "messages" DROP COLUMN IF EXISTS "read_by";

-- Eski enum tipleri varsa düşür
DROP TYPE IF EXISTS "public"."user_status";
DROP TYPE IF EXISTS "public"."application_status";
DROP TYPE IF EXISTS "public"."contact_permission_status";
DROP TYPE IF EXISTS "public"."job_status";
DROP TYPE IF EXISTS "public"."job_type";
DROP TYPE IF EXISTS "public"."thread_status";
