-- Add guardian_contacts table for minors
CREATE TABLE IF NOT EXISTS "guardian_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"talent_profile_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"relation" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "guardian_contacts_talent_profile_id_fkey" FOREIGN KEY ("talent_profile_id") REFERENCES "talent_profiles"("id") ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "guardian_contacts_one_per_profile" ON "guardian_contacts" USING btree ("talent_profile_id");
