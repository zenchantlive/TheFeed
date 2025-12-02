-- Migration: Add indices for gamification queries
-- Phase 5.1a: Optimize points history and leaderboard queries

-- Add indices to points_history for efficient user lookup and chronological queries
CREATE INDEX IF NOT EXISTS "idx_points_history_user_id" ON "points_history" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_points_history_created_at" ON "points_history" ("created_at" DESC);

-- Add indices to user_profiles for leaderboard queries (points and level rankings)
CREATE INDEX IF NOT EXISTS "idx_user_profiles_points" ON "user_profiles" ("points" DESC);
CREATE INDEX IF NOT EXISTS "idx_user_profiles_level" ON "user_profiles" ("level" DESC);
