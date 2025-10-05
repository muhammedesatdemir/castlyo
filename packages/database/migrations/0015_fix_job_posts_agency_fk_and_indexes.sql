BEGIN;

-- Fix job_posts.agency_id FK to reference agency_profiles(id)
ALTER TABLE job_posts
  DROP CONSTRAINT IF EXISTS job_posts_agency_id_users_id_fk;

ALTER TABLE job_posts
  DROP CONSTRAINT IF EXISTS job_posts_agency_id_agency_profiles_id_fk;

ALTER TABLE job_posts
  ADD CONSTRAINT job_posts_agency_id_agency_profiles_id_fk
  FOREIGN KEY (agency_id) REFERENCES agency_profiles(id) ON DELETE CASCADE;

-- Recommended indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user ON job_applications(applicant_user_id);
CREATE INDEX IF NOT EXISTS idx_job_posts_agency_id ON job_posts(agency_id);

COMMIT;


