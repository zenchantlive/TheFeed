# Project State — TheFeed (formerly FoodShare)
Last updated: 2025-11-09

## Current Focus: Event Hosting System (Phase 3E prep)
Branch: `phase-3d-plan` (merged into `phase-3`)

### Phase 3A: Event Foundation - COMPLETE ✅
**Goal**: Build database schema and API routes for community event hosting
**Status**: Backend complete, committed (5a0cbe4), PR #16 created
**PR**: https://github.com/zenchantlive/TheFeed/pull/16

### Phase 3B: Event Creation & Detail Page - COMPLETE ✅
**Goal**: Build event creation wizard and detail page UI
**Status**: Live on `phase-3` (see PR #16 history)

### Phase 3C: Potluck Sign-Up Sheets UI - COMPLETE ✅
**Goal**: Let attendees claim/unclaim potluck slots with real-time updates
**Status**: Shipping on `phase-3` via PR #17

#### Completed Tasks ✅
- Added RSVP-gated slot claim buttons with inline validation and error states
- Built modal form for “What are you bringing?” notes + optimistic loaders
- Wired claim/unclaim endpoints to refresh via `router.refresh()` (no full reload)
- Extracted reusable `PotluckSlotItem` component for clarity + future reuse
- Hardened `getEventById` to batch slot-claim queries (prevents connection flood)

### Phase 3D: Event Discovery Surfaces - COMPLETE ✅ (PR #18)
**Goal**: Make upcoming events impossible to miss across feed, map, and calendar

#### Completed Tasks ✅
- Implemented reusable `<EventCard>` + shared discovery filter context (type/date)
- Hooked community feed to client-side event fetching with filter pills + persistence
- Added `/api/events/calendar` and `getEventsWithinRange` helper for month queries
- Built `/community/events/calendar` (month nav, filters, grid + agenda, host CTA)
- Enhanced map page with event pins, popovers, and filter-synced fetcher
- Added calendar shortcut to bottom nav
- Persisted discovery filters in `localStorage` for cross-page reuse

#### Completed Tasks ✅

**Phase 3A (Backend):**
- [COMPLETED] Add 6 event tables to schema.ts (events, eventRsvps, signUpSlots, signUpClaims, eventRecurrence, eventAttendance)
- [COMPLETED] Generate and apply database migration (drizzle/0002_modern_impossible_man.sql)
- [COMPLETED] Create `src/lib/event-queries.ts` data access layer (746 lines, comprehensive)
- [COMPLETED] Build API routes: `/api/events` (GET, POST)
- [COMPLETED] Build API routes: `/api/events/[id]` (GET, PATCH, DELETE)
- [COMPLETED] Build API routes: `/api/events/[id]/rsvp` (GET, POST, DELETE)
- [COMPLETED] Build API routes: `/api/events/[id]/slots` (GET, POST)
- [COMPLETED] Build API routes: `/api/events/[id]/slots/[slotId]/claim` (POST, DELETE)
- [COMPLETED] Fix TypeScript errors (added "event" to post kind types)
- [COMPLETED] Remove unused imports from event-queries.ts

**Phase 3B (UI):**
- [COMPLETED] Create 5-step event creation wizard components
- [COMPLETED] Build event-basic-info-step.tsx (event type, title, description)
- [COMPLETED] Build event-datetime-step.tsx (date/time pickers with calendar)
- [COMPLETED] Build event-location-step.tsx (location input + Mapbox picker)
- [COMPLETED] Build event-capacity-step.tsx (capacity limits + waitlist)
- [COMPLETED] Build event-signup-sheet-step.tsx (sign-up slots for potlucks)
- [COMPLETED] Build event-creation-wizard.tsx (orchestrator with validation)
- [COMPLETED] Create /community/events/new route page
- [COMPLETED] Build event-detail-content.tsx (RSVP, attendees, sign-up sheet display)
- [COMPLETED] Create /community/events/[id] route page (with direct DB queries)
- [COMPLETED] Add "Host Event" button to community page header
- [COMPLETED] Fix 401 error on event detail pages (use direct DB queries instead of API fetch)
- [COMPLETED] Update CLAUDE.md and context/state.md documentation

#### Context Updates
- [COMPLETED] Updated context/state.md with Phase 3A and 3B status
- [COMPLETED] Updated context/info.md with event system roadmap
- [COMPLETED] Updated CLAUDE.md with event database schema, API routes, and UI components

#### What's Working Now (Backend + Frontend Complete)
✅ Complete database schema for events, RSVPs, and sign-up sheets
✅ Full CRUD API for events with authentication and authorization
✅ Capacity management and waitlist logic
✅ Automatic promotion from waitlist when spots open
✅ Sign-up slot claiming system for potlucks
✅ Denormalized counts for performance (rsvpCount, waitlistCount, claimCount)
✅ 5-step event creation wizard with validation
✅ Event detail pages with RSVP functionality
✅ Attendee lists with avatars and guest counts
✅ Sign-up sheet display for potlucks
✅ "Host Event" button in community page header
✅ Direct database queries (no API roundtrip) for server-rendered pages
✅ Events automatically create feed posts for discovery
✅ Sign-up slot UI with RSVP gating, modal input, and inline error states
✅ Batch slot-claim queries to avoid hitting Supabase connection caps
✅ Event cards injected into feed with shared filters + persistence
✅ Event pins rendered on map with popovers and CTA
✅ Calendar page with month navigation and agenda view
✅ Bottom-nav calendar shortcut for mobile discovery flows

**Phase 3E-3F Still Pending**:
❌ Host management interface (Phase 3E)
❌ Check-in UI (Phase 3E)
❌ Guide verification workflow (Phase 3E)
❌ Notification / waitlist management UI (Phase 3E)
❌ Recurring events UI + scheduling (Phase 3F)

### Previous Work (PR #12)
- Completed comprehensive rebranding from FoodShare to TheFeed
- Built static community page mockup with hardcoded posts
- Implemented mood-based composer (hungry/full)
- Added feed filters and sidebar widgets
- UI/UX critique identified clutter and lack of real functionality

## Strategic Decisions Made

### Product Direction
- **Target Market**: Sacramento, CA (Midtown as beachhead neighborhood)
- **MVP Scope**: Full two-way community with posts, comments, follows, karma
- **Success Metric**: Actual food exchanges (transactions)
- **Launch Strategy**: Solo founder with AI agent team, bootstrap until grants/funding

### UI/UX Strategy
- **Layout**: Feed-first with Floating Action Button (FAB) for posting
- **Mood Toggles**: Relocate to header (smaller, less intrusive)
- **Composer**: Modal/drawer triggered by FAB (not inline)
- **Identity**: Karma/reputation system + follow relationships
- **Posts**: Support location sharing, expiration/urgency indicators

### Backend Architecture
- **Database**: Continue with Supabase Postgres + Drizzle ORM
- **Real-time**: Plan for Supabase Realtime (Phase 6)
- **Photos**: Schema-ready, implement with Supabase Storage later
- **Pagination**: Cursor-based for infinite scroll

## Blockers / Risks Identified

### All risks acknowledged and planned for:
1. **Trust/Safety**: People sharing food with strangers
   - Mitigation: User verification, public meetup suggestions, safety tips
2. **Dignity/Privacy**: People posting about food needs publicly
   - Mitigation: Unified post format, anonymous option, distance controls
3. **Logistics**: Completing exchanges offline
   - Mitigation: Exchange coordination tools, status tracking
4. **Scalability**: Guide recruitment and moderation
   - Mitigation: Start with founder as guide, build tools for delegation

## Last Completed Actions (PR #15)
- Implemented Phase 1 Community Social Features (posts, comments, userProfiles, follows, helpfulMarks)
- Built complete API routes for posts and comments
- Created post-queries.ts data layer with cursor-based pagination
- Updated community page to fetch real data from database
- Enabled actual post creation with mood-based composer

## Last Completed Actions (Phase 3A - Backend)
- ✅ Designed and implemented 6 event tables in schema.ts
- ✅ Created comprehensive event-queries.ts data layer (746 lines) with RSVP and sign-up slot management
- ✅ Built full event API routes: events, single event, RSVPs, sign-up slots, claims
- ✅ Implemented capacity limits, waitlist logic, and promotion from waitlist
- ✅ Added support for kind="event" in posts table for hybrid integration
- ✅ Fixed TypeScript errors (cache issue resolved)
- ✅ Removed unused imports from event-queries.ts
- ✅ Committed Phase 3A (commit 5a0cbe4)
- ✅ Pushed branch to remote
- ✅ Created PR #16: https://github.com/zenchantlive/TheFeed/pull/16

## Last Completed Actions (Phase 3B - UI Complete)
- ✅ Built 5-step event creation wizard with validation and API integration
- ✅ Created all wizard step components (basic-info, datetime, location, capacity, signup-sheet)
- ✅ Implemented interactive Mapbox location picker with pin dropping
- ✅ Built comprehensive event detail page with RSVP functionality
- ✅ Added attendee list display with avatars and guest counts
- ✅ Implemented sign-up sheet display for potlucks
- ✅ Added "Host Event" button to community page header
- ✅ Fixed 401 error on event detail pages (switched from API fetch to direct DB queries)
- ✅ Fixed all TypeScript errors and ESLint warnings in new code
- ✅ Updated CLAUDE.md and context/state.md documentation
- ✅ All lint and typecheck passing (only pre-existing warnings in unrelated files)
- ✅ Committed Phase 3B (commit 93cc136) - 23 files changed, 2409 insertions
- ✅ Pushed to remote and updated PR #16

## Immediate Next Steps
1. 🚧 Kick off Phase 3E: host tools + safety (check-ins, verification, waitlists)
2. 🧪 QA discovery flows (feed filters, map pins, calendar nav) on mobile + desktop
3. 🧭 Define notification/communication strategy before Phase 3E implementation

## Long-term Roadmap

### Community Social Features (6-week MVP)
- **Phase 1** ✅ (PR #15): Core infrastructure - posts, comments, API routes, real data
- **Phase 2-6** ⏳: UI improvements, engagement features, social graph, real-time updates

### Event Hosting System (6-week implementation)
- **Phase 3A** ✅: Event foundation - database schema and API routes
- **Phase 3B** ✅: Event creation and detail page UI
- **Phase 3C** ✅: Sign-up sheets UI for potluck coordination
- **Phase 3D** ✅: Discovery integration (feed cards, map pins, calendar view)
- **Phase 3E** ⏳: Host tools and safety features (check-ins, verification, waitlist management)
- **Phase 3F** ⏳: Recurring events functionality

## GitHub Tracking
- Project Board: https://github.com/users/zenchantlive/projects/2
- PR #12: https://github.com/zenchantlive/TheFeed/pull/12 (conceptual UI fixes) ✅ Merged
- PR #15: https://github.com/zenchantlive/TheFeed/pull/15 (Phase 1 Community Social MVP) ✅ Merged
- PR #16: https://github.com/zenchantlive/TheFeed/pull/16 (Phase 3A Event Hosting Backend) ✅ Merged into `phase-3`
- PR #17: https://github.com/zenchantlive/TheFeed/pull/17 (Phase 3C Sign-up Sheets UI) ✅ Merged
- PR #18: https://github.com/zenchantlive/TheFeed/pull/18 (Phase 3D Discovery Surfaces) ✅ Merged into `phase-3`
