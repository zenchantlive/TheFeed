---
title: "Part 2: Foundation - Building the Core Architecture"
series: "TheFeed Development Journey"
part: 2
date: 2025-11-06
updated: 2025-12-27
tags: ["architecture", "database", "schema", "drizzle-orm"]
reading_time: "10 min"
commits_covered: "41149ed..20f2576"
---

## Where We Are

By early November 2025, FoodShare had a name, a mission, and basic infrastructure. The next critical step was designing and implementing the **core architecture**—the database schema, API routes, and data layers that would support everything to come. This post covers the foundation building that happened in Phase 1 and the architectural decisions that shaped the entire system.

## The Database Schema Philosophy

With better-auth handling authentication and Drizzle ORM managing the database, we needed to decide: What data matters for a hyperlocal food-sharing network?

### The Core Tables

**Basic Structure** (`src/lib/schema.ts`):

1. **Authentication** (from Better Auth):
   - `user`: Identity (id, name, email, image, role)
   - `session`, `account`, `verification`: OAuth flow management

2. **Resources**:
   - `foodBanks`: The source of truth for food assistance locations
     - Geographic: `latitude`, `longitude`, `geom` (for PostGIS later)
     - Hours: Stored as JSON (flexible, searchable)
     - Verification: `verificationStatus`, `adminVerifiedAt` (trust signals)
     - Confidence: `confidenceScore` (data quality metric)
   - `savedLocations`: User bookmarks (personalization)

3. **Communication**:
   - `chatMessages`: AI conversation history

### The Intentional Minimalism

The schema was deliberately small. No posts, no events, no social features yet. Why?

**Principle**: Build incrementally. Each phase adds new tables only when needed. This constraint forced clean separation of concerns and prevented architectural bloat.

If we had added everything upfront:
- The schema would be overwhelming
- We'd optimize for premature use cases
- Updates would touch more tables, increasing failure points

Instead, we kept Phase 1 minimal and added new tables in Phase 1 (posts), Phase 3 (events), Phase 5 (gamification).

## The API Route Architecture

With Next.js 15 App Router, the API structure was clean and conventional:

```
src/app/api/
├── chat/route.ts           # Vercel AI SDK streaming
├── locations/route.ts      # Food bank CRUD
└── (auth routes handled by Better Auth)
```

### Key Design Decision: Server-Centric Data Fetching

Rather than building a heavy GraphQL layer, we chose:
- Server components for initial data fetching (`src/app/*/page.tsx`)
- API routes for mutations and real-time updates
- Minimal client-side state management

This kept the system simple and leveraged Next.js 15's server components strongly.

### Locations API Design

The `src/app/api/locations/route.ts` endpoint powered multiple features:

```typescript
// GET /api/locations?lat=38.5&lng=-121.4&radius=5
// Returns nearby food banks (paginated)

// GET /api/locations/all (when authenticated)
// Returns user's saved locations
```

Early implementation included:
- Radius-based search using Haversine distance (in-memory, pre-PostGIS)
- Pagination support
- Basic filtering

## The Data Layer: From Simple to Sophisticated

In these early days, we established a pattern: **encapsulate all data access in query files** (`src/lib/*-queries.ts`).

### Food Bank Queries (`src/lib/food-bank-queries.ts`)

```typescript
// Early functions (still in use today):
export async function searchFoodBanks(lat: number, lng: number, radiusMiles: number) {
    // Fetch from database with radius filtering
}

export async function getFoodBankById(id: string) {
    // Single resource with all metadata
}
```

This pattern would scale beautifully:
- Later, we could swap in PostGIS queries without changing the API
- Caching could be added at this layer
- Tests could mock these functions

## The Community Layout Emerges

Around November 6-7, the team was designing the community experience (`46bd4a5` - "Refine TheFeed experience with integrated potluck UI"). Key decisions:

1. **Two-Column Layout**
   - Left: Posts/feed content
   - Right: Sidebar with widgets (stats, resources, suggestions)

2. **Mode-Based Design** (concept)
   - "I'm hungry" vs "I'm full" toggle
   - Different content prioritization based on user intent
   - This idea would mature significantly in later UX iterations

3. **Location as Context**
   - Every post has optional location (`locationCoords`)
   - Map integration from day one
   - Foundation for "Resources Near You" later

## User Experience Infrastructure

**User Profiles** (`eb71ad7`):
- Added avatar dropdown to site header
- Created user profile page
- Foundation for personalization

**Branding Completion** (`41149ed`):
- Visual identity solidified
- Color palette established (warm "hungry" accent, cool "helper" accent)
- Typography: Geist Sans/Mono fonts locked in

## Testing Approach

By this phase, the team had established:
- `bun run typecheck` for fast type checking (2-5s)
- `bun run lint` for code quality
- Pre-commit hooks for validation

The pattern: catch errors early, before expensive builds.

## What We Got Right

1. **Minimal, Intentional Schema**: Starting small forced us to think deeply about core abstractions. The `posts` table design in Phase 1 is still the base for everything.

2. **Data Layer Abstraction**: Putting all queries in `*-queries.ts` files meant we could:
   - Optimize queries later (PostGIS migration in Phase 4)
   - Add caching without touching routes
   - Test queries independently
   - Keep route handlers lean

3. **Vercel AI SDK Adoption**: Choosing the Vercel AI SDK (over raw OpenAI calls) positioned us perfectly for:
   - Easy provider switching (OpenAI → OpenRouter)
   - Streaming support
   - Tool calling
   - CopilotKit integration later

## What We Learned

1. **Schema decisions echo forever**. The fact that we stored coordinates as JSON in posts and hours as JSON in food banks would later be a source of optimization challenges. Starting with PostGIS geometry would have been nice, but the incremental approach let us learn what queries actually mattered first.

2. **Simplicity is a feature**. Every table not added is one less thing to reason about. Every API route not written is less code to maintain. The temptation to "be ready for anything" is strong, but it leads to overengineering.

3. **Separate concerns early**. By putting data access in separate files, we created natural boundaries. Later, when performance became critical, we could optimize at the right layer.

## Up Next

With the foundation solid—database schema established, API routes working, and the community experience conceptualized—the next phase would implement the social layer. Posts, comments, follows, and the karma system would bring communities to life.

---

**Key Commits**: `41149ed` (branding), `eb71ad7` (profiles), `ba84abb` (locations API), `46bd4a5` (community concept)

**Related Code**: `src/lib/schema.ts`, `src/lib/food-bank-queries.ts`, `src/app/api/locations/route.ts`
