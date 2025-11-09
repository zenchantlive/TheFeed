# Phase 3D Plan — Discovery Surfaces
Last updated: 2025-11-08  
Branch: `phase-3d-plan`  
Source reference: [events-plan.md](../events-plan.md#L320)

## Goals
- Make upcoming events impossible to miss by surfacing them in the feed, on the map, and in a calendar layout.
- Give neighbors lightweight filtering controls so they can find relevant events quickly.
- Keep API/data structures aligned with future phases (filters, map pins, calendar provide foundation for host tools & recurrence).

## Success Metrics (Phase 3D specific)
- ≥1 event card appears in the top 5 feed items when an event exists in the next 7 days.
- Map shows distinct event pins for 100% of events that have `locationCoords`.
- Calendar view renders in <200ms server time for a 1-month query and never shows duplicate events.
- Filtered results (type/date/host distance) respond within one second and update both feed and map.

## Scope & Deliverables

### 1. Event Cards in Community Feed (`src/app/community/page-client.tsx`, `src/components/events/event-card.tsx`)
1. Extend `getEvents` query to support an “upcoming spotlight” slice (next 7 days, limit 3–4) returned alongside standard posts.
2. Create reusable `<EventCard>` that mirrors the event detail hero but condensed (title, date/time, badges, RSVP count, CTA buttons).
3. Inject event cards into the feed stream:
   - Option A: prepend “Upcoming events” group above regular posts.
   - Option B: interleave after first post if feed layout requires.
4. Ensure cards respect the new filter state (type/status/date range).
5. Accessibility: entire card clickable + `aria-label` describing event summary.

### 2. Event Pins on Map (community map section + Mapbox layers)
1. Reuse `locationCoords` to render pins with unique marker color/icon (calendar or sparkle) distinct from food banks.
2. Map data flow:
   - Extend `/api/events` with `onlyWithCoords=true` to reduce payload.
   - Client fetch merges events + existing food resource data.
3. Pin interactions:
   - Hover/press shows mini popover (title, start time, RSVP count, CTA).
   - “See details” navigates to `/community/events/[id]`.
4. Handle clustering or at least overlapping markers by offsetting duplicates slightly.
5. Respect filters (type + date) so map stays in sync with feed list.

### 3. Calendar View Page (`src/app/community/events/calendar/page.tsx`)
1. Route: `/community/events/calendar` accessible from community nav + event cards.
2. Server component fetches events for the target month via `GET /api/events/calendar`.
3. UI requirements:
   - Month selector (previous/next).
   - Day cells list event chips with color-coded type.
   - Selecting an event opens drawer/modal with summary + CTA.
4. Mobile design: list-style agenda for smaller breakpoints.
5. Empty states: “No events yet this month” prompt with Host CTA.

### 4. Event Filters (feed header + shared state)
1. Filter controls:
   - Type toggle (All / Potluck / Volunteer).
   - Date range (This week / This month / Custom date picker).
   - Location radius (Near me slider once geolocation available; phase 3D fallback = “All Sacramento”).
2. Implement shared filter store (React context or Zustand) that drives:
   - Feed event cards.
   - Map pins.
   - Calendar view (optional query params).
3. Update `/api/events` to accept filter params (type, start/end, near).
4. Persist last-used filter in URL query or localStorage for better UX.

## Dependencies & Sequencing
1. **Backend first**: update `getEvents` + `/api/events`/`/api/events/calendar` to accept filters → unblock UI.
2. **Event card component** can be built in isolation with mock data, then wired to live query.
3. **Map pins** depend on filter state; implement shared store before hooking map to API.
4. **Calendar view** can reuse the same data hook once API supports month ranges.

## Testing Plan
- Unit: add tests for `getEvents` filter logic + calendar query helper (if any).
- UI: Storybook or Playwright snapshot for EventCard to ensure states (full, waitlist, verified).
- Manual check-list:
  1. Create multiple events (potluck + volunteer) with and without coords.
  2. Verify event cards render and link correctly.
  3. Toggle filters; ensure list + map + calendar all update together.
  4. Mobile view for calendar agenda + filter drawer.
  5. Map pin popovers keyboard navigable.

## Risks & Mitigations
- **Large payloads** if we fetch events twice (feed + map): mitigate by sharing SWR cache or building `/api/events/discovery` bundle.
- **Filter drift** between map/feed: centralize state and use a single data hook.
- **Sparse events** leading to empty UI: design friendly empty states with Host CTA.
- **Timezones** when computing “Week/Month” filters: standardize on event timezone stored in DB, formatted client-side.

## Open Questions
1. Should calendar include past days of current month or only future?
2. Do we need pagination for feed event cards if >4 upcoming events?
3. Should filters also affect regular (non-event) posts, or just event surfaces?

## Deliverables Checklist
- [ ] API: filterable `/api/events` + `/api/events/calendar`.
- [ ] Shared discovery filter state + persistence.
- [ ] EventCard component + feed integration.
- [ ] Map pins with popovers and CTA.
- [ ] `/community/events/calendar` page with responsive layout.
- [ ] QA + documentation updates (context/state.md, CLAUDE.md).
