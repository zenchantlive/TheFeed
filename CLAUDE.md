# CLAUDE.md

This file provides guidance to AI assistants when working with code in this repository.

## Project Overview

**TheFeed** (formerly FoodShare) is a hyperlocal food-sharing network connecting people experiencing food insecurity with nearby resources and neighbor-to-neighbor support. It is built on the Agentic Coding Starter Kit and extended with:

- **Interactive Map**: Mapbox GL-powered discovery of food banks and resources.
- **AI-Powered Chat**: Context-aware sous-chef assistant for search, directions, and coordination.
- **Community Potluck**: Social feed for offers, requests, events, and volunteer opportunities.
- **User Profiles**: Reputation, saved locations, and social graph via Better Auth + Supabase.

You are expected to:
- Preserve dignity and safety.
- Optimize for real food exchanges.
- Maintain strict type-safety and consistent architecture.
- Keep context files in sync when making meaningful changes.

## Tech Stack

- Framework: Next.js 15 (App Router), React 19, TypeScript
- Database: PostgreSQL (Supabase) with Drizzle ORM
- Auth: Better Auth with Google OAuth
- UI: shadcn/ui + Tailwind CSS 4, dark mode via theme provider
- Maps: Mapbox GL JS (`react-map-gl`)
- AI: Vercel AI SDK 5 + OpenRouter (`openai/gpt-4.1-mini` default)

## Essential Commands

```bash
# Development (user runs, AI should not)
pnpm dev

# Production build
pnpm build
pnpm start

# Quality (ALWAYS run / respect before merge)
pnpm lint
pnpm typecheck

# Database
pnpm run db:generate
pnpm run db:migrate
pnpm run db:push
pnpm run db:studio
pnpm run db:reset

# Seeding
pnpm exec tsx --env-file=.env scripts/seed-food-banks.ts
```

Use pnpm exclusively.

## Architecture & Key Files

### Map System

- `src/app/map/page.tsx`: Server component, loads data.
- `src/app/map/pageClient.tsx`: Client filters, search, geolocation.
- `src/components/map/MapView.tsx`: Mapbox view.
- `src/components/map/MapSearchBar.tsx`, `LocationPopup.tsx`: Search and detail UI.

### AI Chat System

- `src/app/chat/page.tsx`: Chat UI.
- `src/app/api/chat/route.ts`: Tools + OpenRouter integration.
- Tools:
  - `search_food_banks`
  - `get_directions`
  - `check_hours`

Use `openrouter()` provider; do NOT call OpenAI directly.

### Database Schema

- `src/lib/schema.ts`: Single source of truth.
- Includes:
  - Auth tables.
  - `foodBanks`, `savedLocations`, `chatMessages`.
  - Community tables: `posts`, `comments`, `userProfiles`, `follows`, `helpfulMarks`.
  - Event hosting tables: `events`, `eventRsvps`, `signUpSlots`, `signUpClaims`, `eventRecurrence`, `eventAttendance`.

### Community Social System (Important)

**Component Structure (Refactored from 762-line monolith):**

```
src/app/community/
├── page.tsx                    # Server: fetches posts/events, maps to types
├── page-client.tsx             # Client: main orchestrator (~220 lines)
├── types.ts                    # Shared types (FeedPost, EventCardData, etc.)
├── discovery-context.tsx       # Event filter state management
├── use-discovery-events.ts     # Event data fetching hook
└── components/
    ├── composer/
    │   ├── index.tsx          # Post composer (supports hideIntentToggle)
    │   └── use-composer.ts    # Submission logic
    ├── events-section/
    │   ├── index.tsx          # Event cards with quick actions
    │   └── event-filters.tsx  # Filter controls
    ├── post-feed/
    │   ├── index.tsx          # Feed container
    │   ├── post-card.tsx      # Individual post
    │   ├── post-filters.tsx   # Filter pills
    │   └── utils/
    │       ├── sorting.ts     # Mode-based sorting
    │       └── filtering.ts   # Filter logic
    ├── mode-toggle/            # (Not currently used)
    └── sidebar/
        └── index.tsx          # Stats, mini-map, context helpers
```

**API Routes:**
  - `/api/posts`, `/api/posts/[id]`
  - `/api/posts/[id]/comments`
  - `/api/posts/[id]/helpful`
  - `/api/users/[id]/follow`
  - `/api/users/[id]/profile`

#### Current Community Page Architecture (Events-First UX)

**Core Principle: Events are PRIMARY, Posts are SECONDARY**

The page is designed to get people to food resources FAST while maintaining community engagement.

**Key Behaviors:**

1. **Simple Mode Toggle (No Sticky Header)**
   - Two buttons at top: "I'm hungry" and "I'm Full"
   - Clicking toggles mode (click again to deactivate)
   - NO redundant sticky header - removed for cleaner UX

2. **TheFeed Branding**
   - Located below mode buttons
   - Shows: "TheFeed" title + "Connecting neighbors with food resources and community support"

