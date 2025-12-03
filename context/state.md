# Project State — TheFeed (formerly FoodShare)
Last updated: 2025-12-02

## Current Focus: Phase 5 - Community Engagement (ACTIVE)

**Status**: Phase 5 Provider Claims implementation in progress.

### Active Work:
- **Phase 5.2a-c ✅ Complete**: Provider claims schema, admin UI, query layer, submission API
- **Phase 5.2d In Progress**: Admin review UI (approve/reject endpoints + dialog)
- **Phase 5.1a ✅ Complete**: Database indices for gamification (points_history, user_profiles)
- **Phase 5.1b Deferred**: Gamification integration (deferred for Phase 5.2 priority)
- **Phase 4.1 Complete**: PostGIS integration finished and verified.
- **Phase 4.2 Paused**: Redis caching layer (deferred for Phase 5 priority)

---

## Recent Deliverables (December 2025)

### Phase 5.2: Provider Claims (Subphases 5.2a-c) ✅
- **Database Schema**: Created `providerClaims` table with status tracking and review metadata
  - Added provider ownership fields to `foodBanks` (claimedBy, claimedAt, providerRole, etc.)
  - Proper indices for performance (resourceId, userId, status, createdAt)
  - Full Drizzle relations for type-safe queries
- **Admin UI**: Complete claims management interface
  - GET /api/admin/claims with pagination and status filtering
  - Claims table with search, sorting, and pagination
  - "Provider Claims" added to admin sidebar navigation
  - Tabs for pending/approved/rejected/all claims
- **Query Layer**: Reusable provider-queries.ts with 8+ helper functions
- **Submission API**: Complete claim workflow
  - POST /api/resources/[id]/claim - Submit claim with validation
  - GET /api/resources/[id]/claim - Check claim status
  - DELETE /api/resources/[id]/claim - Withdraw pending claim
- **Branch**: `feat/phase-5.2g-provider-dashboard`
- **Commits**: fa09fb3, c50a67e, 43f0524, (pending)

### Phase 5.1a: Gamification Indices ✅
- **Gamification Indices Migration**: Created migration 0009_gamification_indices.sql
  - `idx_points_history_user_id`: Fast user points lookup
  - `idx_points_history_created_at`: Chronological queries (DESC)
  - `idx_user_profiles_points`: Leaderboard rankings (DESC)
  - `idx_user_profiles_level`: Level-based queries (DESC)
- **Schema Updates**: Added index definitions to `pointsHistory` and `userProfiles` tables
- **Branch**: `feat/phase-5.1a-points-indices`
- **Commit**: 44d8611

### Phase 4: Performance & Scale - PostGIS ✅
- **Native Spatial Queries**: Replaced in-memory filtering with `ST_DWithin`.
- **Geometry Column**: Added `geom` column to `food_banks` with GIST index.
- **Optimized Duplicate Detection**: Sub-100ms detection using database-level spatial checks.

### Phase 3: Trust & UX - Core Features ✅
- **Verification Badges**: Visual indicators for "Community Verified", "Official", etc.
- **Source Attribution**: Transparent display of data sources (Feeding America, etc.) with timestamps.
- **Data Completeness**: Visual progress bar showing resource data quality.
- **Map & Sidebar Integration**:
  - Deep linking support (`/map?resource=ID`).
  - Resource details moved to sidebar (`SidebarResourceDetail`) for better UX.
  - Auto-centering on selected resources.
- **Community Integration**:
  - "Resources Near You" widget on Community page.
  - "View on Map" button on Resource Detail page.

### Refactoring & Cleanup
- **MapPageClient**: Split into `MapFilterSection`, `MapPopups`, and `SidebarResourceDetail`.
- **Hooks**: Extracted `useMapEvents` and `useMapPosts` to `src/hooks/use-map-data.ts`.

---

## Previous Deliverables (January 2025)

### Data Quality & UX Phase 1 - Critical Fixes ✅
- **Enhancement API Schema Error Fixed**: Migrated to `generateObject()` with Zod.
- **Resource Feed Pagination**: Fixed status filtering and added limit/offset.
- **Geocoding Fixes**: Skipped (0,0) insertions.
- **Database Indices**: Added critical performance indices.
- **Request Timeouts**: Implemented robust timeout handling.

### Data Quality & UX Phase 2 - Data Integrity ✅
- **Confidence Scoring**: Algorithmic 0-100 scale.
- **Duplicate Detection**: Multi-factor similarity scoring.
- **Validation**: Phone & website validation.
- **Audit Trail**: Full version history and audit logs.

---

## Roadmap

### Phase 4: Performance & Scale (Next)
- **PostGIS**: Spatial queries for efficient "nearby" lookups.
- **Redis Caching**: Cache resource feed and API responses.
- **Pagination**: Enforce pagination everywhere.
- **Batch Optimization**: Parallel processing for admin tasks.

### Phase 5: Community Engagement (ACTIVE - 12 Subphases)
**Status**: 4/12 complete (5.1a ✅, 5.2a ✅, 5.2b ✅, 5.2c ✅)

**5.1 Gamification System (6 subphases):**
- ✅ 5.1a: Database indices for performance
- ⏳ 5.1b: Points integration (posts, events, RSVPs) - DEFERRED
- ⏳ 5.1c: Badge system & level-ups
- ⏳ 5.1d: Resource verification integration
- ⏳ 5.1e: Leaderboard & header badge notifications
- ⏳ 5.1f: User profile display

**5.2 Provider Claims (6 subphases):**
- ✅ 5.2a: Admin approval workflow setup (schema + admin UI)
- ✅ 5.2b: Provider claims database schema & query layer
- ✅ 5.2c: Claim submission API (POST/GET/DELETE)
- ✅ 5.2d: Admin review UI (approve/reject endpoints + dialog)
- ✅ 5.2e: Claim button UI component (Enhanced Dialog)
- ✅ 5.2f: Enhanced Verification System (Job Title, Phone, etc.)
- ⚠️ 5.2g: Provider dashboard (implemented but has infinite loading bug) - DEBUGGING NEXT

**Plan**: `/home/zenchant/.claude/plans/purrfect-forging-avalanche.md`

---

## Known Issues / Alerts
- **CRITICAL**: `/provider/dashboard` is experiencing an infinite loading loop. Needs immediate investigation.
- **TypeScript Errors**: Pre-existing typecheck errors (7 errors) - not blocking Phase 5 work:
  - admin/layout.tsx headers issue
  - Missing select component import
  - Event card prop mismatches
  - Admin queries geom field
- **Phase 3 Pending**: User suggestion flow (`suggest-update` API) and Mobile-first card optimization are pending.
- **CopilotKit**: Blank assistant bubbles still appear occasionally.
- **Supabase Warning**: `supautils.disable_program` warning is harmless.

## Summary for Memory/Restart
- **Map Page**: Now uses a sidebar for details, auto-centers, and supports deep linking. Code is modular.
- **Resource Page**: Includes map integration and trust indicators.
- **Community Page**: Includes "Resources Near You" widget.
- **Data**: Schema includes `adminVerifiedAt`, `sources`, `verificationStatus`.
