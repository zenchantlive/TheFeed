# Project State — TheFeed (formerly FoodShare)
Last updated: 2025-02-01

## Current Focus: Admin Verification UX Redesign

Branch: `feat/verification-table-view` (in progress)

### Active Work: Admin Verification Workspace Redesign

**Context**: The admin verification page (`/admin/verification`) launched with a Kanban-style card layout that has proven unscalable for production use:
- 4-column layout creates "ridiculously long lists" with hundreds of resources
- Resource names get truncated in cards
- No functioning editor (click handlers only log to console)
- Cards too large for efficient scanning
- Poor responsiveness at desktop/widescreen sizes

**Solution**: Complete redesign replacing Kanban cards with data table + side panel architecture (see `/home/zenchant/.claude/plans/dreamy-wondering-glacier.md`)

**Key Design Decisions**:
- **View**: Data table with sortable columns (replacing Kanban entirely)
- **Default sort**: Confidence score lowest first (prioritize problem resources)
- **Table columns**: Checkbox, Full Name (NOT truncated), Location, Confidence %, Missing Fields, Edit button
- **Side panel**: 40% viewport width, opens on row click, stays open when switching resources
- **Archive system**: Radio buttons above table (Active / Archived / All)
- **Bulk workflow**: Sequential edit mode (auto-advances to next resource after save)
- **Pagination**: 25 resources per page (client-side for 500-resource dataset)
- **Shortcuts**: Cmd+S / Ctrl+S to save
- **Focus**: Desktop/widescreen optimization (mobile deprioritized)

**Implementation Phases**:
1. Core table with sorting/pagination ⏳
2. Side panel editor with inline editing
3. Archive system and sequential edit workflow
4. API endpoint for single resource updates (PATCH `/api/admin/resources/[id]`)
5. Polish (keyboard shortcuts, loading states, error handling)

**Why This Matters**: Admin verification is the gateway for all discovered resources to reach production. Current workflow is broken (no editing possible), making it impossible to improve low-confidence resources (38-60%) or fix missing data. This redesign unblocks the entire data quality improvement pipeline.

---

## Recent Deliverables (January 2025)

Branch: `feat/batch-update-verify` (clean)

### Recent Deliverables

**Data Quality & UX Phase 1 - Critical Fixes (January 2025) ✅**

All 5 critical fixes from Phase 1 have been implemented:

1. **Enhancement API Schema Error Fixed** (`src/lib/admin-enhancer.ts:164-235`)
   - Migrated from `generateText()` with manual JSON parsing to `generateObject()` with Zod schema
   - Provides type-safe structured output from OpenRouter
   - Added `temperature: 0.3` for consistency
   - **Impact**: Admin dashboard "✨ Re-Run Analysis" buttons now work without 500 errors

2. **Resource Feed Pagination Bug Fixed** (`src/lib/resource-feed.ts:17-47`)
   - Fixed logic bug where `includeStatuses` parameter was ignored
   - Properly implements `inArray()` for status filtering
   - Added pagination support with `limit` (default 100) and `offset` parameters
   - **Impact**: Map and search queries properly filter by verification status

3. **Geocoding Failure Handling** (`src/lib/discovery/tavily-search.ts:127-165`)
   - Resources with (0,0) coordinates are now skipped instead of inserted
   - Added geocoding failure tracking with detailed logging
   - Progress bar shows count of skipped resources
   - Logs summary of first 5 failures for admin review
   - **Impact**: Zero invalid (0,0) coordinate insertions in production

4. **Database Performance Indices** (`drizzle/0006_add_performance_indices.sql`)
   - Created 6 critical indices:
     - `idx_foodbanks_address_city_state` - Duplicate detection (500ms → 5ms)
     - `idx_foodbanks_coordinates` - Geo-spatial queries (2s → 50ms)
     - `idx_foodbanks_verification_status` - Status filtering
     - `idx_saved_locations_user_id` - User location queries
     - `idx_user_verifications_resource_vote` - Community voting
     - `idx_foodbanks_updated_at` - Admin queries
   - **Impact**: 10-100x performance improvement on critical queries

5. **Request Timeout Handling** (`src/lib/timeout.ts` + updates)
   - Created `withTimeout()` utility for wrapping async operations
   - Discovery trigger route (`/api/discovery/trigger`) has 10-minute timeout
   - Tavily API calls wrapped in `fetchTavilyWithRetry()` with:
     - 3 retry attempts with exponential backoff
     - 30-second timeout per attempt
     - Automatic rate limit (429) handling
   - **Impact**: No more indefinite hangs, graceful timeout errors

