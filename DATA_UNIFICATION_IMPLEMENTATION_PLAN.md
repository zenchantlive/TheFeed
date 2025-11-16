# TheFeed Data Unification & UI/UX Enhancement
## Implementation Plan

**Date:** 2025-01-16
**Status:** Planning Phase
**Priority:** High-Impact Integrations First

---

## Executive Summary

After comprehensive analysis of TheFeed's current architecture, I've identified that **most integration infrastructure already exists**. The codebase has excellent foundations for unified data access:

- ✅ All entities (foodBanks, posts, events) have location coordinates
- ✅ Map already renders both food banks AND events
- ✅ AI tools provide location-based search across all types
- ✅ Query modules are well-structured and optimized

**The main work is surfacing existing capabilities and adding strategic enhancements** rather than rebuilding core architecture.

---

## Current State: What Already Works

### 1. **Unified Location Data** ✅
**Status:** Complete

All major entities store geographic coordinates:
```typescript
// Database schema (src/lib/schema.ts)
foodBanks: { latitude: real, longitude: real }
posts: { locationCoords: json<{ lat, lng }> }
events: { locationCoords: json<{ lat, lng }> }
```

**Query helpers available:**
- `src/lib/food-bank-queries.ts` - `searchFoodBanks(userLocation, radiusMiles)`
- `src/lib/event-queries.ts` - `getEvents(params)` with `onlyWithCoords` filter
- `src/lib/post-queries.ts` - `getPosts(params)` (basic filtering)

**AI tools:**
- `src/lib/ai-tools.ts` exports `sousChefTools` with location-aware search:
  - `search_resources` - Food banks within radius
  - `search_events` - Events within radius and time window
  - `search_posts` - Community posts within radius

### 2. **Map Multi-Layer Support** ✅
**Status:** Events layer implemented, posts layer ready to add

**File:** `src/app/map/pageClient.tsx`

Current implementation:
- `useMapEvents()` hook fetches events with filters (type, date range)
- Events render as Calendar icons with gradients (potluck vs volunteer)
- Food banks render as MapPin icons (color-coded by open/closed status)
- User location shown as blue dot
- Click handlers for both food banks and events

**What's needed:** Posts layer (30 min implementation)

### 3. **Community Page Mode-Based UX** ✅
**Status:** Complete with smart filtering

**File:** `src/app/community/page-client.tsx`

Features:
- "I'm hungry" / "I'm Full" mode toggles
- Event filtering by mode (food events vs volunteer events)
- Post prioritization by mode (shares vs requests)
- Geolocation detection with neighborhood display
- Distance calculations for posts

### 4. **Cross-Area Data Access** ✅
**Status:** AI tools provide this, needs UI surface area

The Sous-Chef AI (CopilotKit v2) can:
- Search across all entity types with one query
- Calculate distances and directions
- Combine results intelligently

**What's needed:** Direct UI integration (not just via chat)

---

## Key Gaps & Opportunities

### Priority 1: High-Impact, Low-Effort (1-2 weeks)

#### 1.1 **Add Posts Layer to Map** 🎯
**Effort:** 4-6 hours
**Impact:** HIGH - Community activity visualization

**Implementation:**
```typescript
// src/app/map/pageClient.tsx

type MapPostPin = {
  id: string;
  content: string; // excerpt
  kind: "share" | "request";
  latitude: number;
  longitude: number;
  createdAt: Date;
  urgency?: string;
};

// Add useMapPosts hook similar to useMapEvents
function useMapPosts({ radiusMiles, kinds }) {
  const [posts, setPosts] = useState<MapPostPin[]>([]);
  // Fetch posts with locationCoords within radius
  // Filter by kinds (share, request, etc.)
  return { posts, isLoading };
}

// Update MapView.tsx to render post markers
// Use MessageSquare icon, color by kind (share = green, request = orange)
```

**User benefit:** See real-time community activity spatially

#### 1.2 **Cross-Area Navigation Links** 🎯
**Effort:** 2-3 hours
**Impact:** HIGH - Seamless user flows

**Implementation:**
```typescript
// Add query params for deep linking

// From Chat → Map with filters
/map?lat=37.7749&lng=-122.4194&type=events&filter=potluck

// From Community → Map with event highlighted
/map?eventId=abc123&zoom=14

// From Map → Event detail
/community/events/{id}

// From Map → Chat with context
/chat-v2?context=resource:{id}
```

**Files to modify:**
- `src/app/map/pageClient.tsx` - Read URL params, set initial state
- `src/app/community/page-client.tsx` - Add "View on map" buttons
- `src/app/chat-v2/page-client.tsx` - Accept context param

