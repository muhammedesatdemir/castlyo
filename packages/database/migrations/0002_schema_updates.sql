-- Schema updates migration
-- This migration updates existing schema to match new requirements

-- 1. Update job status enum values for backward compatibility
UPDATE job_posts SET status='PUBLISHED' WHERE status='ACTIVE';
UPDATE job_posts SET status='CLOSED' WHERE status='CANCELLED';

-- 2. Update job applications status enum values
UPDATE job_applications SET status='SUBMITTED' WHERE status='PENDING';

-- 3. Update contact permissions status enum values
UPDATE contact_permissions SET status='REQUESTED' WHERE status='PENDING';

-- 4. Convert payments amount to amount_cents (multiply by 100)
ALTER TABLE payments ADD COLUMN amount_cents integer;
UPDATE payments SET amount_cents = ROUND(amount * 100)::int WHERE amount_cents IS NULL;
-- Keep old amount column for now, will drop after verification

-- 5. Add new payment provider fields
ALTER TABLE payments ADD COLUMN provider_transaction_id text;
UPDATE payments SET provider_transaction_id = provider_ref WHERE provider_transaction_id IS NULL AND provider_ref IS NOT NULL;

-- 6. Add payment completion tracking
ALTER TABLE payments ADD COLUMN completed_at timestamptz;

-- 7. Add job review notes
ALTER TABLE job_posts ADD COLUMN review_notes text;

-- 8. Create job views tracking table
CREATE TABLE IF NOT EXISTS job_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
  viewer_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 9. Create index for job views
CREATE INDEX IF NOT EXISTS idx_job_views_job_id ON job_views(job_id);
CREATE INDEX IF NOT EXISTS idx_job_views_viewer_user_id ON job_views(viewer_user_id);

-- 10. Add message attachments support (JSONB array)
ALTER TABLE messages ADD COLUMN attachments jsonb DEFAULT '[]'::jsonb;

-- If you want to migrate existing attachment_url to new format:
-- UPDATE messages SET attachments = jsonb_build_array(jsonb_build_object('url', attachment_url, 'type', 'link')) 
--   WHERE attachment_url IS NOT NULL AND attachment_url != '';

-- 11. Add audience field to subscription plans
ALTER TABLE subscription_plans ADD COLUMN audience text NOT NULL DEFAULT 'ALL';

-- 12. Create user entitlements table
CREATE TABLE IF NOT EXISTS user_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  entitlement_type text NOT NULL,
  balance integer NOT NULL DEFAULT 0,
  total_allocated integer NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'SUBSCRIPTION',
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 13. Create indexes for user entitlements
CREATE INDEX IF NOT EXISTS idx_user_entitlements_user_id ON user_entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_entitlements_subscription_id ON user_entitlements(subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_entitlements_type ON user_entitlements(entitlement_type);

-- 14. Create user consents table
CREATE TABLE IF NOT EXISTS user_consents (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  marketing boolean NOT NULL DEFAULT false,
  data_sharing boolean NOT NULL DEFAULT false,
  communication boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 15. Create consent logs table for audit trail
CREATE TABLE IF NOT EXISTS consent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_role text NOT NULL,
  action text NOT NULL,
  resource text NOT NULL,
  resource_id text NOT NULL,
  details text,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 16. Create indexes for consent logs
CREATE INDEX IF NOT EXISTS idx_consent_logs_user_id ON consent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_action ON consent_logs(action);
CREATE INDEX IF NOT EXISTS idx_consent_logs_resource ON consent_logs(resource);
CREATE INDEX IF NOT EXISTS idx_consent_logs_created_at ON consent_logs(created_at);

-- 17. Add permissions tracking fields
ALTER TABLE permissions ADD COLUMN granted_at timestamptz;
ALTER TABLE permissions ADD COLUMN requested_at timestamptz DEFAULT now();

-- Update existing permissions with timestamps if not set
UPDATE permissions SET granted_at = created_at WHERE status = 'GRANTED' AND granted_at IS NULL;
UPDATE permissions SET requested_at = created_at WHERE requested_at IS NULL;

-- 18. Add talent profile reference to job applications
ALTER TABLE job_applications ADD COLUMN talent_profile_id uuid;
-- Note: We'll need to populate this in the backfill step based on user profiles

-- Add foreign key constraint (will need to ensure talent_profile_id is populated first)
-- ALTER TABLE job_applications ADD CONSTRAINT fk_job_applications_talent_profile 
--   FOREIGN KEY (talent_profile_id) REFERENCES talent_profiles(id) ON DELETE SET NULL;

COMMIT;