**Data Quality & UX Phase 2 - Data Integrity (January 2025) ✅**

All 4 data integrity improvements from Phase 2 have been implemented:

1. **Quantitative Confidence Scoring** (`src/lib/admin-enhancer.ts:63-113`)
   - Replaced LLM-based "vibes" scoring with algorithmic 0-100 scale
   - Multi-factor scoring: completeness (40%), validation (30%), freshness (20%), source (10%)
   - Field-level completeness scoring for hours, phone, website, services
   - Source trust scoring (official domains get higher scores)
   - **Impact**: Objective, transparent resource quality measurement

2. **Enhanced Duplicate Detection** (`src/lib/admin-duplicate-detection.ts`)
   - Multi-factor similarity scoring using fastest-levenshtein
   - Name similarity (40%), address similarity (30%), distance proximity (30%)
   - Configurable similarity thresholds with tuning for false positives
   - **Impact**: Accurate duplicate detection without manual review

3. **Phone & Website Validation** (`src/lib/validation.ts`)
   - Phone validation using libphonenumber-js with US region defaults
   - Website validation with protocol normalization (auto-add https://)
   - Domain validation and malformed URL detection
   - **Impact**: Clean, standardized contact information

4. **Data Versioning & Audit Trail** (`drizzle/0007_add_audit_tables.sql`)
   - New schema tables: `resourceVersions`, `discoveryAuditLogs`, `userVerifications`
   - Complete version history for all resource changes
   - Discovery operation audit trail with metrics
   - User contribution tracking for community verification
   - **Impact**: Full accountability and change tracking

**Next Steps: Phase 3 - Trust & UX (Weeks 5-6) - PAUSED**

*Note: Phase 3 work temporarily paused to address critical admin verification UX issues. Will resume after verification workflow is production-ready.*

- Verification badges and source attribution
- User contribution workflows
- Community trust scoring

---

- **Just-in-Time Discovery Engine Improvements**:
  - **Streaming API**: Discovery endpoint now streams real-time progress (batches, count) to the client.
  - **Deep Content Extraction**: Fetches full raw text (PDFs/Docs) from search results to extract *all* resources.
  - **Batch Processing**: Processes documents in batches of 3 to prevent timeouts.
  - **Automatic Geocoding**: Uses Mapbox API to geocode new resources before insertion (lat/lng).
  - **UI Upgrade**: Community page shows a live progress bar and status during scans; "Change Location" now uses Mapbox Autocomplete.
- **Community posts on the map** — `/api/posts` + `getPosts` accept `onlyWithCoords`, MapPage pins shares/requests with gradient badges, and post popups deep-link back to `/community`.
- **Cross-area navigation** — Community Event/Post cards now link to `/map?eventId=...` or `/map?postId=...`, and the map reads `eventType`/`postKind` query parameters so filters stay in sync.
- **Quick RSVP from map popups** — Event popovers support guest count selection (1-5) and POST directly to `/api/events/[id]/rsvp`, giving immediate confirmation without leaving the map.
- **Admin verification workspace** — `/admin` layout + `/api/admin/resources` ship with RBAC guards, paginated filters (missing info, duplicates), batch status updates, and a resource editor panel with contextual ✨ buttons that fire the AI enhancer for address/phone/website/hours gaps.

### CopilotKit / Chat Status
- `/chat-v2` remains the flagship chat route (CopilotKit provider + `EnhancedChatV2`). All tool renderers are type-safe, and contexts expose user/location metadata via `useCopilotReadable`.
- **Open issues**:
  - Blank assistant bubbles still appear due to duplicate CopilotKit streams; we need better instrumentation on `useCopilotChatHeadless_c` to trace chunk order.
  - Intent auto-send is still stubbed; logs remain in place until CopilotKit exposes the official hook.
  - `auth-middleware.ts` needs to wrap remaining `/api/...` routes so CopilotKit endpoints never trust client headers directly.

### Community Discovery Snapshot
- Community layout continues prioritizing events with personalized greetings, urgency cards, and modular components (`page-client.tsx` orchestrator).
- `/map` now hosts three synchronized layers: food banks, events, and posts. It shares filters with Community via `DiscoveryFiltersProvider`, and popups keep users within discovery surfaces (RSVP, map view, view in community).
- `/community/events/calendar` (auth-guarded) remains the canonical calendar view; next steps are shared filter state + nav entry.

### Next Steps (Post-Verification Redesign)
- **Admin Discovery Workflow** — ✅ Completed "Scan Area" integration with real-time streaming and soft duplicate detection.
- Resume Phase 3 (Trust & UX): verification badges, source attribution, community trust scoring
- Expand shared discovery filters (type/date/radius) so map, feed, and calendar stay consistent.
- Hook `/chat-v2` into the main nav and keep `/chat` as the fallback until CopilotKit streaming issues are resolved.
- Continue hardening TypeScript around CopilotKit render props and remove temporary logging once intent automation ships.

### Known Issues / Alerts
- **2025-01-30** — ✅ RESOLVED: `/api/admin/resources/[id]/enhance` schema error fixed by migrating to `generateObject()` with Zod schema
- **2025-01-30** — ✅ RESOLVED: Geocoding (0,0) insertions eliminated with proper validation and skipping
- **2025-11-23** — Discovery scan "stuck on initializing" issue resolved by handling cached (JSON) responses in `ScanDialog`.
- Supabase warning: `"invalid configuration parameter name "supautils.disable_program", removing it"` appears when hitting `/api/auth/get-session`. It's noisy but harmless (Supabase reserved the `supautils` prefix).

### Tool Renderer Inventory
- `search_resources` → Resource cards (distance + open state) with CTA buttons.
- `get_resource_by_id` → Detailed ResourceCard for follow-up drills.
- `search_events` → EventCard list with RSVP button + location heuristics.
- `search_posts` → PostPreview list for neighbor offers/requests.
- `search_events`/`search_resources` know about the user's coordinates (`coords` prop).
- `get_directions` → Map CTA linking to Google Maps.
- `get_user_context` → Saved location list pulled from Supabase (Better Auth session enforced by `auth-middleware.ts`).

### Community Event Discovery Snapshot
- `/community/events/calendar` renders a 7x6 grid (Sun-first), supports `month=YYYY-MM` and `type=all|potluck|volunteer` query params, and links to event detail + host-new-event flows.
- `src/app/community/events/calendar/utils.ts` handles `parseMonthParam` + guardrails.
- Calendar is authenticated (redirects home if session missing).
- Events still populate `events-section` + feed cards; calendar is now the canonical "overview" view.

### Completed: Community Page Refactor & Layout Optimization ✅

**Component Architecture (November 2025):**

- [COMPLETED] Refactored 762-line monolithic component into modular structure:
  - **Main orchestrator**: `page-client.tsx` (~220 lines)
  - **Type definitions**: `types.ts` (shared types across components)
  - **Component modules**:
    - `components/composer/` - Post creation with intent toggle
    - `components/events-section/` - Event cards with filters
    - `components/post-feed/` - Posts with filtering and sorting utilities
    - `components/sidebar/` - Stats, mini-map, hot items widgets
    - `components/mode-toggle/` - Mode selection UI (not currently active)

**Layout Optimization (January 2025):**

- [COMPLETED] Redesigned top section for cleaner hierarchy:
  - **Page header**: "Community" title + mode toggles ("I'm hungry" / "I'm Full")
  - **2-column layout below header**:
    - Left: Centered location badge + personalized greeting (serif font, friendly tone)
    - Right: Urgency cards (mode-specific CTAs) or stats card (neutral mode)
  - Eliminated awkward spacing and whitespace issues
  - Removed redundant branding that created layout problems

- [COMPLETED] User Personalization:
  - Added `user` prop to `CommunityPageClientProps` (id, name, image, email)
  - Server passes session user data from `page.tsx` to client component
  - Personalized greetings with first name:
    - "Hey Jordan, let's find you some food" (hungry mode)
    - "Hey Jordan, ready to make a difference" (full mode)
    - "Hey Jordan, welcome back" (neutral)
  - Client-side geolocation detection for location display (placeholder ready)
  - Mode-specific helper text changes based on active state

**Mode Architecture:**

- [COMPLETED] Introduced `CommunityMode` on the Community page:
  - Modes: `"hungry" | "helper" | "browse"`
  - Mode toggles in page header (not sticky)
  - Mode affects:
    - Event filtering (food events vs volunteer events)
    - Post prioritization (shares vs requests)
    - Greeting messages
    - Urgency card content

- [COMPLETED] Unified composer semantics:
  - Single inline composer, appears when mode is active
  - Added `PostIntent` state: `"need" | "share"`
  - Mode sets composer intent automatically (no redundant toggles)
  - `hideIntentToggle` prop prevents duplicate mood selectors
  - Posts still created via `/api/posts` with strict typing

- [COMPLETED] Mode-prioritized feed ordering (no hiding):
  - Computed `sortedPosts` from server-provided posts
  - Reordering rules:
    - Hungry: surface `share/resource` posts first
    - Helper: surface `request` posts first
    - Browse: preserve natural ordering
  - Existing filter pills applied on top; all content stays reachable

- [COMPLETED] Urgency cards with personalization:
  - "Need help now?" (hungry mode) - links to /map
  - "Ready to help?" (full mode) - links to create event
  - "Today in your neighborhood" stats (neutral mode)

### In Progress / Next UI Refinements ⏳

These are planned follow-ups:

- [ ] Location functionality:
  - Connect geolocation to reverse geocoding API
  - Implement "Change location" functionality
  - Store user location preferences

- [ ] Mobile responsiveness:
  - Ensure urgency cards display properly on mobile (currently `hidden lg:block`)
  - Test centered greeting layout on small screens
  - Optimize page header for mobile devices

- [ ] Mini-map implementation:
  - Replace "Mini map loading..." placeholder with actual Mapbox mini-map
  - Show user location + nearby resources
  - Integrate with existing map system at `/map`

- [ ] Visual polish:
  - Further differentiate Events vs. Posts vs. sidebar via subtle color/shadow
  - Verify dark mode contrast for all new UI elements
  - Test serif font rendering across browsers

### AI Sous-Chef / CopilotKit Next Steps
- [ ] Wire the new `/chat-v2` UI into primary nav and gate `/chat` behind an A/B toggle.
- [ ] Replace placeholder intent logging with an auto-composed message using CopilotKit's `useCopilotChat` once available.
- [ ] Investigate streaming duplication w/ CopilotKit team; capture panic logs referenced in dev server output.
- [ ] Extend renderer types to cover resource availability metadata (open hours) vs text fallback.
- [ ] Harden `auth-middleware.ts` usage across `/api/...` routes so CopilotKit endpoints never rely on ad-hoc header parsing.

### Prior Phases (Context)

**Phase 3A: Event Foundation - COMPLETE ✅**

- Implemented 6 event-related tables in `schema.ts`.
- Added full event APIs:
  - `/api/events`
  - `/api/events/[id]` (CRUD)
  - `/api/events/[id]/rsvp`
  - `/api/events/[id]/slots`
  - `/api/events/[id]/slots/[slotId]/claim`
- Capacity, waitlist, slot claims, and denormalized counters complete.
- `event-queries.ts` data layer implemented and type-safe.
- `kind="event"` integrated into posts.

**Phase 3B: Event Creation & Detail UI - COMPLETE ✅**

- 5-step event creation wizard + validation.
- Mapbox-based location step.
- Event detail page:
  - Direct DB queries, RSVP controls, attendee list, sign-up sheet display.
- Events auto-generate feed posts for discovery.

(Details for 3A/3B unchanged; see prior entries.)

### Remaining Roadmap (Selected)

- Phase 3C: Sign-up sheets UI for claiming slots.
- Phase 3D: Discovery integration (event cards in main feed, calendar view).
- Phase 3E: Host/guide tools, safety features, check-ins, waitlist management.
- Phase 3F: Recurring events UI.

## Summary for Memory/Restart

- Community page now:
  - **Authenticated, data-driven, personalized**
  - Clean page header with mode toggles (Hungry/Full) on the right
  - Centered welcome section with:
    - Location badge (geolocation detection, change button)
    - Personalized greeting with user's first name
    - Serif font for friendly, warm tone
    - Mode-specific messaging
  - Urgency cards or stats in right column (340px fixed width)
  - Unified composer appears when mode is active (no redundant toggles)
  - Events-first layout: events primary, posts secondary
  - Mode-aware filtering and prioritization (nothing hidden)
  - Modular component architecture (~220 line orchestrator)

- Architecture:
  - **Server component**: `src/app/community/page.tsx` (fetches data, passes user)
  - **Client orchestrator**: `src/app/community/page-client.tsx` (main layout logic)
  - **Types**: `src/app/community/types.ts` (shared type definitions)
  - **Components**: `src/app/community/components/` (modular structure)

These files are the canonical reference for the Community layout and should be consulted before making UI changes.
