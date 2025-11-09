# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TheFeed** (formerly FoodShare) is a hyperlocal food-sharing network connecting people experiencing food insecurity with nearby resources and community support. Built on the Agentic Coding Starter Kit, it adds:

- **Interactive Map**: Mapbox GL-powered discovery of food banks with real-time filters
- **AI-Powered Chat**: Context-aware assistant with tool-calling for food bank search, directions, and hours
- **Community Potluck**: Full social network for peer-to-peer food sharing (posts, comments, follows, karma)
- **Event Discovery**: Feed spotlight cards, map pins, and calendar view with shared filters
- **User Profiles**: Save locations, track visits, build reputation with Better Auth + Supabase

### Tech Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Database**: PostgreSQL (Supabase) with Drizzle ORM
- **AI**: Vercel AI SDK 5 + OpenRouter (default: `openai/gpt-4.1-mini`)
- **Authentication**: Better Auth with Google OAuth
- **Maps**: Mapbox GL JS via `react-map-gl`
- **UI**: shadcn/ui + Tailwind CSS 4 with dark mode

## Essential Commands

```bash
# Development
pnpm dev                              # Start dev server (Turbopack) - DON'T run yourself
pnpm build                            # Production build (runs db:migrate first)
pnpm start                            # Start production server

# Quality checks (ALWAYS run after changes)
pnpm lint && pnpm typecheck           # Run both linters

# Database operations
pnpm run db:generate                  # Generate migrations from schema changes
pnpm run db:migrate                   # Apply migrations to database
pnpm run db:push                      # Push schema directly (dev only)
pnpm run db:studio                    # Open Drizzle Studio GUI
pnpm run db:reset                     # Drop all tables and repush

# Seeding
pnpm exec tsx --env-file=.env scripts/seed-food-banks.ts  # Seed food banks (Sacramento dataset)
```

## Architecture & Key Files

### Core FoodShare Features

- **Map System** (`src/app/map/`, `src/components/map/`)
  - Server Component: `src/app/map/page.tsx` - Fetches all food banks, extracts unique services
  - Client Component: `src/app/map/pageClient.tsx` - Manages filters, search, geolocation state **plus event pins**
  - Map Rendering: `src/components/map/MapView.tsx` - Mapbox GL with food bank + event markers, popups
- Search: `src/components/map/MapSearchBar.tsx` - Debounced search input
- Popup: `src/components/map/LocationPopup.tsx` - Food bank details with directions

**AI Chat System** (`src/app/chat/`, `src/app/api/chat/`)
- Backend: `src/app/api/chat/route.ts` - OpenRouter streaming with 3 tools:
  - `search_food_banks`: Proximity search with filters (distance, open now, services)
  - `get_directions`: Generate Google Maps URL
  - `check_hours`: Verify current open status
- Frontend: `src/app/chat/page.tsx` - Intent-based UI (hungry/full), quick actions, markdown rendering
- System Prompt: Empathetic, concise (2-3 sentences), prioritizes open locations

**Database Schema** (`src/lib/schema.ts`)
- Better Auth tables: `user`, `session`, `account`, `verification`
- `foodBanks`: Core locations with lat/lng, hours (JSON), services (array), description
- `savedLocations`: User bookmarks (userId → foodBankId)
- `chatMessages`: Conversation history (optional sessionId grouping)
- **Community tables (Phase 2)**:
  - `posts`: User-generated content with mood, kind (including "event"), location, expiration
  - `comments`: Threaded comments on posts
  - `userProfiles`: Karma, role, bio, denormalized stats
  - `follows`: Social graph (followerId → followingId)
  - `helpfulMarks`: Upvotes for posts and comments (userId → targetType/targetId)
- **Event hosting tables (Phase 3A)**:
  - `events`: Main event details (potlucks, volunteer opportunities) with capacity, status, verification
  - `eventRsvps`: RSVP tracking with guest count, waitlist support, and notes
  - `signUpSlots`: Sign-up sheet categories for potluck coordination
  - `signUpClaims`: Who signed up for which slots and what they're bringing
  - `eventRecurrence`: Recurring event patterns (daily, weekly, biweekly, monthly)
  - `eventAttendance`: Check-in tracking for completed events

