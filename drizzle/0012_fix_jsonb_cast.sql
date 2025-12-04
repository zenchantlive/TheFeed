-- Fix verification_info column type casting
-- Drizzle wants this to be jsonb, but it requires an explicit cast from its current type (likely json or text)
ALTER TABLE "provider_claims"
ALTER COLUMN "verification_info" TYPE jsonb USING verification_info::jsonb;