#### 1.3 **Unified Search Bar Component** 🎯
**Effort:** 6-8 hours
**Impact:** MEDIUM-HIGH - Easier discovery

**New component:**
```typescript
// src/components/unified-search/GlobalSearch.tsx

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>();

  // Debounced search across:
  // - Food banks (name, services, city)
  // - Events (title, description, location)
  // - Posts (content, location)

  // Group results by type, show counts
  // Click → navigate to relevant area with filters
}
```

**Integration points:**
- Add to `src/components/site-header.tsx` (desktop)
- Add to `src/components/navigation/BottomNav.tsx` (mobile search icon)

#### 1.4 **Enhanced Event Discovery on Map** 🎯
**Effort:** 3-4 hours
**Impact:** HIGH - Current blind spot

**Enhancements:**
- Event clusters when zoomed out (avoid marker overlap)
- Time-based filtering UI on map page (today, this week, this month)
- Quick RSVP from map popup (currently requires navigation)

**Files:**
- `src/app/map/pageClient.tsx` - Add clustering logic
- `src/components/map/MapView.tsx` - Implement marker clustering
- Create `src/components/map/EventQuickRsvp.tsx` - Inline RSVP form

---

### Priority 2: Medium Effort, High Value (2-3 weeks)

#### 2.1 **Unified Location-Based Query Helper** 🎯
**Effort:** 1-2 days
**Impact:** MEDIUM - Developer experience improvement

**New file:** `src/lib/unified-location-queries.ts`

```typescript
export type LocationEntity = {
  id: string;
  type: "foodBank" | "event" | "post";
  title: string;
  description: string;
  location: string;
  coordinates: { lat: number; lng: number };
  distance?: number;
  metadata: Record<string, unknown>; // type-specific data
  createdAt: Date;
};

export async function searchNearbyEntities({
  userLocation,
  radiusMiles = 10,
  types = ["foodBank", "event", "post"],
  filters = {},
  limit = 50,
}: {
  userLocation: { lat: number; lng: number };
  radiusMiles?: number;
  types?: Array<"foodBank" | "event" | "post">;
  filters?: {
    eventType?: "potluck" | "volunteer";
    postKind?: "share" | "request";
    openNow?: boolean;
  };
  limit?: number;
}): Promise<LocationEntity[]> {
  // Fetch from each table in parallel
  // Merge results, calculate distances
  // Sort by distance or relevance
  // Return unified type
}
```

**Benefits:**
- Single query for "everything near me"
- Powers unified search, map layers, and AI tools
- Consistent distance calculations

#### 2.2 **Activity Heatmap Layer** 🎯
**Effort:** 2-3 days
**Impact:** MEDIUM - Visual discovery enhancement

**Implementation:**
```typescript
// Use Mapbox GL heatmap layer
// Show density of:
// - Recent posts (last 7 days)
// - Upcoming events (next 7 days)
// - Food bank visit patterns (if we add check-ins later)

// src/components/map/ActivityHeatmap.tsx
```

**User benefit:** Quickly identify active neighborhoods

#### 2.3 **Smart Context-Aware Suggestions** 🎯
**Effort:** 3-4 days
**Impact:** HIGH - Proactive assistance

**Features:**
- "You're near 3 food banks open now" - show banner when map loads
- "2 potlucks this weekend in your area" - community page notification
- "Ask Sous-Chef about nearby resources" - prompt when user seems stuck

**Implementation:**
```typescript
// src/hooks/useSmartSuggestions.ts

export function useSmartSuggestions(userLocation, context) {
  // Query nearby entities
  // Apply rules based on:
  //   - Time of day
  //   - User's current page
  //   - Recent activity
  //   - Mode (hungry/full)

  return {
    suggestions: Suggestion[],
    priority: "high" | "medium" | "low"
  };
}
```

---

### Priority 3: Advanced Features (3-4 weeks)

#### 3.1 **Real-Time Activity Updates** 🎯
**Effort:** 1 week
**Impact:** HIGH - Community engagement

**Technology:** Supabase Realtime

```typescript
// Subscribe to:
// - New posts in user's area
// - Event RSVP updates
// - Food bank status changes (future)

// src/lib/realtime.ts
export function useRealtimePosts(radiusMiles) {
  // Postgres LISTEN/NOTIFY via Supabase
  // Filter by location on client side
}
```

**User benefit:** Live feed of community activity

#### 3.2 **Multi-Area Calendar View** 🎯
**Effort:** 1 week
**Impact:** MEDIUM - Planning tool

