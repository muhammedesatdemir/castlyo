-- Castlyo Database Initialization Script
-- This script creates the complete database structure with all necessary tables
-- Based on the Drizzle schema and migrations

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('TALENT', 'AGENCY', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE gender AS ENUM ('MALE', 'FEMALE', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('DRAFT', 'PUBLISHED', 'PAUSED', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE application_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE permission_action AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'MANAGE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table (core table)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    status user_status DEFAULT 'PENDING' NOT NULL,
    email_verified BOOLEAN DEFAULT false NOT NULL,
    phone_verified BOOLEAN DEFAULT false NOT NULL,
    two_factor_enabled BOOLEAN DEFAULT false NOT NULL,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Talent profiles table
CREATE TABLE IF NOT EXISTS talent_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(200),
    bio TEXT,
    date_of_birth TIMESTAMP,
    gender gender,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'TR',
    height INTEGER,
    weight INTEGER,
    eye_color VARCHAR(50),
    hair_color VARCHAR(50),
    experience TEXT,
    skills JSONB DEFAULT '[]'::jsonb,
    languages JSONB DEFAULT '[]'::jsonb,
    specialties JSONB DEFAULT '[]'::jsonb,
    profile_image VARCHAR(500),
    portfolio_images JSONB DEFAULT '[]'::jsonb,
    portfolio_videos JSONB DEFAULT '[]'::jsonb,
    is_public BOOLEAN DEFAULT true NOT NULL,
    boosted_until TIMESTAMP,
    profile_views INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL,
    CONSTRAINT talent_profiles_user_id_unique UNIQUE(user_id)
);

-- User consents table
CREATE TABLE IF NOT EXISTS user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type VARCHAR(100) NOT NULL,
    version VARCHAR(20) NOT NULL,
    consented BOOLEAN NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    consented_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Refresh tokens table (for JWT authentication)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    location VARCHAR(200),
    is_remote BOOLEAN DEFAULT false NOT NULL,
    salary_min INTEGER,
    salary_max INTEGER,
    currency VARCHAR(3) DEFAULT 'TRY',
    application_deadline TIMESTAMP,
    shoot_start_date TIMESTAMP,
    shoot_end_date TIMESTAMP,
    status job_status DEFAULT 'DRAFT' NOT NULL,
    is_featured BOOLEAN DEFAULT false NOT NULL,
    views_count INTEGER DEFAULT 0 NOT NULL,
    applications_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Job applications table
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    talent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    status application_status DEFAULT 'PENDING' NOT NULL,
    applied_at TIMESTAMP DEFAULT now() NOT NULL,
    reviewed_at TIMESTAMP,
    CONSTRAINT job_applications_job_talent_unique UNIQUE(job_id, talent_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    subject VARCHAR(500),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY' NOT NULL,
    status payment_status DEFAULT 'PENDING' NOT NULL,
    payment_method VARCHAR(50),
    provider_transaction_id VARCHAR(255),
    provider_payment_id VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource VARCHAR(100) NOT NULL,
    action permission_action NOT NULL,
    granted BOOLEAN DEFAULT true NOT NULL,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL,
    starts_at TIMESTAMP DEFAULT now() NOT NULL,
    ends_at TIMESTAMP,
    auto_renew BOOLEAN DEFAULT true NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Create additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_talent_profiles_user_id ON talent_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens (token);
CREATE INDEX IF NOT EXISTS idx_jobs_agency_id ON jobs (agency_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications (job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_talent_id ON job_applications (talent_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages (recipient_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments (user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_user_id ON permissions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions (user_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_updated_at'
    ) THEN
        CREATE TRIGGER trg_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_talent_profiles_updated_at'
    ) THEN
        CREATE TRIGGER trg_talent_profiles_updated_at
        BEFORE UPDATE ON talent_profiles
        FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_jobs_updated_at'
    ) THEN
        CREATE TRIGGER trg_jobs_updated_at
        BEFORE UPDATE ON jobs
        FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_messages_updated_at'
    ) THEN
        CREATE TRIGGER trg_messages_updated_at
        BEFORE UPDATE ON messages
        FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_payments_updated_at'
    ) THEN
        CREATE TRIGGER trg_payments_updated_at
        BEFORE UPDATE ON payments
        FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_subscriptions_updated_at'
    ) THEN
        CREATE TRIGGER trg_subscriptions_updated_at
        BEFORE UPDATE ON subscriptions
        FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
    END IF;
END$$;

-- Seed data: admin user
-- Password: Test1234! (hashed with bcrypt rounds=12)
INSERT INTO users (email, password_hash, role, status, email_verified, created_at, updated_at)
VALUES (
    'admin@castlyo.com',
    '$2b$12$UKldg60Hz8lGXsMNk2K5nurTlJJaJ0N8O3z5E8KMJtU5fOZf/PHNO',
    'ADMIN',
    'ACTIVE',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Seed data: test talent user
-- Password: Test1234! (hashed with bcrypt rounds=12)
INSERT INTO users (email, password_hash, role, status, email_verified, created_at, updated_at)
VALUES (
    'talent@castlyo.com',
    '$2b$12$UKldg60Hz8lGXsMNk2K5nurTlJJaJ0N8O3z5E8KMJtU5fOZf/PHNO',
    'TALENT',
    'ACTIVE',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Seed data: test agency user
-- Password: Test1234! (hashed with bcrypt rounds=12)
INSERT INTO users (email, password_hash, role, status, email_verified, created_at, updated_at)
VALUES (
    'agency@castlyo.com',
    '$2b$12$UKldg60Hz8lGXsMNk2K5nurTlJJaJ0N8O3z5E8KMJtU5fOZf/PHNO',
    'AGENCY',
    'ACTIVE',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Create talent profile for test talent user
INSERT INTO talent_profiles (user_id, first_name, last_name, display_name, bio, city, country, is_public, created_at, updated_at)
SELECT 
    u.id,
    'Test',
    'Talent',
    'Test Talent',
    'Test talent profile for development and testing purposes.',
    'Istanbul',
    'TR',
    true,
    NOW(),
    NOW()
FROM users u 
WHERE u.email = 'talent@castlyo.com'
ON CONFLICT (user_id) DO NOTHING;

-- Record initial consents for test users
INSERT INTO user_consents (user_id, consent_type, version, consented, consented_at)
SELECT 
    u.id,
    'KVKK',
    '1.0',
    true,
    NOW()
FROM users u 
WHERE u.email IN ('admin@castlyo.com', 'talent@castlyo.com', 'agency@castlyo.com')
ON CONFLICT DO NOTHING;

INSERT INTO user_consents (user_id, consent_type, version, consented, consented_at)
SELECT 
    u.id,
    'TERMS',
    '1.0',
    true,
    NOW()
FROM users u 
WHERE u.email IN ('admin@castlyo.com', 'talent@castlyo.com', 'agency@castlyo.com')
ON CONFLICT DO NOTHING;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Database initialization completed successfully!';
    RAISE NOTICE 'Created users: admin@castlyo.com, talent@castlyo.com, agency@castlyo.com';
    RAISE NOTICE 'Default password for all test users: Test1234!';
END$$;
