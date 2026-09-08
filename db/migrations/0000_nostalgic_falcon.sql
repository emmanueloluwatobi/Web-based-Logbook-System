CREATE TABLE "academic_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"placement_id" uuid NOT NULL,
	"academic_scores" jsonb NOT NULL,
	"industry_scores" jsonb NOT NULL,
	"combined_score" numeric NOT NULL,
	"combined_grade" text NOT NULL,
	"finalized_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assessment_placement_id_unique" UNIQUE("placement_id")
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"placement_id" uuid NOT NULL,
	"date" date NOT NULL,
	"check_in" time NOT NULL,
	"check_out" time,
	"hours" numeric,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "department" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logbook_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"placement_id" uuid NOT NULL,
	"parent_entry_id" uuid,
	"version_number" integer DEFAULT 1 NOT NULL,
	"entry_date" date NOT NULL,
	"activity_description" text NOT NULL,
	"skills_gained" text,
	"challenges" text,
	"hours_worked" numeric NOT NULL,
	"attachment_url" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "monthly_industry_review" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"placement_id" uuid NOT NULL,
	"industry_supervisor_id" text NOT NULL,
	"review_month" text NOT NULL,
	"scores" jsonb NOT NULL,
	"comment" text NOT NULL,
	"attestation_name" text NOT NULL,
	"attestation_office_id" text NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"message" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"state_region" text NOT NULL,
	"industry_type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "placement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"school_supervisor_id" text NOT NULL,
	"industry_supervisor_id" text,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"target_days" integer NOT NULL,
	"placement_source" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "student_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"matric_number" text,
	"program_id" uuid,
	"level" text,
	"session_id" uuid,
	"phone" text,
	"profile_photo_url" text,
	"is_profile_complete" boolean DEFAULT false NOT NULL,
	CONSTRAINT "student_profile_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "student_profile_matric_number_unique" UNIQUE("matric_number")
);
--> statement-breakpoint
CREATE TABLE "supervisor_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"supervisor_id" text NOT NULL,
	"action" text NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"role" text NOT NULL,
	"department_id" uuid,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment" ADD CONSTRAINT "assessment_placement_id_placement_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."placement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_student_profile_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_placement_id_placement_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."placement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logbook_entry" ADD CONSTRAINT "logbook_entry_student_id_student_profile_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logbook_entry" ADD CONSTRAINT "logbook_entry_placement_id_placement_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."placement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logbook_entry" ADD CONSTRAINT "logbook_entry_parent_entry_id_logbook_entry_id_fk" FOREIGN KEY ("parent_entry_id") REFERENCES "public"."logbook_entry"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_industry_review" ADD CONSTRAINT "monthly_industry_review_placement_id_placement_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."placement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_industry_review" ADD CONSTRAINT "monthly_industry_review_industry_supervisor_id_user_id_fk" FOREIGN KEY ("industry_supervisor_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement" ADD CONSTRAINT "placement_student_id_student_profile_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement" ADD CONSTRAINT "placement_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement" ADD CONSTRAINT "placement_school_supervisor_id_user_id_fk" FOREIGN KEY ("school_supervisor_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement" ADD CONSTRAINT "placement_industry_supervisor_id_user_id_fk" FOREIGN KEY ("industry_supervisor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program" ADD CONSTRAINT "program_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profile" ADD CONSTRAINT "student_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profile" ADD CONSTRAINT "student_profile_program_id_program_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."program"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profile" ADD CONSTRAINT "student_profile_session_id_academic_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."academic_session"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supervisor_feedback" ADD CONSTRAINT "supervisor_feedback_entry_id_logbook_entry_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."logbook_entry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supervisor_feedback" ADD CONSTRAINT "supervisor_feedback_supervisor_id_user_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE set null ON UPDATE no action;