CREATE TABLE "admin_audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text NOT NULL,
	"action" text NOT NULL,
	"resource_id" text,
	"affected_ids" json,
	"changes" json,
	"reason" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resource_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"resource_id" text NOT NULL,
	"version" integer NOT NULL,
	"snapshot" json NOT NULL,
	"changed_fields" json,
	"changed_by" text NOT NULL,
	"change_reason" text,
	"sources" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "food_banks" ADD COLUMN "geom" geometry(point);--> statement-breakpoint
ALTER TABLE "food_banks" ADD COLUMN "admin_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "food_banks" ADD COLUMN "potential_duplicates" text[];--> statement-breakpoint
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_admin_id_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_resource_id_food_banks_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."food_banks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_versions" ADD CONSTRAINT "resource_versions_resource_id_food_banks_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."food_banks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "geom_idx" ON "food_banks" USING gist ("geom");