# Project State — FoodShare
Last updated: 2025-01-11 23:25 UTC

## Active Tasks
- Debug Map page: markers/search not rendering after Supabase seed (`src/app/map/pageClient.tsx`, `src/components/map/MapView.tsx`) — see Issue #1.
- Resolve AI chat blank reply after user supplies ZIP code (tool execution in `src/app/api/chat/route.ts`) — see Issue #2.
- Flesh out Community page into richer social demo (`src/app/community/page.tsx`) — see Issue #3.
- Document/automate seeding pipeline (Sacramento dataset via `scripts/seed-food-banks.ts`) — see Issue #4.
- Codify context logging workflow for collaborators — see Issue #5.

## Blockers / Risks
- Map features depend on verifying Supabase connectivity from the Next.js runtime (distance calc + filtering).
- Chat issue likely tied to tool results/JSON serialization; needs logging to confirm.
- Community UX requires design/content direction; currently only static cards.

## Last Completed Action
- Updated `scripts/seed-food-banks.ts` with Sacramento-area real data (10 entries) and confirmed command syntax (`pnpm exec tsx --env-file=.env scripts/seed-food-banks.ts`).

## Next Steps
- Run seed script against target database and confirm records (`SELECT count(*) FROM food_banks;`).
- Log map data loading (console / server logs) to ensure Supabase rows reach client.
- Inspect chat endpoint logs for tool outputs when ZIP provided; add guard for empty responses.
- Draft Community v2 spec (card layout, additional sections) before implementation.
- Keep project board in sync: https://github.com/users/zenchantlive/projects/2.
