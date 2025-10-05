BEGIN;

-- 1) job_applications.job_id -> job_posts.id
ALTER TABLE job_applications
  DROP CONSTRAINT IF EXISTS job_applications_job_id_jobs_id_fk;

ALTER TABLE job_applications
  ADD CONSTRAINT job_applications_job_id_job_posts_id_fk
  FOREIGN KEY (job_id) REFERENCES job_posts(id) ON DELETE CASCADE;

-- 2) Zorunlu/uyumluluk alanları
ALTER TABLE job_applications
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'SUBMITTED',
  ADD COLUMN IF NOT EXISTS review_notes text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamp without time zone,
  ADD COLUMN IF NOT EXISTS talent_id uuid;

ALTER TABLE job_applications
  DROP CONSTRAINT IF EXISTS job_applications_talent_id_fkey;

ALTER TABLE job_applications
  ADD CONSTRAINT job_applications_talent_id_fkey
  FOREIGN KEY (talent_id) REFERENCES talent_profiles(id) ON DELETE CASCADE;

-- 3) Duplicate koruması (varsa dokunmaz)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conrelid = 'job_applications'::regclass
    AND    conname = 'uq_job_applications_job_user'
  ) THEN
    ALTER TABLE job_applications
      ADD CONSTRAINT uq_job_applications_job_user UNIQUE (job_id, applicant_user_id);
  END IF;
END$$;

-- 4) (Opsiyonel) sayaç kolonu – varsa dokunma
ALTER TABLE job_posts
  ADD COLUMN IF NOT EXISTS current_applications integer NOT NULL DEFAULT 0;

COMMIT;


