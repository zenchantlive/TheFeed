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

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Database**: PostgreSQL (Supabase) with Drizzle ORM
- **Auth**: Better Auth v1.3.34 with Google OAuth
- **UI**: shadcn/ui + Tailwind CSS 4, dark mode via next-themes
- **Fonts**: Geist Sans & Geist Mono
- **Maps**: Mapbox GL JS v3.1 (`react-map-gl`)
- **AI**: Vercel AI SDK v5 + OpenRouter (`anthropic/claude-sonnet-4.5` default)
- **CopilotKit**: v1.10.6 for enhanced AI chat experience

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
pnpm run db:generate   # Generate migrations when schema changes
pnpm run db:migrate    # Apply migrations
pnpm run db:push       # Push schema directly (development)
pnpm run db:studio     # Open Drizzle Studio UI
pnpm run db:dev        # Alias for db:push
pnpm run db:reset      # Drop and recreate schema (DANGEROUS)

# Seeding & Scripts
pnpm exec tsx --env-file=.env scripts/seed-food-banks.ts        # Seed Bay Area food banks
pnpm exec tsx --env-file=.env scripts/dev-terminal-chat.ts      # Test chat tools in terminal
pnpm exec tsx --env-file=.env scripts/test-chat-tools.ts        # Unit test for AI tools
pnpm exec tsx --env-file=.env scripts/test-copilotkit-backend.ts # Test CopilotKit backend
```

Use pnpm exclusively.

## Environment Variables

Required environment variables (copy from `.env.example` if it exists):

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_URL` | Supabase/PostgreSQL connection string (with `sslmode=require`) | `postgresql://user:pass@host.supabase.co:5432/postgres?sslmode=require` |
| `BETTER_AUTH_SECRET` | 32+ character random string for auth encryption | `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | Full URL of your app | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | From Google Cloud Console |
| `NEXT_PUBLIC_APP_URL` | Public-facing app URL | `http://localhost:3000` |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox public access token | `pk.ey...` |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI chat | From openrouter.ai |
| `OPENROUTER_MODEL` | Model override (optional) | `openai/gpt-4.1-mini` (default) |
| `POLAR_WEBHOOK_SECRET` | Polar billing webhook secret (optional) | Only if using Polar |

**Security Notes:**
- Never commit `.env` file
- All `NEXT_PUBLIC_*` variables are exposed to the browser
- Auth secrets must be cryptographically random

## Architecture & Key Files

### App Layout & Shell

- `src/app/layout.tsx`: Root layout with ThemeProvider, Geist fonts, and AppShell wrapper
- `src/components/layout/app-shell.tsx`: Main app container with responsive navigation
  - Desktop: Site header + content area
  - Mobile: Bottom navigation bar
  - Handles auth-gated routes
- `src/components/site-header.tsx`: Top navigation bar with logo, nav links, theme toggle, user profile
- `src/components/navigation/BottomNav.tsx`: Mobile bottom navigation (Map, Chat, Community, Profile)
- `src/components/theme-provider.tsx`: next-themes wrapper for dark mode support

### Map System

- `src/app/map/page.tsx`: Server component, loads food bank data from database
- `src/app/map/pageClient.tsx`: Client-side map orchestrator with filters, search, geolocation
- `src/components/map/MapView.tsx`: Mapbox GL view component with markers and popups
- `src/components/map/MapSearchBar.tsx`: Search interface for locations
- `src/components/map/LocationPopup.tsx`: Detail popup for food banks with hours, services, directions

### AI Chat System

**Primary (CopilotKit v2 - Active):**
- `src/app/chat-v2/page.tsx` + `page-client.tsx`: CopilotKit entry point with full-page layout
  - Uses `<CopilotKit runtimeUrl="/api/copilotkit">` provider
  - Injects user + location context via `useCopilotReadable`
  - Full viewport height chain established for proper layout
