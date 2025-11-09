# Schema & Structure
Last updated: 2025-11-09

## Repository Layout
- `src/app` — Next.js routes
  - `map/` (page + client controller w/ event pins)
  - `community/` (feed, events, calendar)
  - `profile/` (saved locations, karma, etc.)
  - `api/*` (chat, posts, events, sign-up claims)
- `src/components`
  - `events/` (creation wizard, detail content, cards)
  - `map/` (MapView, popups, search bar)
  - `navigation/BottomNav.tsx` persistent mobile nav
  - `ui/` shadcn primitives
- `src/lib`
  - `schema.ts` Drizzle models (food banks + community + events)
  - `event-queries.ts` higher-level event data access
  - `post-queries.ts`, `food-bank-queries.ts`, `geolocation.ts`
- `scripts/seed-food-banks.ts` — TSX seed script for `food_banks`
- `drizzle/` — auto-generated migrations/journal
- `context/` — long-term memory (this folder)

## Database (Drizzle / Supabase)
- `food_banks`
  - `id`, `name`, `address`, `city`, `state`, `zipCode`
  - `latitude`, `longitude`
  - Optional: `phone`, `website`, `description`
  - `services` (text[]), `hours` (json → `HoursType`)
  - `createdAt`, `updatedAt`
- `saved_locations`
  - `id`, `userId` → `user.id`, `foodBankId` → `food_banks.id`, timestamps
- `chat_messages`
  - `id`, `userId?`, `sessionId`, `role`, `content`, `metadata`, `createdAt`
- **Community / Social**
  - `posts` (`id`, `authorId`, `kind`, `mood`, `content`, `location`, `locationCoords`, `expiresAt`, `metadata`)
  - `comments`, `userProfiles`, `follows`, `helpfulMarks`
- **Event Hosting**
  - `events`
    - `id`, `postId`, `hostId`, `title`, `description`, `eventType ("potluck"|"volunteer")`
    - Time: `startTime`, `endTime`; Location: `location`, `locationCoords`, `isPublicLocation`
    - Capacity: `capacity`, `rsvpCount`, `waitlistCount`
    - Status: `status`, `isVerified`; Recurrence: `recurrenceId`, `parentEventId`
    - Audit: `createdAt`, `updatedAt`
  - `eventRsvps`
    - `id`, `eventId`, `userId`, `status`, `guestCount`, `notes`, timestamps (unique per user/event)
  - `signUpSlots`
    - `id`, `eventId`, `slotName`, `maxClaims`, `claimCount`, `description`, `sortOrder`, `createdAt`
  - `signUpClaims`
    - `id`, `slotId`, `userId`, `details`, `createdAt` (unique per slot/user)
  - `eventRecurrence`
    - `id`, `parentEventId`, `frequency`, `dayOfWeek`, `dayOfMonth`, `interval`, `endsAt`
  - `eventAttendance`
    - `id`, `eventId`, `userId`, `checkedInAt`, `notes`

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
- Event coordinates stored as `{ lat, lng }` JSON; required for map pins/filtering
