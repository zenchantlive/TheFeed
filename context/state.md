# Project State — TheFeed (formerly FoodShare)
Last updated: 2025-11-19

## Current Focus: AI Sous-Chef v2 (CopilotKit) + Community Event Discovery

Branch: `pr-22` (merged locally for polish)

## CRITICAL: Navigation Architecture Broken

**Audit Date**: 2025-11-19
**Full Report**: `context/navigation-audit.md`

### Key Finding

**All deep links to the map page are completely non-functional.** The `MapPageClient` component (`src/app/map/pageClient.tsx`) has **zero `useSearchParams()` calls**, meaning:

- `/map?event=123` - Does nothing (from community event cards)
- `/map?highlight=123` - Does nothing (from saved locations)
- `/map?foodBankId=123` - Does nothing (documented but broken)

### Broken Functionality

1. **Community → Map navigation**: Clicking map pin icon on event cards navigates but shows no selected event
2. **Saved locations → Map**: "View on map" button does nothing
3. **Chat prefill**: `/chat?prefill=...` links don't populate chat input
4. **Filter sync**: Map and Community use separate localStorage-based providers, not URL

### Immediate Fix Required

Add `useSearchParams()` to `MapPageClient`:

```tsx
import { useSearchParams } from "next/navigation";

function MapPageView({ ... }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const eventId = searchParams.get('eventId') || searchParams.get('event');
    const foodBankId = searchParams.get('foodBankId') || searchParams.get('highlight');

    if (eventId) setSelectedEventId(eventId);
    else if (foodBankId) setSelectedId(foodBankId);
  }, [searchParams]);
  // ...
}
```

See `context/navigation-audit.md` for complete analysis and implementation roadmap.

---

### Overview

PR #22 introduced the first end-to-end CopilotKit-powered chat experience (`/chat-v2`) plus the calendar view for community events. We now have:

- A new `EnhancedChatV2` client that streams through CopilotKit, injects user/location context, and renders generative UI blocks for every backend tool (`search_resources`, `search_events`, `search_posts`, `get_directions`, `get_resource_by_id`, `get_user_context`, `log_chat`).
- Dedicated tool renderer components that hydrate our shadcn cards (ResourceCard, EventCard, PostPreview) directly from CopilotKit `useCopilotAction` hooks.
- Voice input, smart prompt actions, and a refreshed chat shell that mirrors the Community aesthetic.
- `/community/events/calendar` which surfaces potlucks & volunteer shifts on a scrollable, filterable calendar, rounding out discovery alongside the feed.

We are stabilizing TypeScript + runtime issues uncovered during the migration (copilot render props, auth middleware typing, and the lingering blank bubble bug).

### AI Sous-Chef Status (January 2025)

- `sousChefTools` replaces the inline functions in `/api/chat/route.ts`, and the same tool set powers the new `scripts/dev-terminal-chat.ts` REPL plus `scripts/test-chat-tools.ts`.
- Chat UI (`src/app/chat/page.tsx`) was overhauled: always-on transcript, suggested prompts, location banner, tool-status chips, and request bodies now include `{ userId, location, radiusMiles }` via a memoized ref.
- **Verified working**:
  - Terminal harness + Anthropic models exercise `search_posts`/`search_events` and return realistic data (with Supabase warnings only).
  - Deep-link intent loop is partially mitigated: we guard query params with `searchParamsKey` + `hasFiredIntentRef`.
- **Still broken**:
  - UI frequently renders blank assistant bubbles and eventually throws `Maximum update depth exceeded`; `useChat` keeps replaying the same assistant message when the provider never finishes streaming.
  - OpenRouter GPT models often stop after `get_user_context` despite the “tool playbook” instructions.
- **Next steps**:
- Instrument `useChat` with `onFinish`/`onError` to log stream lifecycles.
- Capture API responses to confirm whether the assistant chunk is empty or not emitted.
- Investigate whether `convertToModelMessages` is being called with duplicate messages (possible race between optimistic append and stream replacements).

### AI Sous-Chef v2 Snapshot (CopilotKit)

- `/chat-v2` is a fully client-side experience that mounts inside `<CopilotKit runtimeUrl="/api/copilotkit">`.
- `page-client.tsx` injects two readable contexts (user profile + geolocation) so tools always know the caller.
- `EnhancedChatV2` stitches together:
  - Smart prompts, streaming indicator, typing indicator, and voice capture.
  - `ToolRenderers` that subscribe to CopilotKit action states and render cards inline (no `dangerouslySetInnerHTML` path).
  - "Search intent" deeplinks via `?intent=hungry|full` (auto-apply soon).
- Type safety: `src/app/chat-v2/components/tool-renderers/types.ts` holds shared result types, and every renderer consumes `CopilotRenderProps` instead of raw `any`.

**Layout Architecture (January 2025) - COMPLETED ✅:**
- Full-page chat layout (no "boxed widget" feeling):
  - Header: `fixed top-0` with backdrop blur
  - Composer: `fixed bottom-0` positioned dynamically above bottom nav
  - Messages: Natural document flow, viewport scrolls naturally
  - No nested scroll containers or flex wrappers
- Dynamic bottom nav positioning:
  - `useBottomNavHeight` hook measures actual nav height
  - Composer uses `style={{ bottom: bottomNavHeight }}`
  - Messages padding: `(bottomNavHeight || 0) + 140px`
  - Fully responsive, works on mobile and desktop
- Files: `chat-v2/layout.tsx`, `page-client.tsx`, `enhanced-chat-v2.tsx`

Outstanding bugs:
  - CopilotKit render callbacks still expect non-null React elements (return fragments, never `null`).
  - Web UI blank-bubble race persists; need to coordinate with CopilotKit streaming vs `useChat`.
  - Need to remove the temporary console logging for `intent` handling once auto-send ships.

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
