# FoodShare Project Overview
Last updated: 2025-01-11 23:15 UTC

## Vision
- Connect people seeking food assistance with nearby resources via mobile-first UX.
- Provide empathetic AI guidance, location discovery, and community engagement.
- Build progressively: MVP core experience, then partner tooling, community features, and peer sharing.

## Roadmap Summary
- **Phase 1 (MVP)** — In progress  
  - AI chat tuned for food needs & quick actions  
  - Interactive map with real locations, hours, services  
  - Community stories/program showcase (static)  
  - Profile with saved locations (Better Auth + Supabase)  
  - Mobile-first UI with bottom navigation
- **Phase 2**  
  - Food bank admin portal, inventory/status management  
  - Expanded analytics/reporting for partners
- **Phase 3**  
  - Interactive community programs (RSVP, reminders)  
  - Advanced search filters, accessibility improvements
- **Phase 4**  
  - Peer-to-peer surplus sharing, reputation, in-app messaging

## Current Focus (2025-01-11)
- Fix map (markers/search) and chat blank response bug.
- Upgrade Community page to better social preview for Phase 1.
- Ensure Supabase seed + Mapbox integration works end-to-end.
- Maintain external memory (`context/`) + GitHub issues for continuity.
- GitHub project board: https://github.com/users/zenchantlive/projects/2 (FoodShare Roadmap).

## Key Files
- `src/app/map/`, `src/components/map/` — Mapbox GL integration.
- `src/app/api/chat/route.ts` — Vercel AI SDK with tool definitions.
- `src/lib/schema.ts`, `scripts/seed-food-banks.ts` — Database definitions + seed data.
- `README.md`, `context/` — documentation hub.

## Commands
- Seed (with env): `pnpm exec tsx --env-file=.env scripts/seed-food-banks.ts`
- Run dev server: `pnpm dev`
- Drizzle: `pnpm run db:generate`, `pnpm run db:migrate`
- Typecheck/Lint: `pnpm typecheck`, `pnpm lint`

## Active Issues (GitHub tracking suggested)
- Map markers/search not rendering despite seeded data.
- Chat returns blank response after ZIP input.
- Community page needs richer UX/content before Phase 1 completion.
