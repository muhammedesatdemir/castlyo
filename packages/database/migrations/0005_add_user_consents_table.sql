-- Create user_consents table for tracking consent versions
CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  accepted_terms BOOLEAN NOT NULL,
  accepted_privacy BOOLEAN NOT NULL,
  terms_version VARCHAR(32) NOT NULL,
  privacy_version VARCHAR(32) NOT NULL,
  accepted_ip INET,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_terms_version ON user_consents(terms_version);
CREATE INDEX IF NOT EXISTS idx_user_consents_privacy_version ON user_consents(privacy_version);