- `src/app/chat-v2/components/`:
  - `enhanced-chat-v2.tsx`: Main chat shell with smart prompts, typing indicator, tool renderers, message list
  - `tool-renderers/`: Type-safe renderers for each tool (NO `dangerouslySetInnerHTML`)
    - `search-resources-renderer.tsx`
    - `search-events-renderer.tsx`
    - `search-posts-renderer.tsx`
    - `get-directions-renderer.tsx`
    - `resource-detail-renderer.tsx`
    - `user-context-renderer.tsx`
    - `log-chat-renderer.tsx`
  - `voice-input.tsx`: Voice input component
  - `actions/smart-prompts.tsx`: Context-aware prompt suggestions
  - `components/ui/*`: Styled chat UI components

**Backend:**
- `src/app/api/copilotkit/route.ts`: CopilotKit runtime endpoint
- `src/lib/ai-tools.ts`: Shared tool definitions exported as `sousChefTools`
  - `getUserContextTool`: Get user profile and saved locations
  - `searchResourcesTool`: Search food banks by location
  - `getResourceByIdTool`: Get detailed food bank info
  - `searchPostsTool`: Search community posts
  - `searchEventsTool`: Search events
  - `getDirectionsTool`: Generate directions
  - `logChatTool`: Log chat interactions

**Testing:**
- `scripts/dev-terminal-chat.ts`: Interactive terminal chat for testing tools
- `scripts/test-chat-tools.ts`: Automated tool tests
- `scripts/test-copilotkit-backend.ts`: CopilotKit backend tests

**Legacy (Deprecated):**
- `src/app/chat/page.tsx`: Original streaming chat with `useChat` hook
  - Known issue: Blank assistant bubble when provider drops stream
  - Do NOT extend; migrate features to `/chat-v2` instead

**IMPORTANT:** Always use `openrouter()` provider; do NOT call OpenAI directly.

### Database Schema

**File:** `src/lib/schema.ts` (Single source of truth)

**Auth Tables (Better Auth):**
- `user`: Core user data (id, name, email, image, timestamps)
- `session`: Active sessions with expiry, tokens, device info
- `account`: OAuth provider accounts (Google)
- `verification`: Email/phone verification tokens

**Core Data:**
- `foodBanks`: Food assistance locations with hours, services, coordinates
- `savedLocations`: User's saved/favorited food banks
- `chatMessages`: AI chat conversation history

**Community Tables:**
- `posts`: Community posts (offers, requests, events) with location, intent, kind
- `comments`: Threaded comments on posts
- `userProfiles`: Extended user info (bio, karma, joined date)
- `follows`: User-to-user follow relationships
- `helpfulMarks`: Upvote/helpful marks on posts

**Event Hosting Tables:**
- `events`: Event details (type, location, capacity, recurrence)
- `eventRsvps`: User RSVPs to events
- `signUpSlots`: Volunteer/contribution slots for events
- `signUpClaims`: User claims on signup slots
- `eventRecurrence`: Recurring event patterns
- `eventAttendance`: Actual attendance tracking

**Configuration:**
- Drizzle config: `drizzle.config.ts`
- Uses PostgreSQL dialect
- Migrations stored in `/drizzle`

### Lib Utilities

**Core Files:**
- `src/lib/db.ts`: Drizzle database client singleton
- `src/lib/utils.ts`: Tailwind `cn()` class merger utility
- `src/lib/auth.ts`: Better Auth server configuration
- `src/lib/auth-client.ts`: Better Auth client instance
- `src/lib/auth-middleware.ts`: Auth middleware for protected routes

**Query Modules:**
- `src/lib/food-bank-queries.ts`: Food bank search and retrieval
  - `searchFoodBanks()`: Location-based search with radius
  - `getFoodBankById()`: Get single food bank details
- `src/lib/post-queries.ts`: Community post operations
  - Post creation, updates, filtering
  - Comment handling
  - Helpful marks (karma)
