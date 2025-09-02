-- Castlyo Database Initialization Script
-- This script creates the initial database structure

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE castlyo'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'castlyo')\gexec

-- Connect to the castlyo database
\c castlyo;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types (these will be replaced by Drizzle migrations)
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

-- Create admin user for initial setup
-- Password: admin123 (hashed with bcrypt)
INSERT INTO users (id, email, password_hash, role, status, email_verified, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'admin@castlyo.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iQeO',
    'ADMIN',
    'ACTIVE',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Create test user for development
-- Password: test123 (hashed with bcrypt)
INSERT INTO users (id, email, password_hash, role, status, email_verified, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'test@castlyo.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iQeO',
    'TALENT',
    'ACTIVE',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;
