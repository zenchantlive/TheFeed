# TheFeed Project Overview (formerly FoodShare)
Last updated: 2025-11-07

## Vision
TheFeed is a hyperlocal food-sharing network that connects people experiencing food insecurity with:
1. **Nearby Resources**: Food banks, pantries, and community programs (AI-powered discovery)
2. **Neighbor Support**: Peer-to-peer food sharing within 2-5 mile radius (community potluck)
3. **Empathetic Guidance**: AI sous-chef for meal planning, directions, and resource navigation

**Mission**: Reduce food waste and food insecurity simultaneously by building trusted community networks.

## Product Strategy

### Target Market
- **Initial Launch**: Sacramento, CA (Midtown neighborhood)
- **Beachhead**: Walkable, diverse community with mix of sharers and seekers
- **Expansion**: Replicate neighborhood-by-neighborhood model to other cities

### Success Metrics
1. **Primary**: Completed food exchanges (peer-to-peer transactions)
2. **Secondary**: Active users (weekly posting/commenting)
3. **Tertiary**: Food bank resource usage (AI chat → visit conversions)

### Differentiation (vs Facebook groups, Nextdoor, Buy Nothing)
- **Dignity-preserving**: Requests look identical to shares (no stigma)
- **AI-assisted**: Sous-chef helps with meal planning, not just logistics
- **Hyperlocal**: 2-5 mile radius (actually walkable/bikeable)
- **Gamified**: Karma system rewards generosity, builds trust
- **Purpose-built**: Designed for food sharing (not general classifieds)

## Roadmap Summary

### **Phase 1: MVP Foundation** (Completed)
- ✅ AI chat tuned for food needs & quick actions
- ✅ Interactive map with real locations, hours, services
- ✅ Profile with saved locations (Better Auth + Supabase)
- ✅ Mobile-first UI with bottom navigation
- ✅ Static community page mockup (PR #12)

### **Phase 2: Community Social Features** (IN PROGRESS - 6 weeks)
**Goal**: Enable real peer-to-peer food sharing with full social features

#### Week 1 - Core Infrastructure
- Posts, comments, userProfiles database tables
- API routes for posts CRUD
- Real data fetching on community page

#### Week 2 - UI Decluttering
- Feed-first layout (remove inline composer)
- Floating Action Button (FAB) for posting
- Composer modal/drawer
- Mood toggles relocated to header

#### Week 3 - Engagement Features
- Comments on posts
- Helpful marks (upvote system)
- Karma calculation and display

#### Week 4 - Social Graph
- Follow/unfollow users
- "Following" feed filter
- User profiles with stats

#### Week 5 - Location & Urgency
- Location sharing (text + coordinates)
- Expiration timestamps ("Available until 6pm")
- Urgency indicators (ASAP, Today, This week)
- Nearby filter using geolocation

#### Week 6 - Real-Time & Polish
- Supabase Realtime subscriptions
- Photo upload infrastructure (Supabase Storage)
- Animations and mobile optimization
- Loading states and skeletons

### **Phase 3: Launch & Iterate** (Post-MVP)
- Recruit 10-15 founding members in Midtown Sacramento
- Founder acts as guide, manually facilitates exchanges
- Gather feedback, iterate on UX
- Measure: 3 successful exchanges in first month

### **Phase 4: Food Bank Partner Tools**
- Admin portal for food banks
- Inventory/status management
- Analytics dashboard for partners
- Integration with existing food bank systems

### **Phase 5: Scale & Expand**
- Replicate to East Sacramento, Land Park
- Recruit community guides (not just founder)
- Automated moderation tools
- Advanced search and filters

### **Phase 6: Revenue & Sustainability**
- 501c3 application
- Grant funding (USDA, local food security grants)
- Partner sponsorships (grocery stores, restaurants)
- Consider premium features for power users

## Current Focus (2025-11-07)
**Branch**: `feat/community-social-mvp`

### This Sprint (Week 1 of Phase 2)
- 🔄 Update database schema with social tables
- ⏳ Build API routes for posts and comments
- ⏳ Connect community page to real data
- ⏳ Enable actual posting (temporary UI)

### Previous Sprint (PR #12)
- ✅ Rebrand FoodShare → TheFeed
- ✅ Build static community page mockup
- ✅ Implement mood-based composer
- ✅ Design feed filters and sidebar widgets

## Key Files

### Community Features (New)
- `src/lib/schema.ts` — Social tables: posts, comments, userProfiles, follows, helpfulMarks
- `src/lib/post-queries.ts` — Post data access layer (NEW)
- `src/app/api/posts/route.ts` — Posts CRUD API (NEW)
- `src/app/api/posts/[id]/route.ts` — Single post operations (NEW)
- `src/app/api/posts/[id]/comments/route.ts` — Comments API (NEW)
- `src/app/community/page.tsx` — Server component (updated)
- `src/app/community/page-client.tsx` — Client component with real data (updated)

### Existing Core Features
- `src/app/map/`, `src/components/map/` — Mapbox GL integration
- `src/app/api/chat/route.ts` — Vercel AI SDK with tool definitions
- `src/lib/food-bank-queries.ts` — Food bank data access
- `src/lib/geolocation.ts` — Distance calculations, hours parsing
- `README.md`, `context/` — Documentation hub

## Commands

### Development
```bash
pnpm dev                              # Start dev server (don't run manually)
pnpm lint && pnpm typecheck           # Quality checks (run after changes)
```

### Database Operations
```bash
pnpm run db:generate                  # Generate migrations from schema
pnpm run db:migrate                   # Apply migrations
pnpm run db:push                      # Push schema directly (dev only)
pnpm run db:studio                    # Open Drizzle Studio GUI
```

### Seeding
```bash
pnpm exec tsx --env-file=.env scripts/seed-food-banks.ts   # Seed food banks
```

## Architecture Highlights

### Database (Supabase Postgres + Drizzle)
- **Better Auth**: user, session, account, verification
- **Food Resources**: foodBanks, savedLocations
- **Community**: posts, comments, userProfiles, follows, helpfulMarks
- **AI**: chatMessages

### API Routes (Next.js App Router)
- `/api/chat` — AI chat with tool calling (search, directions, hours)
- `/api/locations` — Saved locations CRUD
- `/api/posts` — Posts CRUD with pagination
- `/api/posts/[id]` — Single post operations
- `/api/posts/[id]/comments` — Comments on posts
- `/api/posts/[id]/helpful` — Mark helpful (upvote)
- `/api/users/[id]/follow` — Follow/unfollow users

### Frontend Pages
- `/` — Landing page
- `/chat` — AI sous-chef assistant (protected)
- `/map` — Interactive food bank map
- `/community` — Community potluck feed (protected)
- `/profile` — User profile with saved locations (protected)

## GitHub Tracking
- **Project Board**: https://github.com/users/zenchantlive/projects/2
- **Current PR #12**: https://github.com/zenchantlive/TheFeed/pull/12 (conceptual UI fixes)
- **Next PR**: feat/community-social-mvp → claude/conceptual-ui-fixes → main

## Active Issues
- ~~Map markers/search not rendering~~ (addressed in PR #12)
- ~~Chat blank responses after ZIP~~ (addressed in PR #12)
- Community page needs real backend (IN PROGRESS)
