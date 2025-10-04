-- Add age_min and age_max columns to job_posts table
ALTER TABLE "job_posts" ADD COLUMN "age_min" integer;
ALTER TABLE "job_posts" ADD COLUMN "age_max" integer;
