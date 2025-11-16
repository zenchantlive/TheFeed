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

### AI Chat Status (CopilotKit v2)

- `/chat-v2` is the active playground for the Sous-Chef. `page-client.tsx` wraps the UI in `<CopilotKit runtimeUrl="/api/copilotkit">`, injects user + location context via `useCopilotReadable`, and renders `<EnhancedChatV2>` for the experience.
- `src/app/chat-v2/components/tool-renderers/` defines one renderer per tool (`search_resources`, `search_events`, `search_posts`, `get_directions`, `get_resource_by_id`, `get_user_context`, `log_chat`). Do **not** use `dangerouslySetInnerHTML`; use these typed hooks.
- `src/lib/ai-tools.ts` still exports `sousChefTools` for both CopilotKit and the terminal harnesses (`scripts/dev-terminal-chat.ts`, `scripts/test-chat-tools.ts`).
- Legacy `/chat` still streams via `useChat`; it suffers from the blank assistant bubble bug when the provider drops the stream. Keep logging until we replace it entirely with CopilotKit.

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

- `src/app/chat-v2/page.tsx` + `page-client.tsx`: CopilotKit entry point (preferred going forward).
- `src/app/chat-v2/components/`:
  - `enhanced-chat-v2.tsx`: Shell w/ smart prompts, typing indicator, tool renderers, and message list.
  - `tool-renderers/`: Declarative renderers driven by `useCopilotAction`.
  - `voice-input.tsx`, `actions/smart-prompts.tsx`, `components/ui/*`: Theming + layout pieces shared across chat.
- `/api/copilotkit` (in `src/app/api/copilotkit/route.ts`) passes CopilotKit requests through `sousChefTools`.
- `scripts/dev-terminal-chat.ts` + `scripts/test-chat-tools.ts` exercise the same tool stack headlessly.
- Legacy `/chat` (`src/app/chat/page.tsx`) still exists for regression testing but should not be extended without a plan to merge into `/chat-v2`.

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

**Layout Structure (Updated January 2025):**

1. **Page Header**
   - "Community" title on left
   - Mode toggles on right: "I'm hungry" and "I'm Full"
   - Clicking toggles mode (click again to deactivate)
   - Clean single-line header with border-bottom

2. **Welcome Section (2-column grid)**
   - **LEFT: Centered Location + Greeting**
     - Location badge: Shows detected location with "Change" button
     - Personalized greeting with user's first name
     - Serif font for warm, friendly tone
     - Mode-specific messages:
       - Hungry: "Hey Jordan, let's find you some food"
       - Full: "Hey Jordan, ready to make a difference"
       - Neutral: "Hey Jordan, welcome back"
     - Helper text changes based on active mode

   - **RIGHT: Urgency Cards (340px fixed width)**
     - "Need help now?" (hungry mode) - links to /map
     - "Ready to help?" (full mode) - links to create event
     - "Today in your neighborhood" stats (neutral mode)

3. **Main Content (2-column grid)**
   - **LEFT COLUMN (Main Content):**
     - Events section (PRIMARY, full-width)
     - Composer (appears when mode active, NO redundant mood selectors)
     - Community posts (ALWAYS visible, never hidden)

   - **RIGHT COLUMN (Sidebar - 340px):**
     - Mini-map (shows nearby resources) - TODO: needs implementation
     - Compact stats card (only when no mode active)
     - "Tonight's hot dishes" (useful real-time info)

**Key Features:**

- **User Personalization:**
  - Session user data passed from server (`page.tsx`) to client (`page-client.tsx`)
  - User prop includes: id, name, image, email
  - First name extraction for friendly greetings
  - Client-side geolocation detection (placeholder for future functionality)

- **Mode Behaviors:**
  - **"I'm hungry" mode:**
    - Events filter to show food/potluck events
    - Header: "Food & resources near you"
    - Posts prioritize shares/resources
    - Greeting: "Hey [Name], let's find you some food"
    - Urgency card: "Need help now?" → links to /map
    - Composer appears for asking neighbors

  - **"I'm Full" mode:**
    - Events filter to show volunteer opportunities
    - Header: "Ways to help" + "Host an event" button
    - Posts prioritize requests
    - Greeting: "Hey [Name], ready to make a difference"
    - Urgency card: "Ready to help?" → links to create event
    - Composer appears for offering help

  - **No mode (default):**
    - Shows ALL events
    - Shows ALL posts (neutral ordering)
    - Header: "Upcoming events"
    - Greeting: "Hey [Name], welcome back"
    - Stats card: "Today in your neighborhood" with counts

- **Event Cards with Quick Actions:**
  - Each event has overlay buttons:
    - **Map pin icon** → Links to `/map?event={id}` for location
    - **RSVP button** → Links to `/community/events/{id}` for quick RSVP
  - 2-column grid on desktop

- **Posts: Always Visible, Smart Filtering:**
  - Posts NEVER disappear based on mode
  - Mode affects sorting priority, NOT visibility
  - Filter pills still available for additional refinement
  - Uses PostFeed component with mode prop for intelligent sorting

- **Composer Intelligence:**
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

### Event Hosting & Discovery System

- Backend tables, event wizard, RSVP flows, and sign-up sheet display are all implemented (see `context/state.md` for schema recap).
- `/community/events/calendar` is the canonical discovery surface: auth-guarded, supports `month=` + `type=` filters, and links back to event detail + creation.
- Events still create `kind="event"` posts so they show up in the Community feed.

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
  - Deeper discovery (map overlays, integrating calendar entry points everywhere).
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

### USER RULES (DO NOT DELETE)

- Always run `pnpm install`/`pnpm add`/`pnpm dev` from **Windows PowerShell**, never from WSL, so that optional native dependencies (Next SWC, lightningcss, etc.) are installed for Windows only.
- Pin icon-library versions in `package.json` instead of using wide `^` ranges; that avoids picking up broken builds automatically.
- When upgrading `lucide-react`, test the dev server immediately and keep `.next` clean so regressions surface quickly.
