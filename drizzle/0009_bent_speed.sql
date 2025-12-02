CREATE TABLE "points_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"points" integer NOT NULL,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_claims" (
	"id" text PRIMARY KEY NOT NULL,
	"resource_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"claim_reason" text,
	"verification_info" text,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "food_banks" ADD COLUMN "claimed_by" text;--> statement-breakpoint
ALTER TABLE "food_banks" ADD COLUMN "claimed_at" timestamp;--> statement-breakpoint
ALTER TABLE "food_banks" ADD COLUMN "provider_role" text;--> statement-breakpoint
ALTER TABLE "food_banks" ADD COLUMN "provider_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "food_banks" ADD COLUMN "provider_can_edit" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "points" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "level" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "badges" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "verification_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "accuracy_score" numeric(5, 2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "points_history" ADD CONSTRAINT "points_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_claims" ADD CONSTRAINT "provider_claims_resource_id_food_banks_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."food_banks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_claims" ADD CONSTRAINT "provider_claims_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_claims" ADD CONSTRAINT "provider_claims_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_points_history_user_id" ON "points_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_points_history_created_at" ON "points_history" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "provider_claims_resource_id_idx" ON "provider_claims" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "provider_claims_user_id_idx" ON "provider_claims" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "provider_claims_status_idx" ON "provider_claims" USING btree ("status");--> statement-breakpoint
CREATE INDEX "provider_claims_created_at_idx" ON "provider_claims" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "food_banks" ADD CONSTRAINT "food_banks_claimed_by_user_id_fk" FOREIGN KEY ("claimed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "food_banks_claimed_by_idx" ON "food_banks" USING btree ("claimed_by");--> statement-breakpoint
CREATE INDEX "idx_user_profiles_points" ON "user_profiles" USING btree ("points" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_user_profiles_level" ON "user_profiles" USING btree ("level" DESC NULLS LAST);