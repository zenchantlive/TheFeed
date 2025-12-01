ALTER TABLE "food_banks" ADD COLUMN "confidence_score" real DEFAULT 0;--> statement-breakpoint
ALTER TABLE "food_banks" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "food_banks" ADD COLUMN "raw_hours" text;--> statement-breakpoint
ALTER TABLE "food_banks" ADD COLUMN "ai_summary" text;