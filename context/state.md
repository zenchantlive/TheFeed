# Project State — TheFeed (formerly FoodShare)
Last updated: 2025-11-09

## Current Focus: Community Page Mode-Based UI Refactor (Phase 3E UI Updates)

Branch: `phase-3e-ui-updates`

### Overview

We have implemented a new, mode-driven Community page layout that emphasizes hierarchy over hiding:

- Sticky "View as" mode toggle (Hungry / Helper / Browse all)
- Compact, context-aware hero
- Unified composer for both needs and offers
- Honest "Today in your neighborhood" snapshot (replaces non-functional map)
- Mode-aware but non-hiding ordering of posts
- Events and posts remain distinct, always visible sections

This refactor builds on prior social + events infrastructure (PR #15, PR #16) and prepares for further discovery and calendar tooling.

### Completed: Community Page Mode Architecture ✅

**New behaviors and structures:**

- [COMPLETED] Introduced `CommunityMode` on the Community page:
  - Modes: `"hungry" | "helper" | "browse"`
  - Sticky top bar with prominent segmented control:
    - Hungry → Prioritizes available shares/resources.
    - Helper → Prioritizes requests/needs.
    - Browse → Neutral view (no bias).

- [COMPLETED] Unified composer semantics:
  - Single inline composer in the hero, available to all users.
  - Added `PostIntent` state: `"need" | "share"`.
  - Mapping:
    - `need` → `mood: "hungry"`, `kind: "request"`.
    - `share` → `mood: "full"`, `kind: "share"`.
  - Mode sets smart defaults (Hungry → need, Helper → share), but users can override.
  - Posts still created via `/api/posts` with strict typing.

- [COMPLETED] Context-aware hero:
  - Smaller, left-weighted, two-tier hero:
    - Tier 1: Tiny context card (mode badge + concise heading + 1-line help).
    - Tier 2: Main card with unified composer and right-side snapshot.
  - Removes previous oversized marketing hero and broken map embed.

- [COMPLETED] Replaced mini-map with "Today in your neighborhood" snapshot:
  - Displays real, explainable counts:
    - Number of share posts.
    - Number of request posts.
    - Number of upcoming events.
  - Mode-aware CTAs:
    - Hungry → scrolls to feed with shares highlighted.
    - Helper → scrolls to feed with requests highlighted.
    - Browse → scrolls to full feed.
  - No fake map UI; real map remains on dedicated `/map` page.

- [COMPLETED] Mode-prioritized feed ordering (no hiding):
  - Computed `sortedPosts` from server-provided posts.
  - Reordering rules:
    - Hungry: surface `share/resource` posts first.
    - Helper: surface `request` posts first.
    - Browse: preserve natural ordering.
  - Existing filter pills (Everything / People sharing / I’m hungry / Guides & spots) applied on top of this; all content stays reachable.

- [COMPLETED] Structural improvements:
  - Added `id="community-feed"` anchor; snapshot CTAs smooth-scroll into feed.
  - Strong typing for feed rendering: explicit `FeedPost`, tags, replies, and status badges.
  - Cleaned up unused legacy hero/composer logic.

### In Progress / Next UI Refinements ⏳

These are planned follow-ups on `phase-3e-ui-updates`:

- [ ] Visual refinement:
  - Further differentiate:
    - Hero vs. Events vs. Posts vs. sidebar via subtle color, shadow, and radius changes.
  - Increase legibility of segmented controls and composer toggles.
  - Ensure light/dark mode contrast for all new UI.

- [ ] Events integration:
  - Add explicit mode-aware sorting cues for Upcoming Events:
    - Hungry: emphasize soonest / nearby events.
    - Helper: emphasize volunteer-heavy / help-needed events.
    - Browse: neutral chronological view.
  - Reinforce distinction:
    - Events = gradient accents, date/time & capacity prominent.
    - Posts = flatter, timeline-style cards.

- [ ] Floating Action Button (FAB):
  - Reintroduce a small FAB consistent with new modes:
    - Hungry → Ask sous-chef.
    - Helper → Quick post.
    - Browse → neutral or hidden.
  - Ensure FAB does not conflict with hero composer.

- [ ] Theming:
  - Codify subdued, brand-aligned palette using Tailwind/shadcn tokens:
    - Calm neutrals + soft Hungry/Helper accents.
  - Verify dark mode styles for all new elements.

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
  - Authenticated, data-driven.
  - Uses a sticky mode switch (Hungry/Helper/Browse) as core UX primitive.
  - Provides a unified composer where users can post needs or offers; mode seeds intent but doesn’t gate.
  - Uses a truthful “Today in your neighborhood” snapshot instead of a broken map.
  - Keeps Events and Posts always visible, visually distinct, and mode-prioritized without hiding.

- All new logic lives primarily in:
  - `src/app/community/page.tsx`
  - `src/app/community/page-client.tsx`

These files are the canonical reference for the new Community layout and should be consulted on restart before making further UI changes.