3. **Events-First Layout**
   - **LEFT COLUMN (Main Content):**
     - Events section (PRIMARY, full-width)
     - Composer (appears when mode active, NO redundant mood selectors)
     - Community posts (ALWAYS visible, never hidden)

   - **RIGHT COLUMN (Sidebar):**
     - "Today in your neighborhood" stats card
     - Mini-map (shows nearby resources) - TODO: needs implementation
     - Context-aware helper cards (change based on active mode)
     - "Tonight's hot dishes" (useful real-time info)

4. **Mode Behaviors:**
   - **"I'm hungry" mode:**
     - Events filter to show food/potluck events
     - Header: "Food & resources near you"
     - Posts prioritize shares/resources
     - Sidebar shows: "Need help now?" helper with map link
     - Composer appears for asking neighbors

   - **"I'm Full" mode:**
     - Events filter to show volunteer opportunities
     - Header: "Ways to help" + "Host an event" button
     - Posts prioritize requests
     - Sidebar shows: "Ready to help?" helper with create event link
     - Composer appears for offering help

   - **No mode (default):**
     - Shows ALL events
     - Shows ALL posts (neutral ordering)
     - Header: "Upcoming events"

5. **Event Cards with Quick Actions**
   - Each event has overlay buttons:
     - **Map pin icon** → Links to `/map?event={id}` for location
     - **RSVP button** → Links to `/community/events/{id}` for quick RSVP
   - 2-column grid on desktop

6. **Posts: Always Visible, Smart Filtering**
   - Posts NEVER disappear based on mode
   - Mode affects sorting priority, NOT visibility
   - Filter pills still available for additional refinement
   - Uses PostFeed component with mode prop for intelligent sorting

7. **Composer Intelligence**
   - Only shows when mode is active (hungry/full)
   - NO redundant mood selectors inside (set by mode button above)
   - `hideIntentToggle` prop removes internal toggle
   - Heading changes based on mode:
     - Hungry: "Ask neighbors for help"
     - Full: "Offer to help neighbors"

**DO NOT:**
- Hide posts or events based on mode
- Add redundant mood selectors when mode is already set
- Bring back the sticky mode toggle header
- Create separate composers for different modes

**ALWAYS:**
- Keep events as the primary focus
- Maintain posts visibility (they're for community building)
- Use smart filtering/prioritization instead of hiding content
- Keep the clean, muted color palette

### Event Hosting System

Backend and core UI implemented as documented in `context/state.md`:
- Event creation wizard.
- Event detail page.
- Sign-up sheet display.
- Events create corresponding posts (`kind = "event"`).

Follow `context/state.md` for latest event system status.

## Context Files

Always consult and update:

- `foodshare/context/state.md`
  - Current sprint, completed work, next steps.
- `foodshare/context/info.md`
  - Vision, roadmap, high-level architecture.
- `foodshare/context/decisions.md`
  - Architecture decisions and rationales.
- `foodshare/context/insights.md`
  - UX/product learnings.

When you change architecture, critical flows, or semantics for posts/events, update these files.

## Styling & UX Guidelines

- Use shadcn/ui patterns and Tailwind utilities.
- Maintain subdued, calm palette:
  - Neutrals + soft Hungry (warm) and Helper (cool) accents.
  - Respect dark mode via `bg-background`, `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`, and `dark:` variants.
- Keep:
  - Clear hierarchy:
    - Mode toggle > hero/composer > events > feed > sidebar.
  - Distinct visuals:
    - Events: structured, future-focused.
    - Posts: flatter, timeline-style.
- DO NOT:
  - Re-introduce a fake/non-functional map into the community hero.
  - Overcomplicate animations; subtle transitions only.

## Workflow Expectations

When working in this repo:

1. Read `foodshare/context/state.md` to understand current focus.
2. For community page work:
   - Start from `src/app/community/page.tsx` + `page-client.tsx`.
   - Preserve existing mode/composer/snapshot semantics.
3. Keep types strict:
   - No `any`.
   - Use shared types from schema/data layers.
4. Run `pnpm lint && pnpm typecheck` before considering work complete.
5. Update context files when:
   - Changing routes, major components, or introducing new modes/behaviors.

## Known Completed vs Pending (High Level)

- Completed:
  - Core map & chat.
  - Phase 1 community social (posts, comments, follows, karma).
  - Phase 3A/3B event backend + creation + detail UI.
  - Initial mode-based community layout refactor (this document + state.md describe it).

- Pending / Future:
  - Deeper discovery (event cards in main feed, calendar view).
  - Full signup sheet UI (Phase 3C).
  - Host tools, check-ins, safety flows (Phase 3E).
  - Recurring event UX (Phase 3F).
  - Additional visual polish passes on community UI.

This file is your authoritative onboarding for how to think about and extend TheFeed. Always align changes with the principles:

- Dignity.
- Clarity.
- Hierarchy over hiding.
- Strict typing.
- Minimal surprises for users.
