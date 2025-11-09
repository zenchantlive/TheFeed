# Insights & Findings
Last updated: 2025-11-09

- 2025-01-11 — `pnpm exec tsx` requires explicit env loading  
  - Use `pnpm exec tsx --env-file=.env scripts/seed-food-banks.ts` to expose `POSTGRES_URL`.
- 2025-01-11 — Map blank likely due to client not receiving Supabase rows  
  - Need to instrument `MapPageClient` to verify `foodBanks` prop (console/log).
- 2025-01-11 — AI chat blank response occurs after tool call  
  - Suspect tool returning `undefined`/empty array; add logging around `search_food_banks` execute.
- 2025-01-11 — Community page still placeholder  
  - Requires content strategy + additional components before Phase 1 sign-off.

- 2025-11-08 — Supabase throws `remaining connection slots…` when claiming slots  
  - Cause: `getEventById` executed N+1 queries (one per slot) under load.  
  - Fix: Batch claim queries with `inArray` + grouping to keep connection count low.

- 2025-11-09 — Discovery filters felt “sticky” until persisted  
  - Users expected map + calendar to remember type/date selection when navigating.  
  - Solution: store filter values in `localStorage`, hydrate context on mount, and share across pages.

- 2025-11-09 — Map needed visual distinction between events vs. resources  
  - Dual marker layers (gradient calendar pins for events, solid for food banks) improved glanceability and prevented mis-taps.
