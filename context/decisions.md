# Decisions & Rationale
Last updated: 2025-11-09

## Infrastructure & Database

- **2025-01-08** — **Supabase Postgres as primary DB**
  - Rationale: Existing Supabase project available; compatible with Drizzle ORM; scales well for social features.

- **2025-11-07** — **Continue with Supabase + Drizzle for social features**
  - Rationale: Already using this stack successfully; Drizzle's relational queries perfect for social graph; Supabase Realtime available for Phase 6.
  - Alternatives considered: Firebase (different paradigm), custom API (slower).

- **2025-11-07** — **Cursor-based pagination for posts feed**
  - Rationale: More consistent than offset-based for real-time feeds; handles concurrent inserts gracefully; better UX for infinite scroll.
  - Implementation: Use (createdAt, id) composite cursor.

## Community Features Architecture

- **2025-11-07** — **Separate userProfiles table instead of extending Better Auth user table**
  - Rationale: Cleaner separation of concerns; easier to add/remove features; no risk of conflicts with Better Auth updates.
  - Stores: karma, role (neighbor/guide/admin), bio, stats.

- **2025-11-07** — **Denormalize counts (helpfulCount, commentCount) on posts**
  - Rationale: Read-heavy workload (viewing posts) vs write-heavy (marking helpful); avoid N+1 queries; acceptable staleness tradeoff.
  - Update strategy: Increment/decrement on write operations.

- **2025-11-07** — **Unified post format (shares & requests look identical)**
  - Rationale: Preserves dignity for those in need; reduces stigma; only `kind` field differentiates type.
  - UI shows subtle badge, not visual hierarchy.

- **2025-11-07** — **Free-text location + optional coordinates**
  - Rationale: Flexibility (users can say "13th & P St" without geocoding); optional coords enable map integration; privacy-preserving (approximate).
  - Implementation: Store both `location` (text) and `locationCoords` (json).

- **2025-11-07** — **Schema-ready for photos, implement later**
  - Rationale: Not critical for MVP; adds complexity (uploads, storage, moderation); can add via Supabase Storage when needed.
  - Prepared: `photoUrl` column exists but unused initially.

## UI/UX Strategy

- **2025-11-07** — **Feed-first layout with FAB (not inline composer)**
  - Rationale: Reduces cognitive load; lets users browse before committing to post; mobile-friendly pattern (Gmail, Twitter).
  - Problem solved: Current UI has 7 competing elements around composer.

- **2025-11-07** — **Move mood toggles to header (smaller, pill-style)**
  - Rationale: Still accessible but not blocking feed visibility; sets context without being intrusive.
  - Keeps: Humorous "I'm hungry/I'm full" concept user wants to preserve.

- **2025-11-07** — **Composer as modal/drawer (not inline)**
  - Rationale: Focused single-purpose UI; expandable for rich features (location, expiration) without cluttering main page; dismissible.

- **2025-11-07** — **Karma/reputation system with threshold badges**
  - Rationale: Gamifies sharing; builds trust; encourages repeat participation; visual indicators (🌱 <10, 🌿 10-50, 🌳 50+).
  - Calculated from: Helpful marks received on posts and comments.

- **2025-11-07** — **Follow system for personalized feed**
  - Rationale: Builds relationships beyond geography; lets users curate their experience; enables "Following" filter.
  - Implementation: Many-to-many self-join on users table.

- **2025-11-09** — **Shared discovery filters (type/date) across feed, map, calendar**
  - Rationale: Keeps event discovery consistent; avoids three divergent filter states; enables future persistence.
  - Implementation: Client context with `localStorage` persistence powering feed cards, map pins, and calendar API queries.

- **2025-11-09** — **Bottom-nav calendar shortcut**
  - Rationale: Mobile users needed one-tap access to discovery surfaces; calendar is now core navigation artifact.
  - Implementation: Added calendar icon/link to `BottomNav`, matching map CTA style.

- **2025-11-09** — **Map shows event pins alongside food resources**
  - Rationale: Potluck discovery should live where neighbors already check open locations; reduces navigation hops.
  - Implementation: `MapView` renders dual marker layers with distinct styling + popovers; map page fetches events with `onlyWithCoords=true`.

- **2025-11-09** — **Host tools scope confirmed for Phase 3E**
  - Rationale: Need structured plan before building check-ins/verification; reduces churn mid-sprint.
  - Implementation: Added `context/plan/phase-3e-host-tools.md` covering goals, deliverables, and risks.

## Product Strategy

- **2025-11-07** — **Target Sacramento (Midtown) as beachhead**
  - Rationale: Solo founder lives there; diverse neighborhood with both sharers/seekers; walkable 2-mile radius works; less competition than SF/Oakland.

- **2025-11-07** — **Measure success by food exchanges (not posts)**
  - Rationale: Aligns with mission (reduce food insecurity); proves core value prop; harder metric but more meaningful.

- **2025-11-07** — **Solo founder + AI agents (no hiring until funding)**
  - Rationale: Bootstrap approach; grants/501c3 later; validates product-market fit first.

- **2025-11-07** — **Managed community approach (founder as first guide)**
  - Rationale: Quality control during MVP; learn what messaging works; can recruit guides later; avoids building moderation tools prematurely.

## Development Workflow

- **2025-01-11** — **Manual seeding per city (starting Sacramento)**
  - Rationale: Quickest path to realistic map data; avoids upfront nationwide aggregation.

- **2025-01-11** — **Mapbox GL client rendering**
  - Rationale: Matches boilerplate recommendations; leverages `react-map-gl` already installed.

- **2025-01-11** — **Vercel AI SDK tool-based chat flow**
  - Rationale: Reuse existing `/api/chat` route; add Zod schemas for tool IO; enables map/chat synergy.

- **2025-01-11** — **Context logging via `context/` + GitHub issues**
  - Rationale: Persistent memory between sessions with AI agents; supplements GitHub tracker.

- **2025-01-11** — **GitHub Project (TheFeed Roadmap) for Kanban tracking**
  - Rationale: Centralize issues with Backlog/Up Next status for quick onboarding.

- **2025-11-07** — **6-phase incremental rollout (not big-bang launch)**
  - Rationale: Test each feature independently; gather feedback early; avoid technical debt from hasty implementation.
  - Phases: Infrastructure → UI → Engagement → Social → Location → Real-time.

## Real-Time Strategy

- **2025-11-07** — **Start with polling, migrate to Supabase Realtime in Phase 6**
  - Rationale: Polling simpler to implement; validates UX first; Supabase Realtime adds complexity (WebSocket management); can add when proven valuable.
  - Polling: Every 30 seconds for new posts.

## Deferred Decisions

- **Photo moderation approach** - Deferred until photo uploads implemented
- **Push notifications** - Deferred until core engagement proven
- **Advanced moderation tools** - Deferred until community size justifies
- **501c3 structure and grant applications** - Deferred until MVP validated
