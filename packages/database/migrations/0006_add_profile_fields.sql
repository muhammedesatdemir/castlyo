-- Add missing profile fields to talent_profiles table
ALTER TABLE "talent_profiles" ADD COLUMN "birth_date" text;
ALTER TABLE "talent_profiles" ADD COLUMN "gender" gender;
ALTER TABLE "talent_profiles" ADD COLUMN "resume_url" text;
