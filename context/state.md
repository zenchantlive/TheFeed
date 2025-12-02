# Project State — TheFeed (formerly FoodShare)
Last updated: 2025-12-01

## Current Focus: Phase 4 Preparation & Phase 3 Wrap-up

**Status**: Transitioning from Phase 3 (Trust & UX) to Phase 4 (Performance & Scale).

### Active Work:
- **Phase 3 Wrap-up**: Completed core trust features (badges, sources, completeness). Pending user suggestion flows.
- **Phase 4 Prep**: Preparing for PostGIS integration and Redis caching to handle scale.

---

## Recent Deliverables (December 2025)

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

### Phase 5: Community Engagement (Future)
- Gamification, provider claims, leaderboards.

---

## Known Issues / Alerts
- **Phase 3 Pending**: User suggestion flow (`suggest-update` API) and Mobile-first card optimization are pending.
- **CopilotKit**: Blank assistant bubbles still appear occasionally.
- **Supabase Warning**: `supautils.disable_program` warning is harmless.

## Summary for Memory/Restart
- **Map Page**: Now uses a sidebar for details, auto-centers, and supports deep linking. Code is modular.
- **Resource Page**: Includes map integration and trust indicators.
- **Community Page**: Includes "Resources Near You" widget.
- **Data**: Schema includes `adminVerifiedAt`, `sources`, `verificationStatus`.