**Geolocation Utilities** (`src/lib/geolocation.ts`)
- `getUserLocation()`: Browser geolocation API wrapper
- `calculateDistance()`: Haversine formula (returns miles)
- `isCurrentlyOpen()`: Parses hours JSON, handles overnight schedules
- `formatHoursForDisplay()`: User-friendly hour strings

**Food Bank Queries** (`src/lib/food-bank-queries.ts`)
- `searchFoodBanks()`: In-memory filtering by distance/open status/services
- `getAllFoodBanks()`: Fetch all from database
- `getFoodBankById()`: Single record lookup

**Community Social System** (`src/app/community/`, `src/app/api/posts/`) — Phase 2 baseline + Phase 3 discovery
- Server Component: `src/app/community/page.tsx` - Fetches initial posts with pagination
- Client Component: `src/app/community/page-client.tsx` - Feed rendering, mood toggles, filters
- Post Queries: `src/lib/post-queries.ts` - Post data access layer with cursor pagination
- API Routes:
  - `GET/POST /api/posts` - List posts (paginated) and create new posts
  - `GET/PATCH/DELETE /api/posts/[id]` - Single post operations
  - `GET/POST /api/posts/[id]/comments` - Comments on posts
  - `POST/DELETE /api/posts/[id]/helpful` - Mark post as helpful (upvote)
  - `POST/DELETE /api/users/[id]/follow` - Follow/unfollow users
  - `GET /api/users/[id]/profile` - User profile with karma and stats

**Community Database Schema** (`src/lib/schema.ts`)
- `posts`: User posts (content, mood, kind, location, expiration, engagement counts)
- `comments`: Nested comments on posts
- `userProfiles`: Extended user data (karma, role, bio, stats)
- `follows`: Social graph (many-to-many user relationships)
- `helpfulMarks`: Upvote system for posts and comments

