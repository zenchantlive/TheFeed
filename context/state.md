# Project State — TheFeed (formerly FoodShare)
Last updated: 2025-11-07

## Current Sprint: Community Social Features MVP
Branch: `feat/community-social-mvp`

### Phase 1: Core Infrastructure (Week 1) - IN PROGRESS
**Goal**: Get real posting working end-to-end

#### Active Tasks
- [IN PROGRESS] Update database schema with social tables (posts, comments, userProfiles, follows, helpfulMarks)
- [PENDING] Generate and apply database migration
- [PENDING] Create `src/lib/post-queries.ts` for post data access
- [PENDING] Build API routes: `/api/posts` (GET, POST) and `/api/posts/[id]`
- [PENDING] Update community page to fetch real data
- [PENDING] Enable posting via temporary UI (before FAB implementation)

#### Context Updates
- [IN PROGRESS] Updated context files with comprehensive plan
- [IN PROGRESS] Updated CLAUDE.md with community architecture

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

## Last Completed Actions
- Conducted comprehensive UI/UX critique of community page
- Defined 6-phase implementation plan (Phases 1-6)
- Made strategic product decisions (market, scope, success metrics)
- Created new branch `feat/community-social-mvp` from PR #12 branch

## Immediate Next Steps (This Session)
1. ✅ Create branch `feat/community-social-mvp`
2. 🔄 Update context files and CLAUDE.md
3. ⏳ Add social tables to `src/lib/schema.ts`
4. ⏳ Run `pnpm run db:generate` and review migration
5. ⏳ Apply migration with `pnpm run db:migrate`
6. ⏳ Build post-queries.ts following food-bank-queries.ts pattern
7. ⏳ Implement /api/posts route

## Long-term Roadmap (6-week MVP timeline)

- **Week 1 (Phase 1)**: Core infrastructure - posts, comments, API routes
- **Week 2 (Phase 2)**: UI decluttering - feed-first layout, FAB, composer modal
- **Week 3 (Phase 3)**: Comments & engagement - helpful marks, karma display
- **Week 4 (Phase 4)**: Social graph - follows, reputation system, user profiles
- **Week 5 (Phase 5)**: Location & urgency - expiration, nearby filter, distance display
- **Week 6 (Phase 6)**: Real-time & polish - Supabase Realtime, animations, mobile optimization

## GitHub Tracking
- Project Board: https://github.com/users/zenchantlive/projects/2
- PR #12: https://github.com/zenchantlive/TheFeed/pull/12 (conceptual UI fixes)
- Future PR: feat/community-social-mvp → claude/conceptual-ui-fixes → main
