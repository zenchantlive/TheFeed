# Schema & Structure
Last updated: 2025-01-11 23:10 UTC

## Repository Layout
- `src/app` — Next.js routes
  - `map/` (page + client controller)
  - `community/` (static stories/programs)
  - `profile/` (server component pulling saved locations)
  - `api/chat/route.ts` (Vercel AI SDK + tool definitions)
- `src/components`
  - `foodshare/` custom UI primitives (big action button, location card, status badge)
  - `map/` Mapbox GL client components
  - `navigation/BottomNav.tsx` persistent mobile nav
- `src/lib`
  - `schema.ts` Drizzle models (`food_banks`, `saved_locations`, `chat_messages`)
  - `food-bank-queries.ts` read helpers, distance filtering
  - `geolocation.ts` browser geolocation + helpers
- `scripts/seed-food-banks.ts` — TSX seed script for `food_banks`
- `drizzle/` — auto-generated migrations/journal
- `context/` — long-term memory (this folder)

## Database (Drizzle / Supabase)
- `food_banks`
  - `id` (uuid text)
  - `name`, `address`, `city`, `state`, `zipCode`
  - `latitude`, `longitude`
  - Optional fields: `phone`, `website`, `description`
  - `services` (text[]), `hours` (json → `HoursType`)
  - Timestamps: `createdAt`, `updatedAt`
- `saved_locations`
  - `id`
  - `userId` → references `user.id`
  - `foodBankId` → references `food_banks.id`
  - `createdAt`
- `chat_messages`
  - `id`
  - `userId` (nullable), `sessionId`
  - `role`, `content`, `metadata`
  - `createdAt`

## Environment Variables (must exist in `.env`)
- `POSTGRES_URL` (Supabase/Postgres)
- `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_MAPBOX_TOKEN`
- `OPENROUTER_API_KEY` (+ optional `OPENROUTER_MODEL`)
- Optional: `POLAR_WEBHOOK_SECRET`

## Seed Data Fields
- Hours stored as object keyed by weekday with `{ open, close, closed? }`
- Services are freeform strings → standardize for filters (e.g., `Emergency Groceries`, `CalFresh Assistance`)
