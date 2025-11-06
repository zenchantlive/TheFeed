# Decisions & Rationale
Last updated: 2025-01-11 23:10 UTC

- 2025-01-08 — **Supabase Postgres as primary DB**
  - Rationale: existing Supabase project available; compatible with Drizzle.
- 2025-01-11 — **Manual seeding per city (starting Sacramento)**
  - Rationale: quickest path to realistic map data; avoids upfront nationwide aggregation.
- 2025-01-11 — **Mapbox GL client rendering**
  - Rationale: matches boilerplate recommendations; leverages `react-map-gl` already installed.
- 2025-01-11 — **Vercel AI SDK tool-based chat flow**
  - Rationale: reuse existing `/api/chat` route, add Zod schemas for tool IO; enables map/chat synergy.
- 2025-01-11 — **Context logging via `context/` + GitHub issues**
  - Rationale: persistent memory between Codex sessions; supplements GitHub tracker.
