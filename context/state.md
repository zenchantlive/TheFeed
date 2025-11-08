# Project State — TheFeed (formerly FoodShare)
Last updated: 2025-11-08

## Current Sprint: Event Hosting System (Phase 3A)
Branch: `feat/event-hosting-phase3a`

### Phase 3A: Event Foundation - BACKEND COMPLETE ✅
**Goal**: Build database schema and API routes for community event hosting
**Status**: Backend infrastructure complete, NO UI yet (UI starts in Phase 3B)

#### Completed Tasks ✅
- [COMPLETED] Add 6 event tables to schema.ts (events, eventRsvps, signUpSlots, signUpClaims, eventRecurrence, eventAttendance)
- [COMPLETED] Generate and apply database migration (drizzle/0002_modern_impossible_man.sql)
- [COMPLETED] Create `src/lib/event-queries.ts` data access layer (650+ lines, comprehensive)
- [COMPLETED] Build API routes: `/api/events` (GET, POST)
- [COMPLETED] Build API routes: `/api/events/[id]` (GET, PATCH, DELETE)
- [COMPLETED] Build API routes: `/api/events/[id]/rsvp` (GET, POST, DELETE)
- [COMPLETED] Build API routes: `/api/events/[id]/slots` (GET, POST)
- [COMPLETED] Build API routes: `/api/events/[id]/slots/[slotId]/claim` (POST, DELETE)
- [COMPLETED] Fix TypeScript errors (added "event" to post kind types)
- [COMPLETED] Remove unused imports from event-queries.ts
- [COMPLETED] Update context files (state.md, info.md, decisions.md)

#### Context Updates
- [COMPLETED] Updated context/state.md with Phase 3A status
- [COMPLETED] Updated context/info.md with event system roadmap
- [IN PROGRESS] Updating CLAUDE.md with event database schema and API routes

#### What's Working Now (Backend Only)
✅ Complete database schema for events, RSVPs, and sign-up sheets
✅ Full CRUD API for events with authentication and authorization
✅ Capacity management and waitlist logic
✅ Automatic promotion from waitlist when spots open
✅ Sign-up slot claiming system for potlucks
✅ Denormalized counts for performance (rsvpCount, waitlistCount, claimCount)

#### What's NOT Working Yet (UI Pending)
❌ No event creation form/UI
❌ No event cards in community feed
❌ No event detail pages
❌ No calendar view
❌ No map pins for events
❌ No sign-up sheet UI
❌ No host management interface

**Next Steps**: Phase 3B will build the event creation flow and detail page UI

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

## Last Completed Actions (Current Session - Phase 3A)
- Designed and implemented 6 event tables in schema.ts
- Created comprehensive event-queries.ts data layer with RSVP and sign-up slot management
- Built full event API routes: events, single event, RSVPs, sign-up slots, claims
- Implemented capacity limits, waitlist logic, and promotion from waitlist
- Added support for kind="event" in posts table for hybrid integration

## Immediate Next Steps (This Session)
1. ✅ Create branch `feat/event-hosting-phase3a`
2. ✅ Add 6 event tables to schema.ts with comprehensive comments
3. ✅ Generate and apply database migration (in PowerShell)
4. ✅ Create event-queries.ts following post-queries.ts pattern
5. ✅ Build /api/events routes (GET, POST)
6. ✅ Build /api/events/[id] routes (GET, PATCH, DELETE)
7. ✅ Build /api/events/[id]/rsvp routes (GET, POST, DELETE)
8. ✅ Build /api/events/[id]/slots routes (GET, POST)
9. ✅ Build /api/events/[id]/slots/[slotId]/claim routes (POST, DELETE)
10. 🔄 Update context files
11. ⏳ Run lint and typecheck
12. ⏳ Commit and push Phase 3A
13. ⏳ Create PR

## Long-term Roadmap

### Community Social Features (6-week MVP)
- **Phase 1** ✅ (PR #15): Core infrastructure - posts, comments, API routes, real data
- **Phase 2-6** ⏳: UI improvements, engagement features, social graph, real-time updates

### Event Hosting System (6-week implementation)
- **Phase 3A** 🔄 (Current): Event foundation - database schema and API routes
- **Phase 3B** ⏳: Event creation and detail page UI
- **Phase 3C** ⏳: Sign-up sheets UI for potluck coordination
- **Phase 3D** ⏳: Discovery integration (feed cards, map pins, calendar view)
- **Phase 3E** ⏳: Host tools and safety features (check-ins, verification, waitlist management)
- **Phase 3F** ⏳: Recurring events functionality

## GitHub Tracking
- Project Board: https://github.com/users/zenchantlive/projects/2
- PR #12: https://github.com/zenchantlive/TheFeed/pull/12 (conceptual UI fixes) ✅ Merged
- PR #15: https://github.com/zenchantlive/TheFeed/pull/15 (Phase 1 Community Social MVP) ✅ Merged
- Future PR: feat/event-hosting-phase3a → feat/community-social-mvp → main