**Post Data Types**:
```typescript
type Post = {
  id: string;
  userId: string;
  content: string;
  mood: "hungry" | "full" | null;
  kind: "share" | "request" | "update" | "resource" | "event"; // "event" added in Phase 3A
  location?: string; // Free text: "13th & P St"
  locationCoords?: { lat: number; lng: number };
  expiresAt?: Date; // Time-sensitive posts
  urgency?: "asap" | "today" | "this_week";
  photoUrl?: string; // Future: Supabase Storage URL
  metadata?: { tags?: string[] };
  helpfulCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

**Key Community Features**:
1. **Mood-based posting**: "I'm hungry" (requesting) vs "I'm full" (sharing)
2. **Location awareness**: Free text + optional coordinates for map integration
3. **Urgency indicators**: ASAP, Today, This week badges
4. **Karma system**: Points from helpful marks, displayed as badges (🌱 <10, 🌿 10-50, 🌳 50+)
5. **Follow relationships**: Users can follow each other, filter feed to "Following"
6. **Cursor-based pagination**: Infinite scroll using (createdAt, id) cursor
7. **Dignity-preserving UX**: Requests look identical to shares (no visual stigma)

**Event Hosting System** (`src/lib/event-queries.ts`, `src/app/api/events/`) — **Phase 3A-3D Complete**
- **Status**: Backend + RSVP + sign-up UI + discovery surfaces all live (Phase 3E next)
- Event Queries: `src/lib/event-queries.ts` - Event data access layer (650+ lines)
- API Routes:
  - `GET/POST /api/events` - List events (paginated) and create new events (supports filters: eventType, startAfter/before, coords)
  - `GET/PATCH/DELETE /api/events/[id]` - Single event operations (host-only edit/delete)
  - `GET/POST/DELETE /api/events/[id]/rsvp` - RSVP management with waitlist logic
  - `GET/POST /api/events/[id]/slots` - Sign-up slot management (host creates slots)
  - `POST/DELETE /api/events/[id]/slots/[slotId]/claim` - Claim/unclaim sign-up slots
  - `GET /api/events/calendar` - Month view for calendar page

**Event Database Schema** (`src/lib/schema.ts`):
- `events`: Main event table with capacity, status, guide verification, recurring event support
- `eventRsvps`: RSVP tracking (attending/waitlisted/declined) with guest count and notes
- `signUpSlots`: Sign-up sheet categories for potluck coordination (e.g., "Main dish", "Dessert")
- `signUpClaims`: Who claimed which slots and what they're bringing
- `eventRecurrence`: Recurring event patterns (weekly, monthly, etc.)
- `eventAttendance`: Check-in tracking for karma and analytics

**Event Data Types**:
```typescript
type Event = {
  id: string;
  postId: string; // Links to feed post (hybrid integration)
  hostId: string;
  title: string;
  description: string;
  eventType: "potluck" | "volunteer";
  startTime: Date;
  endTime: Date;
  location: string;
  locationCoords?: { lat: number; lng: number };
  isPublicLocation: boolean; // Encouraged via UI
  capacity?: number | null; // null = unlimited
  rsvpCount: number; // Denormalized
  waitlistCount: number; // Denormalized
  status: "upcoming" | "in_progress" | "completed" | "cancelled";
  isVerified: boolean; // Guide verification
  recurrenceId?: string;
  parentEventId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Key Event Features**:
1. **Hybrid integration**: Every event has a feed post (postId link) for discovery
2. **Capacity management**: Automatic waitlist when full, promotion when spots open
3. **Sign-up sheets**: Potluck coordination (what to bring)
4. **Recurring events**: Weekly, monthly patterns with instance generation
5. **Guide verification**: Trust badge for verified events
6. **Host controls**: Only host can edit/cancel/check-in attendees
7. **RSVP with guests**: Track guest count (+1, +2, etc.)
8. **Waitlist automation**: First waitlisted user promoted when someone cancels

**Phase 3B: Event Creation & Detail Page** ✅ COMPLETE:
- **Status**: Full event creation and detail viewing implemented and working
- **Routes**:
  - `/community/events/new` - 5-step event creation wizard (protected)
  - `/community/events/[id]` - Event detail page with RSVP functionality
- **Components** (src/components/events/):
  - `event-creation-wizard.tsx` - Multi-step form orchestrator with validation and API integration
  - `event-basic-info-step.tsx` - Step 1: Event type (potluck/volunteer), title, description
  - `event-datetime-step.tsx` - Step 2: Date/time pickers with shadcn calendar
  - `event-location-step.tsx` - Step 3: Location text input + interactive Mapbox map picker
  - `event-capacity-step.tsx` - Step 4: Capacity limits (unlimited or max attendees)
  - `event-signup-sheet-step.tsx` - Step 5: Sign-up sheet builder (potlucks only)
  - `event-detail-content.tsx` - Complete event detail page with RSVP, attendee list, sign-up sheet display
- **Integration**:
  - "Host Event" button added to `/community` page header
  - Events automatically create feed posts with kind="event"
  - Direct database queries (no API roundtrip) for server components

**Phase 3C: Sign-up Sheet Claiming UI** ✅ COMPLETE:
- RSVP-gated claim/unclaim buttons with modal form for “what I’m bringing”
- Reusable `PotluckSlotItem` component keeps event detail tidy
- Batched sign-up claim queries prevent Supabase connection exhaustion

**Phase 3D: Discovery Surfaces** ✅ COMPLETE:
- Reusable `EventCard` + shared discovery filters (`src/app/community/discovery-context.tsx`)
- Client-side fetcher `use-discovery-events.ts` powers feed cards with persistence
- Calendar API + page: `/api/events/calendar`, `/community/events/calendar`
- Map page fetches `onlyWithCoords=true` events and renders pins w/ popovers
- Bottom nav now links directly to calendar for mobile users

**Phase 3E-3F TODO** (Upcoming):
- Phase 3E: Host management tools, check-in UI, guide verification, notifications
- Phase 3F: Recurring event UI and calendar surfacing

### TheFeed-Specific Components

- `src/components/foodshare/big-action-button.tsx` - Intent buttons (hungry/full variants)
- `src/components/foodshare/status-badge.tsx` - Open/closed status pills
- `src/components/foodshare/location-card.tsx` - Food bank card with distance, hours, services
- `src/components/navigation/BottomNav.tsx` - Mobile bottom navigation

### Navigation Structure

- `/` - Home/landing page
- `/map` - Interactive food bank map
- `/chat` - AI assistant (protected)
- `/community` - Stories/programs showcase
- `/dashboard` - User dashboard (protected)
- `/profile` - Saved locations (protected)

## Environment Variables

Required beyond standard boilerplate:

```env
# Mapbox (required for map features)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your-mapbox-token

# Database (Supabase)
POSTGRES_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?sslmode=require

# AI (OpenRouter)
OPENROUTER_MODEL=openai/gpt-4.1-mini  # Optional, defaults to this value
```

See `env.example` for complete list including Better Auth and Google OAuth.

## Platform Notes

**Development Environment**: Windows 11 + WSL2
- User runs commands in **PowerShell** (Windows)
- Claude Code runs in **WSL** (Linux)
- **Important**: User should run `npx shadcn@latest add` commands in PowerShell, not WSL
- **Migration caveat**: Run `pnpm run db:generate` and `pnpm run db:migrate` in PowerShell if esbuild errors occur in WSL
- Paths: Use WSL paths (`/mnt/c/Users/...`) when Claude makes file changes

## Development Workflow

### Adding Food Bank Data

1. Update `scripts/seed-food-banks.ts` with new locations
2. Ensure hours follow format: `{ Monday: { open: "9:00 AM", close: "5:00 PM" }, ... }`
3. Services must match existing categories for filters to work
4. Run: `pnpm exec tsx --env-file=.env scripts/seed-food-banks.ts`
5. Verify in Drizzle Studio: `pnpm run db:studio`

### Modifying Database Schema

1. Edit `src/lib/schema.ts` (use Drizzle syntax)
2. Generate migration: `pnpm run db:generate`
3. Review migration in `drizzle/` folder
4. Apply: `pnpm run db:migrate`
5. Update related TypeScript types (inferred from schema)

### Working with AI Chat Tools

1. Tool definitions in `src/app/api/chat/route.ts` (`tools` object)
2. Add Zod schema for input validation (`z.object()`)
3. Implement `execute` function (can be async, call DB/external APIs)
4. Return serializable JSON (no functions, undefined → null)
5. Update system prompt if tool requires special instructions
6. Test with user messages that trigger tool calls

### Map Component Changes

- **Markers**: Edit `MapView.tsx` marker rendering logic
- **Filters**: Update `pageClient.tsx` filter state and logic
- **Search**: Modify `MapSearchBar.tsx` and server-side data fetching
- **Popups**: Customize `LocationPopup.tsx` for different data displays

### Working with Community Features

**Adding a new post field**:
1. Update `posts` table in `src/lib/schema.ts`
2. Run `pnpm run db:generate` to create migration
3. Apply with `pnpm run db:migrate`
4. Update TypeScript types (inferred from schema via `$inferSelect`)
5. Modify POST handler in `src/app/api/posts/route.ts`
6. Update UI in `src/app/community/page-client.tsx`

**Implementing pagination**:
```typescript
// Cursor format: { createdAt: ISO string, id: string }
const cursor = searchParams.get('cursor')
  ? JSON.parse(searchParams.get('cursor')!)
  : null;

const posts = await getPosts({ cursor, limit: 20 });

// Return with nextCursor
return { posts: posts.items, nextCursor: posts.nextCursor };
```

**Updating karma** (when helpful mark added):
```typescript
// Increment post.helpfulCount
await db.update(posts)
  .set({ helpfulCount: sql`${posts.helpfulCount} + 1` })
  .where(eq(posts.id, postId));

// Recalculate author karma (sum of all helpful marks)
const totalHelpful = await db
  .select({ count: sql<number>`count(*)` })
  .from(helpfulMarks)
  .where(eq(helpfulMarks.userId, authorId));

await db.update(userProfiles)
  .set({ karma: totalHelpful[0].count })
  .where(eq(userProfiles.userId, authorId));
```

**Feed filtering patterns**:
```typescript
// By kind (share/request)
where: eq(posts.kind, 'share')

// By mood
where: eq(posts.mood, 'hungry')

// By following (join with follows table)
const followedUserIds = await db
  .select({ userId: follows.followingId })
  .from(follows)
  .where(eq(follows.followerId, currentUserId));

where: inArray(posts.userId, followedUserIds.map(f => f.userId))

// Hide expired posts
where: or(
  isNull(posts.expiresAt),
  gt(posts.expiresAt, new Date())
)
```

## Important Patterns

### Protected Routes

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function ProtectedPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/");
  }
  // ... authenticated content
}
```

### Client-Side Auth Hooks

```typescript
import { useSession } from "@/lib/auth-client";

