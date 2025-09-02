CREATE TYPE "public"."audit_action" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'DOWNLOAD', 'EXPORT');--> statement-breakpoint
CREATE TYPE "public"."audit_entity_type" AS ENUM('USER', 'TALENT_PROFILE', 'AGENCY_PROFILE', 'JOB_POST', 'APPLICATION', 'MESSAGE', 'PAYMENT', 'SUBSCRIPTION');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('MALE', 'FEMALE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('TALENT', 'AGENCY', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('PENDING', 'REVIEWED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."contact_permission_status" AS ENUM('PENDING', 'GRANTED', 'DENIED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('DRAFT', 'ACTIVE', 'CLOSED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('FILM', 'TV_SERIES', 'COMMERCIAL', 'THEATER', 'FASHION', 'MUSIC_VIDEO', 'PHOTO_SHOOT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('SENT', 'DELIVERED', 'READ', 'DELETED');--> statement-breakpoint
CREATE TYPE "public"."thread_status" AS ENUM('ACTIVE', 'ARCHIVED', 'BLOCKED');--> statement-breakpoint
CREATE TYPE "public"."entitlement_type" AS ENUM('APPLICATION_QUOTA', 'JOB_POST_QUOTA', 'CONTACT_PERMISSION_QUOTA', 'PROFILE_BOOST_DAYS', 'FEATURED_LISTING', 'PRIORITY_SUPPORT', 'ADVANCED_SEARCH', 'ANALYTICS_ACCESS');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."plan_type" AS ENUM('TALENT', 'AGENCY');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"user_email" varchar(255),
	"user_role" varchar(50),
	"action" "audit_action" NOT NULL,
	"entity_type" "audit_entity_type" NOT NULL,
	"entity_id" uuid,
	"description" text,
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"request_id" uuid,
	"session_id" varchar(255),
	"metadata" jsonb,
	"performed_at" timestamp DEFAULT now() NOT NULL,
	"retention_until" timestamp
);
--> statement-breakpoint
CREATE TABLE "data_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"request_type" varchar(50) NOT NULL,
	"description" text,
	"data_types" jsonb DEFAULT '[]'::jsonb,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"processed_by" uuid,
	"processed_at" timestamp,
	"result_data" jsonb,
	"result_file_url" varchar(500),
	"legal_basis" varchar(100),
	"rejection_reason" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"due_date" timestamp NOT NULL,
	"completed_at" timestamp,
	"notifications_sent" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint
CREATE TABLE "moderation_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"moderation_type" varchar(50) NOT NULL,
	"action" varchar(50) NOT NULL,
	"reason" text,
	"moderated_by" uuid,
	"is_automatic" boolean DEFAULT false NOT NULL,
	"original_content" text,
	"flagged_content" text,
	"confidence" numeric(5, 4),
	"reported_by" uuid,
	"report_reason" varchar(100),
	"moderation_data" jsonb,
	"moderated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"description" text NOT NULL,
	"user_id" uuid,
	"user_email" varchar(255),
	"ip_address" varchar(45),
	"user_agent" text,
	"request_path" varchar(500),
	"event_data" jsonb,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"resolved_by" uuid,
	"resolved_at" timestamp,
	"resolution_notes" text,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"retention_until" timestamp
);
--> statement-breakpoint
CREATE TABLE "agency_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_name" varchar(200) NOT NULL,
	"trade_name" varchar(200),
	"tax_number" varchar(50),
	"description" text,
	"website" varchar(500),
	"contact_person" varchar(200),
	"contact_email" varchar(255),
	"contact_phone" varchar(20),
	"address" text,
	"city" varchar(100),
	"country" varchar(100) DEFAULT 'TR',
	"is_verified" boolean DEFAULT false NOT NULL,
	"verification_documents" jsonb DEFAULT '[]'::jsonb,
	"verified_at" timestamp,
	"verified_by" uuid,
	"logo" varchar(500),
	"cover_image" varchar(500),
	"specialties" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agency_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "talent_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"display_name" varchar(200),
	"bio" text,
	"date_of_birth" timestamp,
	"gender" "gender",
	"city" varchar(100),
	"country" varchar(100) DEFAULT 'TR',
	"height" integer,
	"weight" integer,
	"eye_color" varchar(50),
	"hair_color" varchar(50),
	"experience" text,
	"skills" jsonb DEFAULT '[]'::jsonb,
	"languages" jsonb DEFAULT '[]'::jsonb,
	"specialties" jsonb DEFAULT '[]'::jsonb,
	"profile_image" varchar(500),
	"portfolio_images" jsonb DEFAULT '[]'::jsonb,
	"portfolio_videos" jsonb DEFAULT '[]'::jsonb,
	"is_public" boolean DEFAULT true NOT NULL,
	"boosted_until" timestamp,
	"profile_views" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "talent_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"consent_type" varchar(100) NOT NULL,
	"version" varchar(20) NOT NULL,
	"consented" boolean NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"consented_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"password_hash" varchar(255) NOT NULL,
	"role" "user_role" NOT NULL,
	"status" "user_status" DEFAULT 'PENDING' NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"phone_verified" boolean DEFAULT false NOT NULL,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "contact_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"agency_id" uuid NOT NULL,
	"talent_id" uuid NOT NULL,
	"request_message" text,
	"status" "contact_permission_status" DEFAULT 'PENDING' NOT NULL,
	"response_message" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp,
	"expires_at" timestamp,
	"allow_email" boolean DEFAULT false NOT NULL,
	"allow_phone" boolean DEFAULT false NOT NULL,
	"allow_messaging" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"talent_id" uuid NOT NULL,
	"cover_letter" text,
	"selected_media" jsonb DEFAULT '[]'::jsonb,
	"additional_notes" text,
	"status" "application_status" DEFAULT 'PENDING' NOT NULL,
	"reviewed_at" timestamp,
	"reviewed_by" uuid,
	"review_notes" text,
	"profile_viewed_by_agency" boolean DEFAULT false NOT NULL,
	"profile_viewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"title" varchar(300) NOT NULL,
	"description" text NOT NULL,
	"job_type" "job_type" NOT NULL,
	"project_name" varchar(200),
	"requirements" text,
	"age_min" integer,
	"age_max" integer,
	"gender_requirement" varchar(20),
	"height_min" integer,
	"height_max" integer,
	"skills" jsonb DEFAULT '[]'::jsonb,
	"languages" jsonb DEFAULT '[]'::jsonb,
	"city" varchar(100),
	"country" varchar(100) DEFAULT 'TR',
	"shooting_start_date" timestamp,
	"shooting_end_date" timestamp,
	"application_deadline" timestamp,
	"budget_range" varchar(100),
	"payment_type" varchar(50),
	"additional_benefits" text,
	"status" "job_status" DEFAULT 'DRAFT' NOT NULL,
	"is_urgent" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"max_applications" integer DEFAULT 50 NOT NULL,
	"current_applications" integer DEFAULT 0 NOT NULL,
	"slug" varchar(400),
	"tags" jsonb DEFAULT '[]'::jsonb,
	"published_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "job_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "job_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"viewer_id" uuid,
	"ip_address" varchar(45),
	"user_agent" text,
	"viewed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"subject" varchar(300),
	"content" text NOT NULL,
	"category" varchar(100),
	"tags" jsonb DEFAULT '[]'::jsonb,
	"is_public" boolean DEFAULT false NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"talent_id" uuid NOT NULL,
	"contact_permission_id" uuid,
	"subject" varchar(300),
	"status" "thread_status" DEFAULT 'ACTIVE' NOT NULL,
	"last_message_at" timestamp,
	"last_message_preview" text,
	"agency_last_read_at" timestamp,
	"talent_last_read_at" timestamp,
	"agency_unread_count" integer DEFAULT 0 NOT NULL,
	"talent_unread_count" integer DEFAULT 0 NOT NULL,
	"archived_by_agency" boolean DEFAULT false NOT NULL,
	"archived_by_talent" boolean DEFAULT false NOT NULL,
	"blocked_by" uuid,
	"blocked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"content" text NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"status" "message_status" DEFAULT 'SENT' NOT NULL,
	"is_system_message" boolean DEFAULT false NOT NULL,
	"read_by" jsonb DEFAULT '[]'::jsonb,
	"edited_at" timestamp,
	"deleted_at" timestamp,
	"deleted_by" uuid,
	"reply_to_message_id" uuid,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email_new_message" boolean DEFAULT true NOT NULL,
	"email_application_update" boolean DEFAULT true NOT NULL,
	"email_permission_request" boolean DEFAULT true NOT NULL,
	"email_job_match" boolean DEFAULT true NOT NULL,
	"email_marketing" boolean DEFAULT false NOT NULL,
	"sms_enabled" boolean DEFAULT false NOT NULL,
	"sms_important_only" boolean DEFAULT true NOT NULL,
	"push_enabled" boolean DEFAULT true NOT NULL,
	"push_new_message" boolean DEFAULT true NOT NULL,
	"push_application_update" boolean DEFAULT true NOT NULL,
	"email_digest_frequency" varchar(20) DEFAULT 'DAILY' NOT NULL,
	"quiet_hours_start" varchar(5),
	"quiet_hours_end" varchar(5),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "system_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(300) NOT NULL,
	"content" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"target_user_role" varchar(20),
	"target_users" jsonb,
	"publish_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_notification_reads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"notification_id" uuid NOT NULL,
	"read_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entitlement_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entitlement_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"usage_type" varchar(100) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"related_entity_id" uuid,
	"related_entity_type" varchar(50),
	"metadata" jsonb,
	"used_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subscription_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'TRY' NOT NULL,
	"status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_transaction_id" varchar(255),
	"provider_response" jsonb,
	"payment_method" varchar(50),
	"last_four_digits" varchar(4),
	"initiated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"failed_at" timestamp,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"plan_type" "plan_type" NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'TRY' NOT NULL,
	"duration_days" integer NOT NULL,
	"features" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_popular" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subscription_id" uuid,
	"type" "entitlement_type" NOT NULL,
	"balance" integer NOT NULL,
	"total_allocated" integer NOT NULL,
	"expires_at" timestamp,
	"is_expired" boolean DEFAULT false NOT NULL,
	"source" varchar(100) DEFAULT 'SUBSCRIPTION' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" "subscription_status" DEFAULT 'PENDING' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"paid_amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'TRY' NOT NULL,
	"payment_provider" varchar(50),
	"payment_id" varchar(255),
	"auto_renew" boolean DEFAULT false NOT NULL,
	"renewal_attempts" integer DEFAULT 0 NOT NULL,
	"cancelled_at" timestamp,
	"cancellation_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_requests" ADD CONSTRAINT "data_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_requests" ADD CONSTRAINT "data_requests_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_logs" ADD CONSTRAINT "moderation_logs_moderated_by_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_logs" ADD CONSTRAINT "moderation_logs_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_profiles" ADD CONSTRAINT "agency_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_profiles" ADD CONSTRAINT "agency_profiles_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talent_profiles" ADD CONSTRAINT "talent_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_permissions" ADD CONSTRAINT "contact_permissions_application_id_job_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."job_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_permissions" ADD CONSTRAINT "contact_permissions_agency_id_agency_profiles_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agency_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_permissions" ADD CONSTRAINT "contact_permissions_talent_id_talent_profiles_id_fk" FOREIGN KEY ("talent_id") REFERENCES "public"."talent_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_id_job_posts_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_talent_id_talent_profiles_id_fk" FOREIGN KEY ("talent_id") REFERENCES "public"."talent_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_posts" ADD CONSTRAINT "job_posts_agency_id_agency_profiles_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agency_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_views" ADD CONSTRAINT "job_views_job_id_job_posts_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_views" ADD CONSTRAINT "job_views_viewer_id_users_id_fk" FOREIGN KEY ("viewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_agency_id_agency_profiles_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agency_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_talent_id_talent_profiles_id_fk" FOREIGN KEY ("talent_id") REFERENCES "public"."talent_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_contact_permission_id_contact_permissions_id_fk" FOREIGN KEY ("contact_permission_id") REFERENCES "public"."contact_permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_blocked_by_users_id_fk" FOREIGN KEY ("blocked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_message_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."message_threads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_reply_to_message_id_messages_id_fk" FOREIGN KEY ("reply_to_message_id") REFERENCES "public"."messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notification_reads" ADD CONSTRAINT "user_notification_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notification_reads" ADD CONSTRAINT "user_notification_reads_notification_id_system_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."system_notifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlement_usage" ADD CONSTRAINT "entitlement_usage_entitlement_id_user_entitlements_id_fk" FOREIGN KEY ("entitlement_id") REFERENCES "public"."user_entitlements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlement_usage" ADD CONSTRAINT "entitlement_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_subscription_id_user_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_entitlements" ADD CONSTRAINT "user_entitlements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_entitlements" ADD CONSTRAINT "user_entitlements_subscription_id_user_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;