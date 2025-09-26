-- Stabilize enum creation with guards to prevent "already exists" errors
-- This migration ensures enums are created safely without conflicts

-- Create enums with guards (PostgreSQL)
DO $$ BEGIN
  CREATE TYPE public.gender AS ENUM ('MALE','FEMALE','OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('TALENT','AGENCY','ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.user_status AS ENUM ('PENDING','ACTIVE','SUSPENDED','DELETED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.gender_requirement AS ENUM ('ANY','MALE','FEMALE','OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.location_type AS ENUM ('ONSITE','REMOTE','HYBRID');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.job_type AS ENUM ('FULL_TIME','PART_TIME','CONTRACT','INTERN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.exp_level AS ENUM ('JUNIOR','MID','SENIOR','LEAD');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.job_status AS ENUM ('DRAFT','PUBLISHED','CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.message_type AS ENUM ('TEXT','IMAGE','FILE','SYSTEM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.perm_status AS ENUM ('REQUESTED','GRANTED','DENIED','REVOKED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.plan_type AS ENUM ('FREE','PRO','TEAM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.plan_audience AS ENUM ('TALENT','AGENCY','BOTH');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_provider AS ENUM ('STRIPE','IYZICO','MOCK');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('PENDING','SUCCEEDED','FAILED','REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.audit_action AS ENUM (
    'CREATE','UPDATE','DELETE','LOGIN','LOGOUT','VIEW','DOWNLOAD','EXPORT',
    'DATA_SHARED','CONTACT_GRANTED','CONTACT_REQUESTED','CONTACT_REVOKED',
    'CONSENT_GRANTED','CONSENT_REVOKED',
    'DATA_SHARING_RESTRICTED','MARKETING_STOPPED','COMMUNICATION_RESTRICTED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
