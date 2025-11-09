# TheFeed Project Overview (formerly FoodShare)
Last updated: 2025-11-09

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

### **Phase 2: Community Social Features** (COMPLETED - Week 1)
**Goal**: Enable real peer-to-peer food sharing with full social features

#### Week 1 - Core Infrastructure ✅ (PR #15)
- Posts, comments, userProfiles database tables
- API routes for posts CRUD
- Real data fetching on community page
- Post creation working end-to-end

#### Weeks 2-6 - Additional Features ⏳
- UI decluttering (FAB, composer modal, feed-first layout)
- Comments, helpful marks, karma display
- Follow/unfollow, user profiles
- Location & urgency features
- Real-time updates and polish

### **Phase 3: Event Hosting System** (IN PROGRESS - 6 weeks)
**Goal**: Enable neighbors to organize community potlucks and volunteer opportunities

#### Phase 3A - Event Foundation ✅
- 6 event tables: events, eventRsvps, signUpSlots, signUpClaims, eventRecurrence, eventAttendance
- event-queries.ts data layer with RSVP and sign-up slot management
- Complete API routes for events, RSVPs, and sign-up sheets
- Capacity limits, waitlist logic, and promotion from waitlist

#### Phase 3B - Event Creation & Detail Page ✅
- Event creation flow with multi-step form
- Event detail page with RSVP section
- Host-only edit/cancel controls
- Map showing event location

#### Phase 3C - Sign-Up Sheets ✅
- Sign-up slot management UI
- Claim/unclaim slot functionality
- Potluck coordination interface

#### Phase 3D - Discovery Integration ✅
- Event cards in community feed (shared filters, persistence)
- Event pins on map with popovers + CTA
- Calendar view for events with month nav + agenda
- Discovery filters synced across feed/map/calendar
- Calendar shortcut added to bottom nav

#### Phase 3E - Host Tools & Safety ⏳
- Attendee check-in flow
- Guide verification system
- Waitlist management UI
- Event notifications

#### Phase 3F - Recurring Events ⏳
- Recurrence pattern UI
- Recurring event instance generation
- Calendar display for recurring events

### **Phase 4: Launch & Iterate** (Post-MVP)
- Recruit 10-15 founding members in Midtown Sacramento
- Founder acts as guide, manually facilitates exchanges
- Gather feedback, iterate on UX
- Measure: 3 successful exchanges and 2 community events in first month

### **Phase 5: Food Bank Partner Tools**
- Admin portal for food banks
- Inventory/status management
- Analytics dashboard for partners
- Integration with existing food bank systems

### **Phase 6: Scale & Expand**
- Replicate to East Sacramento, Land Park
- Recruit community guides (not just founder)
- Automated moderation tools
- Advanced search and filters

### **Phase 7: Revenue & Sustainability**
- 501c3 application
- Grant funding (USDA, local food security grants)
- Partner sponsorships (grocery stores, restaurants)
- Consider premium features for power users

## Current Focus (2025-11-09)
**Branch**: `phase-3` (Phase 3E upcoming)

### Latest Sprint Wrap (Phase 3D - Discovery Surfaces)
- ✅ Event cards + client-side filters on community feed
- ✅ Shared discovery filter context with persistence
- ✅ `/api/events/calendar` + calendar page
- ✅ Map-based event pins with popovers + CTA
- ✅ Calendar button added to bottom nav
- ✅ PR #18 merged into `phase-3`

### Next Sprint (Phase 3E - Host Tools)
- ⏳ Host dashboard for waitlist + attendee management
- ⏳ Check-in UI and attendance tracking
- ⏳ Guide verification workflows
- ⏳ Notification strategy (waitlist promotions, reminders)

## Key Files

### Event Hosting Features
- `src/lib/schema.ts` — Event tables: events, eventRsvps, signUpSlots, signUpClaims, eventRecurrence, eventAttendance
- `src/lib/event-queries.ts` — Event data access layer (NEW)
- `src/app/api/events/route.ts` — Events CRUD + discovery filters (eventType, dates, coords)
- `src/app/api/events/[id]/route.ts` — Single event operations
- `src/app/api/events/[id]/rsvp/route.ts` — RSVP management
- `src/app/api/events/[id]/slots/route.ts` — Sign-up slots management
- `src/app/api/events/[id]/slots/[slotId]/claim/route.ts` — Claim/unclaim slots
- `src/app/api/events/calendar/route.ts` — Month-level calendar data
- `src/app/community/events/calendar/page.tsx` — Calendar UI + agenda
- `src/app/community/discovery-context.tsx` — Shared filters (type/date) w/ persistence
- `src/app/community/use-discovery-events.ts` — Client fetcher for feed cards
- `src/components/events/event-card.tsx` — Reusable event card
- `src/app/map/pageClient.tsx` + `src/components/map/MapView.tsx` — Event pins/popovers

### Community Features (Phase 2)
- `src/lib/schema.ts` — Social tables: posts, comments, userProfiles, follows, helpfulMarks
- `src/lib/post-queries.ts` — Post data access layer
- `src/app/api/posts/route.ts` — Posts CRUD API
- `src/app/api/posts/[id]/route.ts` — Single post operations
- `src/app/api/posts/[id]/comments/route.ts` — Comments API
- `src/app/community/page.tsx` — Server component (fetches real posts)
- `src/app/community/page-client.tsx` — Client component with post creation

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
