CREATE TABLE "discovery_events" (
	"id" text PRIMARY KEY NOT NULL,
	"location_hash" text NOT NULL,
	"status" text NOT NULL,
	"provider" text DEFAULT 'tavily' NOT NULL,
	"resources_found" integer DEFAULT 0 NOT NULL,
	"triggered_by_user_id" text,
	"metadata" json,
	"searched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tombstone" (
	"id" text PRIMARY KEY NOT NULL,
	"resource_name" text NOT NULL,
	"address" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"resource_id" text NOT NULL,
	"user_id" text NOT NULL,
	"vote" text NOT NULL CHECK (vote IN ('up', 'down')),
	"field" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "food_banks" ADD COLUMN "verification_status" text DEFAULT 'unverified' NOT NULL;--> statement-breakpoint
ALTER TABLE "food_banks" ADD COLUMN "import_source" text;--> statement-breakpoint
ALTER TABLE "food_banks" ADD COLUMN "auto_discovered_at" timestamp;--> statement-breakpoint
ALTER TABLE "food_banks" ADD COLUMN "community_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "food_banks" ADD COLUMN "admin_verified_by" text;--> statement-breakpoint
ALTER TABLE "discovery_events" ADD CONSTRAINT "discovery_events_triggered_by_user_id_user_id_fk" FOREIGN KEY ("triggered_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_verifications" ADD CONSTRAINT "user_verifications_resource_id_food_banks_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."food_banks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_verifications" ADD CONSTRAINT "user_verifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_banks" ADD CONSTRAINT "food_banks_admin_verified_by_user_id_fk" FOREIGN KEY ("admin_verified_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;