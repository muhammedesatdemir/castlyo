DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'job_status' AND e.enumlabel = 'OPEN'
  ) THEN
    ALTER TYPE job_status ADD VALUE 'OPEN';
  END IF;
END$$;

 