**Features:**
- Split view: Calendar + Map
- Click date → map shows that day's events
- Click event → calendar scrolls to date
- Export to Google Calendar

**File:** `src/app/community/events/calendar/page.tsx` (enhance existing)

#### 3.3 **Personalized Discovery Feed** 🎯
**Effort:** 1.5 weeks
**Impact:** HIGH - User retention

**Algorithm:**
```typescript
// src/lib/discovery-algorithm.ts

export function generatePersonalizedFeed(userId, location) {
  // Factors:
  // 1. User's saved locations (proximity)
  // 2. Past RSVPs (similar event types)
  // 3. Followed users' activity
  // 4. Trending items in neighborhood
  // 5. User's mode preferences (hungry/full history)

  // Return mixed feed of:
  // - Recommended events
  // - Nearby posts
  // - Food bank updates
  // - Community highlights
}
```

**Integration:** New `/discover` page or enhanced `/community` default view

---

## Technical Architecture Decisions

### Decision 1: Keep Separate Tables, Add Unified Query Layer ✅

**Rationale:**
- Current schema is well-normalized and performant
- Each entity has type-specific fields (e.g., events.rsvpCount, posts.helpfulCount)
- Unified queries can be built on top without schema changes

**Approach:**
- Create `src/lib/unified-location-queries.ts` as abstraction layer
- Use parallel queries with Promise.all for performance
- Return unified type with discriminated union for type-specific data

### Decision 2: Location-Based Queries Use Haversine Formula ✅

**Current implementation:**
```typescript
// src/lib/geolocation.ts
export function calculateDistance(from, to) {
  // Haversine formula for great-circle distance
  // Returns miles
}
```

**Performance:**
- Suitable for current scale (< 10k entities)
- If scale grows: Consider PostGIS extension for spatial queries
- For now: Filter in application code after fetching

### Decision 3: Cross-Area Navigation via URL Params ✅

**Pattern:**
```typescript
// Consistent query param naming:
?lat=X&lng=Y         // Location context
&type=events         // Entity type filter
&id=abc123           // Specific entity
&mode=hungry         // User mode
&zoom=14             // Map zoom level
```

**Benefits:**
- Shareable links
- Browser back/forward works
- Easy to implement with Next.js router

---

## Implementation Phases

### Phase 1: Quick Wins (Week 1-2) 🏃‍♂️

**Goal:** Surface existing capabilities, add posts to map

**Tasks:**
1. [ ] Add posts layer to map (4-6 hours)
   - Create `useMapPosts()` hook
   - Add post markers to MapView
   - Style by kind (share/request)
   - Add PostPopup component

2. [ ] Implement cross-area navigation (2-3 hours)
   - Add URL param handling to map
   - Add "View on map" buttons to community page
   - Add context param to chat

3. [ ] Enhanced event discovery on map (3-4 hours)
   - Add event clustering
   - Improve time filters UI
   - Add quick RSVP modal

**Success criteria:**
- Users can see community posts on map
- Seamless navigation between areas
- Faster event discovery

### Phase 2: Unified Discovery (Week 3-4) 🔍

**Goal:** Global search and smart suggestions

**Tasks:**
1. [ ] Create GlobalSearch component (6-8 hours)
   - Multi-entity search
   - Type-ahead results
   - Grouped by entity type
   - Navigate to filtered views

2. [ ] Build unified location queries (1-2 days)
   - `searchNearbyEntities()` function
   - Parallel queries with caching
   - Distance-based sorting

3. [ ] Smart context-aware suggestions (3-4 days)
   - `useSmartSuggestions()` hook
   - Notification banners
   - Proactive assistance prompts

**Success criteria:**
- Users can search across all content types
- Relevant suggestions appear automatically
- Faster path to desired action

### Phase 3: Enhanced Visualization (Week 5-6) 🗺️

**Goal:** Activity heatmap and real-time updates

**Tasks:**
1. [ ] Activity heatmap layer (2-3 days)
   - Implement Mapbox heatmap
   - Toggle layer on/off
   - Filter by time range

2. [ ] Real-time activity feed (1 week)
   - Set up Supabase Realtime
   - Subscribe to nearby posts
   - Live updates in community feed
   - Event RSVP notifications

3. [ ] Multi-area calendar view (1 week)
   - Calendar + Map split view
   - Synchronized interactions
   - Export functionality

**Success criteria:**
- Users see activity patterns visually
- Live updates engage community
- Planning tools are intuitive

### Phase 4: Personalization (Week 7-8) 🎯

**Goal:** Personalized discovery and recommendations