- `src/lib/event-queries.ts`: Event management
  - Event creation with wizard support
  - RSVP handling
  - Signup sheet operations
  - Calendar queries with filters
  - Attendance tracking
- `src/lib/geolocation.ts`: Geolocation utilities
  - Distance calculations
  - Coordinate validation
  - Geocoding helpers

### API Routes

**Complete route structure:**

```
src/app/api/
├── auth/
│   └── [...all]/route.ts              # Better Auth catch-all handler
├── chat/
│   └── route.ts                       # Legacy streaming chat endpoint (deprecated)
├── copilotkit/
│   └── route.ts                       # CopilotKit runtime (active)
├── diagnostics/
│   └── route.ts                       # System diagnostics endpoint
├── events/
│   ├── route.ts                       # List/create events
│   ├── calendar/route.ts              # Calendar view with filters
│   └── [id]/
│       ├── route.ts                   # Get/update/delete event
│       ├── rsvp/route.ts              # RSVP to event
│       └── slots/
│           ├── route.ts               # Get signup slots
│           └── [slotId]/
│               └── claim/route.ts     # Claim a signup slot
├── locations/
│   └── route.ts                       # Food bank locations search
└── posts/
    ├── route.ts                       # List/create posts
    └── [id]/
        ├── route.ts                   # Get/update/delete post
        ├── comments/route.ts          # Post comments (missing from docs)
        └── helpful/route.ts           # Mark post as helpful (missing from docs)
```

**Additional routes not yet implemented but referenced:**
- `/api/users/[id]/follow` (user follow/unfollow)
- `/api/users/[id]/profile` (user profile updates)

### Community Social System (Important)

**Component Structure (Refactored from 762-line monolith):**

```
src/app/community/
├── page.tsx                    # Server: fetches posts/events, maps to types
├── page-client.tsx             # Client: main orchestrator (~220 lines)
├── types.ts                    # Shared types (FeedPost, EventCardData, etc.)
├── discovery-context.tsx       # Event filter state management
├── use-discovery-events.ts     # Event data fetching hook
├── styles/
│   └── bulletin-theme.ts       # Community theme constants
└── components/
    ├── action-tiles/
    │   ├── index.tsx          # Action tile grid container
    │   ├── action-tile.tsx    # Individual tile component
    │   └── actions.ts         # Tile action definitions
    ├── active-members/
    │   └── index.tsx          # Active members widget
    ├── composer/
    │   ├── index.tsx          # Post composer (supports hideIntentToggle)
    │   └── use-composer.ts    # Submission logic
    ├── events-section/
    │   ├── index.tsx          # Event cards with quick actions
    │   └── event-filters.tsx  # Filter controls
    ├── location-dialog.tsx    # Location selection dialog
    ├── mode-toggle/
    │   └── index.tsx          # Mode toggle component (not currently used)
    ├── post-feed/
    │   ├── index.tsx          # Feed container
    │   ├── post-card.tsx      # Individual post
    │   ├── post-filters.tsx   # Filter pills
    │   └── utils/
    │       ├── sorting.ts     # Mode-based sorting
    │       └── filtering.ts   # Filter logic
    ├── sidebar/
    │   ├── index.tsx          # Main sidebar orchestrator
    │   ├── guide-tips-widget.tsx   # Getting started tips
    │   ├── hot-items-widget.tsx    # Trending items widget
    │   ├── map-cta-widget.tsx      # Map call-to-action
    │   └── vibe-check-widget.tsx   # Community vibe widget
    └── welcome-banner/
        ├── index.tsx          # Welcome hero section
        └── quotes.ts          # Inspirational quotes
```

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

**Pages:**
- `src/app/community/events/new/page.tsx`: Event creation wizard
- `src/app/community/events/[id]/page.tsx`: Event detail page with RSVP and signup sheet
- `src/app/community/events/calendar/page.tsx`: Calendar discovery view
  - Auth-guarded
  - Supports `month=YYYY-MM` and `type=` query parameters
  - Links to event detail and creation