export default function Component() {
  const { data: session, isPending } = useSession();
  // ... use session data
}
```

### Database Queries (Drizzle)

```typescript
import { db } from "@/lib/db";
import { foodBanks } from "@/lib/schema";
import { eq } from "drizzle-orm";

// Find all
const all = await db.select().from(foodBanks);

// With filter
const filtered = await db.select().from(foodBanks).where(eq(foodBanks.state, "CA"));

// Relational queries (use db.query)
const withRelations = await db.query.foodBanks.findMany({
  where: (fb, { eq }) => eq(fb.id, id),
});
```

### OpenRouter AI Integration

```typescript
import { openrouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";

const result = streamText({
  model: openrouter(process.env.OPENROUTER_MODEL || "openai/gpt-4.1-mini"),
  system: "System prompt here",
  messages: convertToModelMessages(messages),
  tools: { /* tool definitions */ },
});
```

**CRITICAL**: Always use `openrouter()` from `@openrouter/ai-sdk-provider`, NOT `openai()` from `@ai-sdk/openai`.

## Known Issues & Active Work

### Current Sprint (Phase 3B: Event Hosting UI - Week 2)

**Branch**: `feat/event-hosting-phase3a`

**Active Work**:
1. **Event creation wizard** - 5-step form for creating potlucks and volunteer events
2. **Event detail page** - Display event info, RSVP functionality, attendee list
3. **UI components** - Calendar picker, location selector with Mapbox, sign-up sheets

**Phase 3A Complete (PR #16)** ✅:
- Backend infrastructure (6 database tables, event-queries.ts, 5 API route files)
- PR: https://github.com/zenchantlive/TheFeed/pull/16

**Previous Issues (Resolved)**:
- ~~Map markers not rendering~~ - Fixed in PR #12
- ~~Chat blank responses after ZIP~~ - Fixed in PR #12
- ~~Community page static~~ - Fixed in PR #15 (Phase 1)
- ~~Event TypeScript errors~~ - Fixed in Phase 3A (cache issue)

### Context Files

The `context/` directory maintains project memory between sessions:

- `context/decisions.md` - Architecture decisions with rationale
- `context/state.md` - Active tasks, blockers, next steps
- `context/info.md` - Vision, roadmap, key files reference
- `context/insights.md` - Lessons learned, patterns
- `context/git.md` - Git workflow notes

**Update these files** when making significant changes or discoveries.

## Testing & Validation

Before considering work complete:

1. **Always run**: `pnpm lint && pnpm typecheck`
2. **Manual testing**:
   - Map: Verify markers appear, filters work, popup opens
   - Chat: Test intent buttons, tool calls, quick actions
   - Auth: Sign in/out flow, protected route redirects
3. **Database**: Check Drizzle Studio for expected data
4. **Mobile**: Test responsive layout (375px width minimum)

## Styling Guidelines

- Use Tailwind utility classes (Tailwind CSS 4)
- Follow shadcn/ui color tokens: `bg-background`, `text-foreground`, `text-muted-foreground`
- Support dark mode with Tailwind's `dark:` prefix (next-themes provider in layout)
- FoodShare brand colors:
  - Primary gradient: `from-primary-start to-primary-end`
  - Accent: `text-primary`, `bg-primary`
- Mobile-first: Design for 375px, enhance for larger screens
- Use `cn()` utility from `@/lib/utils` for conditional classes

## Package Manager

This project uses **pnpm**. Always use `pnpm` commands, not `npm` or `yarn`.

## Documentation

Technical guides in `docs/`:
- `docs/technical/ai/streaming.md` - AI streaming patterns
- `docs/technical/ai/structured-data.md` - Structured output extraction
- `docs/technical/react-markdown.md` - Markdown rendering in chat
- `docs/business/starter-prompt.md` - Business context for prompts

## Contributing

When working on FoodShare:

1. Check `context/state.md` for current priorities
2. Reference GitHub project board: https://github.com/users/zenchantlive/projects/2
3. Create feature branches from `master`: `git checkout -b feat/description`
4. Run lint/typecheck before committing
5. Update context files if making architectural changes
6. Link commits to GitHub issues when applicable

## Support

- GitHub Issues: https://github.com/zenchantlive/TheFeed/issues
- Project Board: https://github.com/users/zenchantlive/projects/2
