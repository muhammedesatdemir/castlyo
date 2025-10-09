-- Migration: Add status and email_verified columns to users table
-- Date: 2025-01-08
-- Description: Adds missing status and email_verified columns that are causing 500 errors

-- 1) user_status enum'u yoksa oluştur (mevcut enum değerleri ile)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE user_status AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED');
  END IF;
END;
$$;

-- 2) users tablosuna kolonları ekle (yoksa)
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "status" user_status NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "email_verified" boolean NOT NULL DEFAULT false;

-- 3) Mevcut kayıtları güncelle (eğer varsa)
UPDATE "users" 
SET 
  "status" = 'ACTIVE',
  "email_verified" = true
WHERE "status" IS NULL OR "email_verified" IS NULL;