**Components:**
- `src/components/events/event-creation-wizard.tsx`: Multi-step event creation flow
- `src/components/events/event-basic-info-step.tsx`: Title, description, type
- `src/components/events/event-datetime-step.tsx`: Date/time selection
- `src/components/events/event-location-step.tsx`: Location input
- `src/components/events/event-capacity-step.tsx`: Capacity and visibility
- `src/components/events/event-signup-sheet-step.tsx`: Volunteer slots configuration
- `src/components/events/event-detail-content.tsx`: Event detail page content
- `src/components/events/event-card.tsx`: Event card component

**Key Features:**
- Backend tables fully implemented (events, eventRsvps, signUpSlots, etc.)
- RSVP flows with capacity management
- Signup sheet system for volunteer coordination
- Events create `kind="event"` posts to appear in Community feed
- Support for recurring events (eventRecurrence table)
- Attendance tracking (eventAttendance table)

### Other Key Components

**Auth Components:**
- `src/components/auth/user-profile.tsx`: User profile dropdown/display
- `src/components/auth/sign-in-button.tsx`: Google OAuth sign-in
- `src/components/auth/sign-out-button.tsx`: Sign-out button

**FoodShare Branded Components:**
- `src/components/foodshare/location-card.tsx`: Food bank location card
- `src/components/foodshare/status-badge.tsx`: Open/closed status indicator
- `src/components/foodshare/big-action-button.tsx`: Prominent CTA button

**Profile Components:**
- `src/components/profile/SavedLocationsList.tsx`: User's saved locations list
- `src/app/profile/page.tsx`: User profile page

**UI Components (shadcn/ui):**
Located in `src/components/ui/`:
- Standard: `button`, `input`, `textarea`, `card`, `dialog`, `dropdown-menu`, `popover`, `tooltip`, `checkbox`, `radio-group`, `label`, `separator`, `badge`, `avatar`, `alert`, `calendar`
- Custom: `mode-toggle` (dark mode toggle), `github-stars` (repo stars display)

### Page Routes

**Public Routes:**
- `/` - Landing/home page
- `/map` - Food bank discovery map
- `/chat` - Legacy AI chat (deprecated)
- `/chat-v2` - Active CopilotKit AI chat

**Auth-Protected Routes:**
- `/dashboard` - User dashboard
- `/profile` - User profile and settings
- `/community` - Community feed (events + posts)
- `/community/events/new` - Create new event
- `/community/events/[id]` - Event detail with RSVP
- `/community/events/calendar` - Event calendar discovery

## Recent Changes & Migration Notes

**January 2025 Updates:**
- **Data Quality & UX Phase 1 & 2 - COMPLETED ✅ (January 2025):**
  - Comprehensive audit of data aggregation, verification, and resource management
  - Baseline grading: **59/100** across 5 dimensions
  - Created 5-phase improvement plan (see `context/plans/`)
  - **Phase 1 (Critical Fixes) - ALL COMPLETE:**
    1. ✅ Enhancement API schema error fixed (`generateObject` with Zod)
    2. ✅ Resource feed pagination bug fixed (proper `inArray`/`notInArray`)
    3. ✅ Geocoding (0,0) insertions eliminated (validation + skipping)
    4. ✅ Database indices added (10-100x performance improvement)
    5. ✅ Request timeout handling (10min discovery, 30s Tavily, 3 retries)
  - **Phase 2 (Data Integrity) - ALL COMPLETE:**
    1. ✅ Quantitative confidence scoring system (0-100 scale)
    2. ✅ Enhanced duplicate detection (multi-factor scoring)
    3. ✅ Phone & website validation (libphonenumber-js)
    4. ✅ Data versioning & audit trail (new schema tables)
  - **Impact:** High-confidence resources, deduplication, validated data, complete audit trail
  - **Next:** Phase 3 - Trust & UX (verification badges, source attribution)

