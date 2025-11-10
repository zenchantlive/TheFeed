# Project State — TheFeed (formerly FoodShare)
Last updated: 2025-01-09

## Current Focus: Community Page Layout Optimization & Personalization (Phase 3E UI Updates)

Branch: `phase-3e-ui-updates`

### Overview

We have completed a major refactor and optimization of the Community page, transitioning from a 762-line monolithic component to a clean, modular architecture with improved layout and personalization:

**Key Achievements:**
- Refactored from monolith to modular component structure (~220 line main orchestrator)
- Optimized top section layout with page header + 2-column grid
- Added user personalization (greetings, location detection)
- Eliminated awkward spacing and whitespace issues
- Created centered, friendly welcome experience with serif typography
- Mode toggles moved to page header for cleaner hierarchy
- Clean separation: location/greeting on left, urgency cards on right

This refactor builds on prior social + events infrastructure (PR #15, PR #16) and prepares for further discovery and calendar tooling.

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
  - Smart location detection with multiple fallbacks:
    - IP-based geolocation (works on localhost)
    - GPS with reverse geocoding via Nominatim
    - Custom LocationDialog component for manual entry
    - AbortController prevents memory leaks on unmount
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

### Recently Completed (January 2025) ✅

- [COMPLETED] Location functionality:
  - ✅ Connected IP-based geolocation (works on localhost)
  - ✅ GPS fallback with reverse geocoding via Nominatim
  - ✅ Custom LocationDialog for manual location change
  - ✅ AbortController cleanup prevents memory leaks
  - Deferred: localStorage persistence (not critical)

- [COMPLETED] Mobile responsiveness:
  - ✅ Urgency cards now visible on all screen sizes
  - ✅ Responsive header (stacks on mobile)
  - ✅ Flexible mode buttons (equal width on mobile)
  - ✅ Centered greeting works well on small screens

- [COMPLETED] Code quality improvements (addressing review):
  - ✅ AbortController for all fetch requests
  - ✅ Custom modal instead of browser prompt()
  - Deferred: Toast notifications (requires new dependency)
  - Deferred: localStorage hydration (adds complexity)

### In Progress / Next UI Refinements ⏳

These are planned follow-ups:

- [ ] Mini-map implementation:
  - Replace "Mini map loading..." placeholder with actual Mapbox mini-map
  - Show user location + nearby resources
  - Integrate with existing map system at `/map`

- [ ] Visual polish:
  - Further differentiate Events vs. Posts vs. sidebar via subtle color/shadow
  - Verify dark mode contrast for all new UI elements
  - Test serif font rendering across browsers

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
