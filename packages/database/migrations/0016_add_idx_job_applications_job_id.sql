-- Optional performance index for counting applications per job
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);


