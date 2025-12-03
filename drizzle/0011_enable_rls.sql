-- Enable RLS on all tables (Idempotent-ish, usually doesn't fail if already enabled)
ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "chat_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "saved_locations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "follows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "helpful_marks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "event_attendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "event_recurrence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "event_rsvps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sign_up_slots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sign_up_claims" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tombstone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "admin_audit_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "resource_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "discovery_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_verifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "spatial_ref_sys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "provider_claims" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "points_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "food_banks" ENABLE ROW LEVEL SECURITY;
-- Policies for Public Read Access
-- Drop existing policies first to avoid 42P07 (duplicate_object) errors
-- Food Banks
DROP POLICY IF EXISTS "Enable read access for all users" ON "food_banks";
CREATE POLICY "Enable read access for all users" ON "food_banks" AS PERMISSIVE FOR
SELECT TO public USING (true);
-- Posts
DROP POLICY IF EXISTS "Enable read access for all users" ON "posts";
CREATE POLICY "Enable read access for all users" ON "posts" AS PERMISSIVE FOR
SELECT TO public USING (true);
-- Comments
DROP POLICY IF EXISTS "Enable read access for all users" ON "comments";
CREATE POLICY "Enable read access for all users" ON "comments" AS PERMISSIVE FOR
SELECT TO public USING (true);
-- Events
DROP POLICY IF EXISTS "Enable read access for all users" ON "events";
CREATE POLICY "Enable read access for all users" ON "events" AS PERMISSIVE FOR
SELECT TO public USING (true);
-- Event Recurrence
DROP POLICY IF EXISTS "Enable read access for all users" ON "event_recurrence";
-- Enable RLS on all tables (Idempotent-ish, usually doesn't fail if already enabled)
ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "chat_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "saved_locations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "follows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "helpful_marks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "event_attendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "event_recurrence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "event_rsvps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sign_up_slots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sign_up_claims" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tombstone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "admin_audit_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "resource_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "discovery_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_verifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "spatial_ref_sys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "provider_claims" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "points_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "food_banks" ENABLE ROW LEVEL SECURITY;
-- Policies for Public Read Access
-- Drop existing policies first to avoid 42P07 (duplicate_object) errors
-- Food Banks
DROP POLICY IF EXISTS "Enable read access for all users" ON "food_banks";
CREATE POLICY "Enable read access for all users" ON "food_banks" AS PERMISSIVE FOR
SELECT TO public USING (true);
-- Posts
DROP POLICY IF EXISTS "Enable read access for all users" ON "posts";
CREATE POLICY "Enable read access for all users" ON "posts" AS PERMISSIVE FOR
SELECT TO public USING (true);
-- Comments
DROP POLICY IF EXISTS "Enable read access for all users" ON "comments";
CREATE POLICY "Enable read access for all users" ON "comments" AS PERMISSIVE FOR
SELECT TO public USING (true);
-- Events
DROP POLICY IF EXISTS "Enable read access for all users" ON "events";
CREATE POLICY "Enable read access for all users" ON "events" AS PERMISSIVE FOR
SELECT TO public USING (true);
-- Event Recurrence
DROP POLICY IF EXISTS "Enable read access for all users" ON "event_recurrence";
-- Enable RLS on all tables (Idempotent-ish, usually doesn't fail if already enabled)
ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "chat_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "saved_locations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "follows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "helpful_marks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "event_attendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "event_recurrence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "event_rsvps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sign_up_slots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sign_up_claims" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tombstone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "admin_audit_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "resource_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "discovery_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_verifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "spatial_ref_sys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "provider_claims" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "points_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "food_banks" ENABLE ROW LEVEL SECURITY;
-- Policies for Public Read Access
-- Drop existing policies first to avoid 42P07 (duplicate_object) errors
-- Food Banks
DROP POLICY IF EXISTS "Enable read access for all users" ON "food_banks";
CREATE POLICY "Enable read access for all users" ON "food_banks" AS PERMISSIVE FOR
SELECT TO public USING (true);
-- Posts
DROP POLICY IF EXISTS "Enable read access for all users" ON "posts";
CREATE POLICY "Enable read access for all users" ON "posts" AS PERMISSIVE FOR
SELECT TO public USING (true);
-- Comments
DROP POLICY IF EXISTS "Enable read access for all users" ON "comments";
CREATE POLICY "Enable read access for all users" ON "comments" AS PERMISSIVE FOR
SELECT TO public USING (true);
-- Events
DROP POLICY IF EXISTS "Enable read access for all users" ON "events";
CREATE POLICY "Enable read access for all users" ON "events" AS PERMISSIVE FOR
SELECT TO public USING (true);
-- Event Recurrence
DROP POLICY IF EXISTS "Enable read access for all users" ON "event_recurrence";
-- Enable RLS on all tables (Idempotent-ish, usually doesn't fail if already enabled)
ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "chat_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "saved_locations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "follows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "helpful_marks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "event_attendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "event_recurrence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "event_rsvps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sign_up_slots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sign_up_claims" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tombstone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "admin_audit_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "resource_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "discovery_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_verifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "spatial_ref_sys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "provider_claims" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "points_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "food_banks" ENABLE ROW LEVEL SECURITY;
-- Policies for Public Read Access
-- Drop existing policies first to avoid 42P07 (duplicate_object) errors
-- Food Banks
DROP POLICY IF EXISTS "Enable read access for all users" ON "food_banks";
CREATE POLICY "Enable read access for all users" ON "food_banks" AS PERMISSIVE FOR
SELECT TO public USING (true);
-- Posts
DROP POLICY IF EXISTS "Enable read access for all users" ON "posts";
CREATE POLICY "Enable read access for all users" ON "posts" AS PERMISSIVE FOR
SELECT TO public USING (true);
-- Comments
DROP POLICY IF EXISTS "Enable read access for all users" ON "comments";
CREATE POLICY "Enable read access for all users" ON "comments" AS PERMISSIVE FOR
SELECT TO public USING (true);
-- Events
DROP POLICY IF EXISTS "Enable read access for all users" ON "events";
CREATE POLICY "Enable read access for all users" ON "events" AS PERMISSIVE FOR
SELECT TO public USING (true);
-- Event Recurrence
DROP POLICY IF EXISTS "Enable read access for all users" ON "event_recurrence";
CREATE POLICY "Enable read access for all users" ON "event_recurrence" AS PERMISSIVE FOR
SELECT TO public USING (true);
-- Sign Up Slots
DROP POLICY IF EXISTS "Enable read access for all users" ON "sign_up_slots";
CREATE POLICY "Enable read access for all users" ON "sign_up_slots" AS PERMISSIVE FOR
SELECT TO public USING (true);
-- User Profiles
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "user_profiles";
CREATE POLICY "Enable read access for authenticated users" ON "user_profiles" AS PERMISSIVE FOR
FROM "user"
WHERE id = auth.uid()::text
    AND role = 'admin'
)
);
DROP POLICY IF EXISTS "Users can read own claims" ON "provider_claims";
CREATE POLICY "Users can read own claims" ON "provider_claims" AS PERMISSIVE FOR
SELECT TO authenticated USING (user_id = auth.uid()::text);
-- Helpful Marks
DROP POLICY IF EXISTS "Enable read access for all users" ON "helpful_marks";
CREATE POLICY "Enable read access for all users" ON "helpful_marks" AS PERMISSIVE FOR
SELECT TO public USING (true);
-- Tombstone
DROP POLICY IF EXISTS "Enable read access for all users" ON "tombstone";
CREATE POLICY "Enable read access for all users" ON "tombstone" AS PERMISSIVE FOR
SELECT TO public USING (true);
-- Resource Versions
DROP POLICY IF EXISTS "Enable read access for all users" ON "resource_versions";
CREATE POLICY "Enable read access for all users" ON "resource_versions" AS PERMISSIVE FOR
SELECT TO public USING (true);
-- Spatial Ref Sys
DROP POLICY IF EXISTS "Enable read access for all users" ON "spatial_ref_sys";
CREATE POLICY "Enable read access for all users" ON "spatial_ref_sys" AS PERMISSIVE FOR
SELECT TO public USING (true);