- **Chat System Refactor (PR #22, #24):**
  - Migrated primary chat to CopilotKit v2 at `/chat-v2`
  - Fixed full-page layout with proper viewport height chain
  - Extracted shared AI tools to `src/lib/ai-tools.ts`
  - Added type-safe tool renderers (no `dangerouslySetInnerHTML`)
  - Legacy `/chat` deprecated but kept for reference

- **Community Page Architecture:**
  - Refactored from 762-line monolith to modular component structure
  - Implemented events-first UX with mode toggles ("I'm hungry" / "I'm Full")
  - Added welcome banner, action tiles, sidebar widgets
  - Smart post filtering based on mode (priority, not hiding)

- **Event System (Phase 3E):**
  - Full event hosting and discovery
  - Calendar view with month/type filters
  - RSVP and signup sheet functionality
  - Recurring events support

**Migration Checklist:**
- ✅ Better Auth v1.3.34 (stable)
- ✅ CopilotKit v1.10.6 for chat
- ✅ Tailwind CSS 4
- ✅ Next.js 15 + React 19
- ✅ Data Quality Phase 1 (critical fixes) - COMPLETE
- ✅ Data Quality Phase 2 (data integrity) - COMPLETE
- ⚠️ Migrate all chat features from `/chat` to `/chat-v2`

## Context Files

Always consult and update relevant context files in `/context/`:

- `context/state.md` - Current sprint, completed work, next steps
- `context/info.md` - Vision, roadmap, high-level architecture
- `context/decisions.md` - Architecture decisions and rationales
- `context/insights.md` - UX/product learnings
- `context/schema.md` - Database schema overview
- `context/events-plan.md` - Event system implementation plan
- `context/copilotkit-migration-plan.md` - CopilotKit migration details
- `context/chat-v2-typescript-fixes.md` - TypeScript fixes for chat v2
- `context/lucide-react-troubleshooting.md` - Icon library troubleshooting
- **`context/plans/`** - Phased improvement plans:
  - `phase-1-critical-fixes.md` - ✅ COMPLETE (Week 1-2)
  - `phase-2-data-integrity.md` - 🔄 NEXT (Week 3-4)
  - `phase-3-trust-ux.md` - (Week 5-6)
  - `phase-4-performance-scale.md` - (Week 7)
  - `phase-5-community-engagement.md` - (Week 8)

**When to update:**
- When changing architecture, critical flows, or semantics for posts/events
- When making significant UI/UX changes
- When completing major features or phases
- When making important technical decisions

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

## Development Best Practices

### Code Quality
- **ALWAYS run before commit:**
  ```bash
  pnpm typecheck && pnpm lint
  ```
- **No `any` types:** Use strict TypeScript, prefer proper type definitions
- **Use shared types:** Import from `src/lib/schema.ts` and component type files
- **Component modularity:** Keep components under 300 lines; extract to subcomponents

### Git Workflow
1. Create feature branches: `git checkout -b feat/your-feature`
2. Run quality checks before committing
3. Write clear, descriptive commit messages
4. Reference GitHub issues in PRs
5. Keep commits atomic and focused

### Common Pitfalls & Solutions

**Problem:** Blank assistant bubble in chat
- **Solution:** Use `/chat-v2` with CopilotKit instead of legacy `/chat`

**Problem:** Icon library breaking after upgrade
- **Solution:** Pin `lucide-react` version, test dev server immediately, clear `.next`
- **Reference:** `context/lucide-react-troubleshooting.md`

**Problem:** Next.js/Tailwind native dependencies failing
- **Solution:** Run `pnpm install` from Windows PowerShell (not WSL) per USER RULES

**Problem:** Type errors in event/post queries
- **Solution:** Check `src/lib/schema.ts` for latest types, use Drizzle's inferred types

**Problem:** Auth middleware blocking routes
- **Solution:** Check `src/lib/auth-middleware.ts`, ensure route is in public list

**Problem:** Enhancement API returns 500 error (schema error)
- **Solution:** See `context/plans/data-quality-and-ux-improvements.md` Phase 1.1 for fix
- **Issue:** Using `generateText` when OpenRouter expects `generateObject` with Zod schema

**Problem:** Resources with (0,0) coordinates appearing on map
- **Solution:** See Phase 1.3 - geocoding failures should skip insertion, not insert invalid coords

**Problem:** Duplicate resources being inserted
- **Solution:** See Phase 2.2 - enhanced duplicate detection with multi-factor scoring

### Performance Considerations
- Use Server Components by default (`src/app/**/page.tsx`)
- Client Components only when needed (hooks, interactivity)
- Optimize images with Next.js `<Image>` component
- Lazy load heavy components (map, chat) when appropriate
- Database queries: Always use indexed columns (lat/lng, userId, eventId)

## Known Completed vs Pending

## Known Completed vs Pending

**✅ Completed:**
- Core map discovery with Mapbox GL
- **Admin Discovery Workflow:** Scan new areas + deduplication logic
- AI chat with CopilotKit v2 and tool renderers
- Better Auth with Google OAuth
- Phase 1 community social (posts, comments, follows, karma)
- Phase 3A/3B event backend + creation + detail UI
- Event calendar discovery with filters
- Mode-based community layout refactor
- RSVP and signup sheet functionality
- Full-page chat layout fixes
- **Data Quality Phase 1 (Critical Fixes):** Enhancement API, pagination, geocoding, indices, timeouts
- **Data Quality Phase 2 (Data Integrity):** Confidence scoring, duplicate detection, validation, versioning
- **Trust & UX (Phase 3 Core):**
  - Verification badges & source attribution
  - Data completeness indicators
  - Map deep linking & auto-centering
  - Sidebar resource details
  - Community "Resources Near You" widget

**🚧 In Progress:**
- **Phase 4 (Performance & Scale):** PostGIS, Redis, Pagination, Batch Ops
- **Admin Verification UX Redesign** (Refining table view)

**📋 Pending / Future:**
- **Phase 3 Wrap-up:** User contribution flows (suggestions), Mobile card optimization
- **Community Engagement (Phase 5):** Gamification, provider claims, leaderboards
- Deeper discovery (map overlays, calendar entry points everywhere)
- Enhanced signup sheet UI (Phase 3C)
- Host tools and event management dashboard
- Check-ins and safety flows (Phase 3E)
- Recurring event UX improvements (Phase 3F)
- Visual polish passes on community UI
- Mobile app (React Native)
- Push notifications
- Real-time updates (WebSockets)

## Core Principles

This file is your authoritative onboarding for how to think about and extend TheFeed. Always align changes with these principles:

- **Dignity:** Treat users experiencing food insecurity with respect and privacy
- **Clarity:** Clear information hierarchy, no jargon, accessible language
- **Hierarchy over hiding:** Use smart filtering/prioritization, don't hide content
- **Strict typing:** TypeScript all the way, no `any`
- **Minimal surprises:** Consistent UX patterns, predictable behavior
- **Speed matters:** Fast food discovery can be life-changing
- **Community first:** Enable neighbor-to-neighbor support and trust-building

### USER RULES (DO NOT DELETE)

- Always run `pnpm install`/`pnpm add`/`pnpm dev` from **Windows PowerShell**, never from WSL, so that optional native dependencies (Next SWC, lightningcss, etc.) are installed for Windows only.
- Pin icon-library versions in `package.json` instead of using wide `^` ranges; that avoids picking up broken builds automatically.
- When upgrading `lucide-react`, test the dev server immediately and keep `.next` clean so regressions surface quickly.
