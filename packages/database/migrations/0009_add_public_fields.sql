-- Add isPublic and publishedAt fields to talent_profiles table
ALTER TABLE "talent_profiles" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;
ALTER TABLE "talent_profiles" ADD COLUMN "published_at" timestamp;
