-- Migration: Add performance indices for critical queries
-- Created: 2025-01-30
-- Purpose: Optimize duplicate detection, geo-spatial queries, and verification filtering

-- Address-based duplicate detection (used in duplicate-guard.ts)
CREATE INDEX IF NOT EXISTS "idx_foodbanks_address_city_state"
ON "food_banks"(
  LOWER("address"),
  LOWER("city"),
  LOWER("state")
);

-- Geo-spatial queries (used in duplicate-guard.ts and map queries)
CREATE INDEX IF NOT EXISTS "idx_foodbanks_coordinates"
ON "food_banks"("latitude", "longitude");

-- Verification status filtering (used in resource-feed.ts)
CREATE INDEX IF NOT EXISTS "idx_foodbanks_verification_status"
ON "food_banks"("verification_status");

-- User saved locations (used in SavedLocationsList)
CREATE INDEX IF NOT EXISTS "idx_saved_locations_user_id"
ON "saved_locations"("user_id");

-- Community verification votes (used in verify route)
CREATE INDEX IF NOT EXISTS "idx_user_verifications_resource_vote"
ON "user_verifications"("resource_id", "vote");

-- Admin queries (used in admin-queries.ts)
CREATE INDEX IF NOT EXISTS "idx_foodbanks_updated_at"
ON "food_banks"("updated_at" DESC);