**Tasks:**
1. [ ] Discovery algorithm (1.5 weeks)
   - User preference tracking
   - Recommendation engine
   - Mixed entity feed

2. [ ] Enhanced `/discover` page (3-4 days)
   - Personalized feed layout
   - "For you" / "Nearby" / "Following" tabs
   - Infinite scroll

3. [ ] User preferences and settings (2-3 days)
   - Default radius setting
   - Notification preferences
   - Favorite neighborhoods

**Success criteria:**
- Personalized experience for returning users
- Higher engagement with recommendations
- User satisfaction with relevance

---

## Success Metrics

### User Experience Metrics
- **Cross-Area Navigation:** % of sessions using multiple areas
- **Map Engagement:** Time spent on map, entities clicked
- **Discovery Efficiency:** Time from landing to desired action
- **Search Usage:** % of users using global search
- **Return Rate:** Weekly active users

### Technical Metrics
- **Query Performance:** < 200ms for location-based searches
- **Map Load Time:** < 2s for initial render
- **Real-time Latency:** < 500ms for live updates
- **Bundle Size:** Keep under 500KB for main bundle

### Community Metrics
- **Posts with Location:** % of posts that include coordinates
- **Event RSVPs:** Conversion rate from map view
- **AI Tool Usage:** % of sessions using Sous-Chef
- **Cross-Entity Discovery:** Users finding resources via events/posts

---

## Risk Mitigation

### Risk 1: Performance Degradation
**Mitigation:**
- Implement pagination on all queries (already done for posts/events)
- Add Redis caching layer for frequent queries
- Monitor query times with logging
- Use database indexes on lat/lng columns

### Risk 2: Location Privacy Concerns
**Mitigation:**
- Posts show approximate location only (neighborhood level)
- User location never stored permanently
- Clear privacy policy about geolocation
- Opt-in for precise location sharing

### Risk 3: Scope Creep
**Mitigation:**
- Stick to phased approach
- Ship Phase 1 before starting Phase 2
- Get user feedback between phases
- Maintain focus on core use case (food access)

---

## Next Steps

1. **Review & Approval:** Team reviews this plan
2. **Phase 1 Kickoff:** Start with quick wins
3. **User Testing:** After Phase 1, gather feedback
4. **Iterate:** Adjust Phases 2-4 based on learnings
5. **Document:** Update CLAUDE.md and context files

---

## Appendix: File Structure

### New Files to Create

```
src/
├── lib/
│   └── unified-location-queries.ts    # Unified search across entities
├── components/
│   ├── unified-search/
│   │   ├── GlobalSearch.tsx           # Main search component
│   │   ├── SearchResults.tsx          # Results display
│   │   └── SearchFilters.tsx          # Type/distance filters
│   ├── map/
│   │   ├── PostPopup.tsx              # Post detail popup
│   │   ├── EventQuickRsvp.tsx         # Quick RSVP modal
│   │   └── ActivityHeatmap.tsx        # Heatmap layer
│   └── discovery/
│       ├── SmartSuggestions.tsx       # Context-aware prompts
│       └── PersonalizedFeed.tsx       # Custom feed layout
├── hooks/
│   ├── useMapPosts.ts                 # Posts on map hook
│   ├── useSmartSuggestions.ts         # Suggestions hook
│   └── useRealtimeUpdates.ts          # Realtime subscriptions
└── app/
    └── discover/
        └── page.tsx                   # New discovery page (Phase 4)
```

### Files to Modify

```
src/
├── app/
│   ├── map/
│   │   ├── page.tsx                   # Add URL param handling
│   │   └── pageClient.tsx             # Add posts layer
│   ├── community/
│   │   └── page-client.tsx            # Add map navigation
│   └── chat-v2/
│       └── page-client.tsx            # Accept context param
├── components/
│   ├── site-header.tsx                # Add global search
│   ├── navigation/BottomNav.tsx       # Add search icon
│   └── map/
│       └── MapView.tsx                # Render posts, clustering
└── lib/
    └── ai-tools.ts                    # Use unified queries (optional)
```

---

## Questions for Discussion

1. **Priority Order:** Do Phases 1-4 align with product goals?
2. **Real-time Features:** Is Supabase Realtime the right choice, or prefer polling?
3. **Personalization:** How much user data should we track for recommendations?
4. **Mobile Experience:** Any mobile-specific enhancements needed?
5. **Analytics:** What additional metrics should we track?

---

**Document Version:** 1.0
**Last Updated:** 2025-01-16
**Owner:** Claude Agent
**Reviewers:** Development Team
