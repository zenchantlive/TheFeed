ALTER TABLE "discovery_events" DROP CONSTRAINT "discovery_events_triggered_by_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "discovery_events" ADD CONSTRAINT "discovery_events_triggered_by_user_id_user_id_fk" FOREIGN KEY ("triggered_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;