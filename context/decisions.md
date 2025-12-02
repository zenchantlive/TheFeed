# Decisions & Rationale
Last updated: 2025-11-07

## Infrastructure & Database

- **2025-01-08** — **Supabase Postgres as primary DB**
  - Rationale: Existing Supabase project available; compatible with Drizzle ORM; scales well for social features.

- **2025-11-07** — **Continue with Supabase + Drizzle for social features**
  - Rationale: Already using this stack successfully; Drizzle's relational queries perfect for social graph; Supabase Realtime available for Phase 6.
  - Alternatives considered: Firebase (different paradigm), custom API (slower).

- **2025-11-07** — **Cursor-based pagination for posts feed**
  - Rationale: More consistent than offset-based for real-time feeds; handles concurrent inserts gracefully; better UX for infinite scroll.
  - Implementation: Use (createdAt, id) composite cursor.

- **2025-11-15** — **Better Auth middleware helper**
  - Rationale: CopilotKit + new calendar routes call APIs frequently; we need a single helper to validate sessions via Better Auth headers to avoid duplicating logic and accidentally trusting client-provided IDs.
  - Implementation: `src/lib/auth-middleware.ts` exports `validateSession` and `withAuth`, returning `{ userId, session }` when the Better Auth session is present.
- **2025-11-19** — **Admin RBAC + in-app verification dashboard**
  - Rationale: Unverified discovery imports need human review before surfacing on `/map`. Building `/admin` with the same Next.js stack keeps auth/streaming consistent and lets us reuse shared context.
  - Implementation: `src/lib/auth/admin.ts` adds `validateAdminSession`, `withAdminAuth`, and `/api/admin/resources` powers the queue with missing-field filters (hours/phone/website/description/address/duplicates).

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

- **2025-11-16** — **Expose posts to map via `onlyWithCoords` filter**
  - Rationale: Map pins should only represent posts that opted-in with approximate coordinates; reduces payload size and prevents private posts without location from leaking into discovery.
  - Implementation: `src/app/api/posts/route.ts` and `src/lib/post-queries.ts` accept `onlyWithCoords`, filtering via `isNotNull(posts.locationCoords)`.

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

- **2025-11-15** — **CopilotKit-powered chat v2 with dedicated tool renderers**
  - Rationale: CopilotKit provides a stable runtime for streaming plus declarative generative UI; using `useCopilotAction` per tool keeps shadcn components in our control, no raw HTML injection.
  - Implementation: `/chat-v2` route wraps `<CopilotKit>`, `ToolRenderers` map each action to ResourceCard/EventCard/PostPreview/etc., and shared result types live in `tool-renderers/types.ts`.

- **2025-11-15** — **Voice input + smart prompts inside chat shell**
  - Rationale: Quick actions ("hungry"/"full") and microphone capture reduce friction for the target audience; matches the persona-driven UX from the Community page.
  - Implementation: `EnhancedChatV2` handles transcripts/headings, `voice-input.tsx` wraps the browser speech APIs, and prompt buttons feed CopilotKit once `useCopilotChat` auto-send is wired up.

- **2025-11-15** — **Calendar view for community events**
  - Rationale: Events are the hero of the Community experience; a `/community/events/calendar` view lets people see potlucks + volunteer shifts at a glance with filters.
  - Implementation: Server component fetches via `getEventsWithinRange`, enforces auth, and provides month/type query params while reusing existing Event detail routes.

- **2025-11-16** — **Quick RSVP directly from map popups**
  - Rationale: Reduce friction by letting users commit to events without leaving the map; keeps discovery momentum high, especially on mobile.
  - Implementation: `MapPageClient` event popups now expose guest count selector (1-5) and call `/api/events/[id]/rsvp`. Success/error states render inline while preserving "Full details" link.

- **2025-11-16** — **URL-driven cross-area navigation**
  - Rationale: Community posts/events should deep-link into the same context on the map (pins selected + filters applied) to unify discovery surfaces.
  - Implementation: Community cards link to `/map?eventId=...` or `/map?postId=...`; MapPage reads `foodBankId`, `eventId`, `postId`, `eventType`, `postKind` search params and seeds local filter state.

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

- **2025-01-12** — **Terminal + CLI harness for sous-chef debugging**
  - Rationale: UI streaming is flaky; a REPL (`scripts/dev-terminal-chat.ts`) and smoke test (`scripts/test-chat-tools.ts`) let us exercise tools directly and inspect tool-call payloads.
  - Outcome: Anthropic models behave well; OpenRouter GPT models still bail after `get_user_context`. Blank messages persist in the React UI despite these diagnostics.

- **2025-11-07** — **6-phase incremental rollout (not big-bang launch)**
  - Rationale: Test each feature independently; gather feedback early; avoid technical debt from hasty implementation.
  - Phases: Infrastructure → UI → Engagement → Social → Location → Real-time.

## Real-Time Strategy

- **2025-11-07** — **Start with polling, migrate to Supabase Realtime in Phase 6**
  - Rationale: Polling simpler to implement; validates UX first; Supabase Realtime adds complexity (WebSocket management); can add when proven valuable.
  - Polling: Every 30 seconds for new posts.

## AI & Automation

- **2025-11-19** — **LLM response schema flattened under `updates`**
  - Rationale: OpenRouter (Azure) enforces JSON schema where every property must appear in `required`. Nesting optional fields (phone/website/hours) under an `updates` object avoids constant 400s while still letting us parse structured responses.
  - Implementation: `admin-enhancer.ts` now expects `{ summary, confidence, updates: { … } }` and converts `updates.hours` strings into `HoursType`. See current warning in logs when provider rejects invalid schema.

- **2025-11-23** — **Relaxed State Validation for Discovery**
  - Rationale: Geocoding/Autocomplete often returns full state names ("California") instead of codes ("CA"). Enforcing strict 2-letter validation caused UX errors.
  - Implementation: `triggerSchema` now uses `min(2)` for state.

- **2025-11-23** — **Insert "Soft Duplicates" instead of blocking**
  - Rationale: Duplicate detection isn't perfect. Admins need to see potential duplicates to manually verify or merge them, rather than them being silently discarded.
  - Implementation: `duplicate-guard.ts` distinguishes "hard" (exact address) vs "soft" (fuzzy) duplicates. `trigger` route inserts soft matches with `potentialDuplicate` flag.

## Deferred Decisions

- **Photo moderation approach** - Deferred until photo uploads implemented
- **Push notifications** - Deferred until core engagement proven
- **Advanced moderation tools** - Deferred until community size justifies
- **501c3 structure and grant applications** - Deferred until MVP validated
