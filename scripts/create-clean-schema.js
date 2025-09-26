#!/usr/bin/env node

const postgres = require('postgres');
require('dotenv').config({ path: 'dev.env' });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:AdminReis97@localhost:5432/castlyo';

async function createCleanSchema() {
  const sql = postgres(DATABASE_URL, { max: 1 });

  try {
    console.log('🔄 Creating clean Drizzle schema...');
    
    // Drop old Prisma tables (they're empty anyway)
    console.log('🗑️  Dropping old Prisma tables...');
    await sql.unsafe(`DROP TABLE IF EXISTS "Profile" CASCADE`);
    await sql.unsafe(`DROP TABLE IF EXISTS "User" CASCADE`);
    await sql.unsafe(`DROP TABLE IF EXISTS "_prisma_migrations" CASCADE`);
    
    console.log('🏗️  Creating enums...');
    
    // Create enums
    await sql.unsafe(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('TALENT', 'AGENCY', 'ADMIN');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await sql.unsafe(`
      DO $$ BEGIN
        CREATE TYPE user_status AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await sql.unsafe(`
      DO $$ BEGIN
        CREATE TYPE job_status AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await sql.unsafe(`
      DO $$ BEGIN
        CREATE TYPE application_status AS ENUM ('SUBMITTED', 'REVIEWED', 'ACCEPTED', 'REJECTED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await sql.unsafe(`
      DO $$ BEGIN
        CREATE TYPE permission_status AS ENUM ('REQUESTED', 'GRANTED', 'DENIED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await sql.unsafe(`
      DO $$ BEGIN
        CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await sql.unsafe(`
      DO $$ BEGIN
        CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await sql.unsafe(`
      DO $$ BEGIN
        CREATE TYPE gender AS ENUM ('MALE', 'FEMALE', 'OTHER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await sql.unsafe(`
      DO $$ BEGIN
        CREATE TYPE exp_level AS ENUM ('BEGINNER', 'AMATEUR', 'SEMI_PRO', 'PROFESSIONAL');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await sql.unsafe(`
      DO $$ BEGIN
        CREATE TYPE entitlement_type AS ENUM ('JOB_POSTS', 'APPLICATIONS', 'FEATURED_POSTS', 'PRIORITY_SUPPORT');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await sql.unsafe(`
      DO $$ BEGIN
        CREATE TYPE message_status AS ENUM ('SENT', 'DELIVERED', 'READ');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    console.log('✅ Enums created');
    
    console.log('🏗️  Creating tables...');
    
    // Users table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text UNIQUE NOT NULL,
        password_hash text NOT NULL,
        role user_role NOT NULL DEFAULT 'TALENT',
        status user_status NOT NULL DEFAULT 'PENDING',
        email_verified boolean NOT NULL DEFAULT false,
        email_verification_token text,
        password_reset_token text,
        password_reset_expires timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    
    // Talent profiles
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS talent_profiles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        first_name text,
        last_name text,
        bio text,
        phone text,
        city text,
        gender gender,
        birth_date date,
        experience exp_level,
        height_cm integer,
        weight_kg integer,
        specialties text[],
        languages text[],
        portfolio_urls text[],
        social_media jsonb DEFAULT '{}'::jsonb,
        availability_status text DEFAULT 'AVAILABLE',
        hourly_rate_min integer,
        hourly_rate_max integer,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(user_id)
      );
    `);
    
    // Agency profiles
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS agency_profiles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company_name text NOT NULL,
        description text,
        website text,
        phone text,
        address text,
        city text,
        tax_number text,
        contact_person text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(user_id)
      );
    `);
    
    // Job posts
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS job_posts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        agency_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title text NOT NULL,
        description text NOT NULL,
        requirements jsonb DEFAULT '{}'::jsonb,
        location text,
        job_type text,
        status job_status NOT NULL DEFAULT 'DRAFT',
        budget_min integer,
        budget_max integer,
        application_deadline timestamptz,
        review_notes text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    
    // Job applications
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS job_applications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id uuid NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
        talent_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        talent_profile_id uuid REFERENCES talent_profiles(id) ON DELETE SET NULL,
        cover_letter text,
        portfolio_items jsonb DEFAULT '[]'::jsonb,
        status application_status NOT NULL DEFAULT 'SUBMITTED',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(job_id, talent_user_id)
      );
    `);
    
    // Messages
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recipient_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        thread_id uuid,
        subject text,
        content text NOT NULL,
        attachments jsonb DEFAULT '[]'::jsonb,
        status message_status NOT NULL DEFAULT 'SENT',
        read_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    
    // Permissions
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS permissions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        requester_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        target_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        permission_type text NOT NULL,
        status permission_status NOT NULL DEFAULT 'REQUESTED',
        requested_at timestamptz NOT NULL DEFAULT now(),
        granted_at timestamptz,
        expires_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(requester_id, target_user_id, permission_type)
      );
    `);
    
    // Contact permissions
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS contact_permissions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        requester_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        target_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        job_id uuid REFERENCES job_posts(id) ON DELETE SET NULL,
        status permission_status NOT NULL DEFAULT 'REQUESTED',
        requested_at timestamptz NOT NULL DEFAULT now(),
        granted_at timestamptz,
        expires_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    
    // Payments
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS payments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount_cents integer NOT NULL,
        currency text NOT NULL DEFAULT 'TRY',
        description text,
        status payment_status NOT NULL DEFAULT 'PENDING',
        provider text NOT NULL,
        provider_transaction_id text,
        provider_ref text,
        completed_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    
    // Subscription plans
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        description text,
        price_cents integer NOT NULL,
        currency text NOT NULL DEFAULT 'TRY',
        billing_period text NOT NULL DEFAULT 'MONTHLY',
        features jsonb DEFAULT '{}'::jsonb,
        audience text NOT NULL DEFAULT 'ALL',
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    
    // User subscriptions
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_id uuid NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
        status subscription_status NOT NULL DEFAULT 'ACTIVE',
        period_start timestamptz NOT NULL,
        period_end timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    
    // User entitlements
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS user_entitlements (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subscription_id uuid REFERENCES user_subscriptions(id) ON DELETE SET NULL,
        entitlement_type entitlement_type NOT NULL,
        balance integer NOT NULL DEFAULT 0,
        total_allocated integer NOT NULL DEFAULT 0,
        source text NOT NULL DEFAULT 'SUBSCRIPTION',
        expires_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    
    // Job views
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS job_views (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id uuid NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
        viewer_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        ip_address text,
        user_agent text,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    
    // User consents
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS user_consents (
        user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        marketing boolean NOT NULL DEFAULT false,
        data_sharing boolean NOT NULL DEFAULT false,
        communication boolean NOT NULL DEFAULT true,
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    
    // Consent logs
    await sql.unsafe(`
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
    `);
    
    // Audit logs
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        action text NOT NULL,
        resource text NOT NULL,
        resource_id text NOT NULL,
        old_values jsonb,
        new_values jsonb,
        ip_address text,
        user_agent text,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    
    console.log('✅ All tables created');
    
    console.log('📊 Creating indexes...');
    
    await sql.unsafe(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
      
      CREATE INDEX IF NOT EXISTS idx_talent_profiles_user_id ON talent_profiles(user_id);
      CREATE INDEX IF NOT EXISTS idx_agency_profiles_user_id ON agency_profiles(user_id);
      
      CREATE INDEX IF NOT EXISTS idx_job_posts_agency_id ON job_posts(agency_id);
      CREATE INDEX IF NOT EXISTS idx_job_posts_status ON job_posts(status);
      CREATE INDEX IF NOT EXISTS idx_job_posts_created_at ON job_posts(created_at);
      
      CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
      CREATE INDEX IF NOT EXISTS idx_job_applications_talent_user_id ON job_applications(talent_user_id);
      CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
      
      CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
      CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
      
      CREATE INDEX IF NOT EXISTS idx_permissions_requester_id ON permissions(requester_id);
      CREATE INDEX IF NOT EXISTS idx_permissions_target_user_id ON permissions(target_user_id);
      CREATE INDEX IF NOT EXISTS idx_permissions_status ON permissions(status);
      
      CREATE INDEX IF NOT EXISTS idx_contact_permissions_requester_id ON contact_permissions(requester_id);
      CREATE INDEX IF NOT EXISTS idx_contact_permissions_target_user_id ON contact_permissions(target_user_id);
      CREATE INDEX IF NOT EXISTS idx_contact_permissions_job_id ON contact_permissions(job_id);
      
      CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
      
      CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_entitlements_user_id ON user_entitlements(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_entitlements_subscription_id ON user_entitlements(subscription_id);
      CREATE INDEX IF NOT EXISTS idx_user_entitlements_type ON user_entitlements(entitlement_type);
      
      CREATE INDEX IF NOT EXISTS idx_job_views_job_id ON job_views(job_id);
      CREATE INDEX IF NOT EXISTS idx_job_views_viewer_user_id ON job_views(viewer_user_id);
      
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
      
      CREATE INDEX IF NOT EXISTS idx_consent_logs_user_id ON consent_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_consent_logs_action ON consent_logs(action);
      CREATE INDEX IF NOT EXISTS idx_consent_logs_resource ON consent_logs(resource);
      CREATE INDEX IF NOT EXISTS idx_consent_logs_created_at ON consent_logs(created_at);
    `);
    
    console.log('✅ All indexes created');
    
    console.log('🎉 Clean schema creation completed successfully!');
    
    // Verify tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log(`\n📋 Created ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`  ✅ ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('💥 Schema creation failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

createCleanSchema().catch(console.error);
