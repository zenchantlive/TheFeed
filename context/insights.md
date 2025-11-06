# Insights & Findings
Last updated: 2025-01-11 23:10 UTC

- 2025-01-11 — `pnpm exec tsx` requires explicit env loading  
  - Use `pnpm exec tsx --env-file=.env scripts/seed-food-banks.ts` to expose `POSTGRES_URL`.
- 2025-01-11 — Map blank likely due to client not receiving Supabase rows  
  - Need to instrument `MapPageClient` to verify `foodBanks` prop (console/log).
- 2025-01-11 — AI chat blank response occurs after tool call  
  - Suspect tool returning `undefined`/empty array; add logging around `search_food_banks` execute.
- 2025-01-11 — Community page still placeholder  
  - Requires content strategy + additional components before Phase 1 sign-off.
