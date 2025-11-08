# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TheFeed** (formerly FoodShare) is a hyperlocal food-sharing network connecting people experiencing food insecurity with nearby resources and community support. Built on the Agentic Coding Starter Kit, it adds:

- **Interactive Map**: Mapbox GL-powered discovery of food banks with real-time filters
- **AI-Powered Chat**: Context-aware assistant with tool-calling for food bank search, directions, and hours
- **Community Potluck**: Full social network for peer-to-peer food sharing (posts, comments, follows, karma)
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

**Map System** (`src/app/map/`, `src/components/map/`)
- Server Component: `src/app/map/page.tsx` - Fetches all food banks, extracts unique services
- Client Component: `src/app/map/pageClient.tsx` - Manages filters, search, geolocation state
- Map Rendering: `src/components/map/MapView.tsx` - Mapbox GL with markers, clustering, popups
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
  - `posts`: User-generated content with mood, kind, location, expiration
  - `comments`: Threaded comments on posts
  - `userProfiles`: Karma, role, bio, denormalized stats
  - `follows`: Social graph (followerId → followingId)
  - `helpfulMarks`: Upvotes for posts and comments (userId → targetType/targetId)

**Geolocation Utilities** (`src/lib/geolocation.ts`)
- `getUserLocation()`: Browser geolocation API wrapper
- `calculateDistance()`: Haversine formula (returns miles)
- `isCurrentlyOpen()`: Parses hours JSON, handles overnight schedules
- `formatHoursForDisplay()`: User-friendly hour strings

**Food Bank Queries** (`src/lib/food-bank-queries.ts`)
- `searchFoodBanks()`: In-memory filtering by distance/open status/services
- `getAllFoodBanks()`: Fetch all from database
- `getFoodBankById()`: Single record lookup

**Community Social System** (`src/app/community/`, `src/app/api/posts/`) — **NEW in Phase 2**
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
  kind: "share" | "request" | "update" | "resource";
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

### Current Sprint (Phase 2: Community Social Features - Week 1)

**Branch**: `feat/community-social-mvp`

**Active Work**:
1. **Community backend implementation** - Building posts, comments, userProfiles tables
2. **API routes for posts** - CRUD operations with cursor-based pagination
3. **Real data integration** - Replacing hardcoded posts with database queries

**Previous Issues (Resolved in PR #12)**:
- ~~Map markers not rendering~~ - Fixed in PR #12
- ~~Chat blank responses after ZIP~~ - Fixed in PR #12
- ~~Community page static~~ - Implementing full social features now

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
