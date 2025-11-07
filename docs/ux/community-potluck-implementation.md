# TheFeed Community Potluck Implementation

## Overview

This document describes the "Community Potluck" UI/UX implementation completed in PR #9. The goal was to transform TheFeed from a basic food resource app into a playful, community-driven platform where neighbors share food and help each other using the "I'm hungry / I'm full" vernacular.

## Architecture Decisions

### Next.js 15 Server/Client Component Pattern

Following Next.js 15 App Router best practices, the implementation uses proper server/client component separation:

- **Server Components** (`page.tsx`) - Handle data fetching and SEO
- **Client Components** (`page-client.tsx`) - Handle interactivity and state

This pattern:
- ✅ Reduces JavaScript bundle size sent to the client
- ✅ Maintains Server-Side Rendering (SSR) benefits
- ✅ Improves performance and SEO
- ✅ Follows Next.js 15 recommended architecture

**Example:** `src/app/community/page.tsx` (Server Component) passes static data to `src/app/community/page-client.tsx` (Client Component).

## Key Features Implemented

### 1. Community Feed with Potluck Theme

**Location:** `src/app/community/`

The community tab now presents a social feed styled as a "community potluck" where neighbors can:

- **Post food shares** ("I'm full") - Share leftovers or extra food
- **Post food requests** ("I'm hungry") - Request food assistance
- **View guide updates** - See verified updates from community guides
- **Add resources** - Contribute new food resource locations

**Feed Post Types:**
```typescript
type FeedPost = {
  id: string;
  author: string;
  role: "neighbor" | "guide" | "community";
  mood: "hungry" | "full" | "update";
  kind: "share" | "request" | "update" | "resource";
  distance: string;
  timeAgo: string;
  body: string;
  meta?: {
    location?: string;
    until?: string;
    status?: "verified" | "community" | "needs-love";
  };
  tags?: string[];
  replies?: Reply[];
};
```

**Features:**
- Filter feed by post type (shares, requests, updates)
- Mood-based composer with toggle between "I'm hungry" / "I'm full"
- Inline replies and engagement actions
- Cross-linking to AI chat and map

### 2. AI Chat Integration with Intent System

**Location:** `src/app/chat/page.tsx`

The chat interface now supports playful "hungry/full" intents:

**Intent Presets:**
```typescript
const INTENT_PRESETS = {
  hungry: "Hey Sous-Chef, I'm hungry. Find the closest warm meals or pantries open within the next hour and tell me what to bring.",
  full: "Hey Sous-Chef, I'm full. Help me share my leftovers or volunteer nearby so nothing goes to waste."
};
```

**URL Parameter Handling:**
- `?intent=hungry` - Auto-triggers hungry intent
- `?intent=full` - Auto-triggers full intent
- `?prefill=<text>` - Pre-fills composer with text
- **Priority:** Intent takes precedence over prefill (prevents conflicts)

**Hero Actions:**
- "I'm hungry" button (hungry intent)
- "I'm full" button (full intent)

**Quick Actions After Responses:**
- Jump to community feed
- Open food map
- Send follow-up prompts

### 3. Saved Locations Feature

**Location:** `src/hooks/use-saved-locations.ts`, `src/app/api/locations/route.ts`

Users can now save favorite food resource locations:

**API Endpoints:**
- `GET /api/locations?foodBankId=<id>` - Check if location is saved
- `POST /api/locations` - Save a location
- `DELETE /api/locations` - Unsave a location
- `GET /api/locations` - Get all saved locations for user

**UI Components:**
- `src/components/profile/SavedLocationsList.tsx` - Display saved locations
- `src/components/map/LocationPopup.tsx` - Save/unsave button in map popups

**Database Schema:**
```typescript
export const savedLocations = pgTable("saved_location", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  foodBankId: text("food_bank_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

### 4. Theming & Visual Updates

**Location:** `src/app/globals.css`

Updated CSS design tokens for playful mood-based theming:

**Light Mode:**
- Warm white backgrounds
- Sage green primary colors
- Terracotta accent colors
- Gradient tokens for "hungry" (warm oranges) and "full" (sage greens)

**Dark Mode:**
- Charcoal backgrounds
- Lighter card surfaces
- Warm white text
- Enhanced gradients with better contrast

**Mood Gradients:**
```css
--hungry-start: #f4a261;
--hungry-end: #e76f51;
--full-start: #8fa998;
--full-end: #6a8a82;
```

### 5. Navigation & Cross-Tab Integration

**Updated Navigation:**
- Bottom nav maintains 4 tabs: Chat, Map, Community, Profile
- Contextual cross-linking between tabs
- "Ask the sous-chef" links throughout app

**Cross-Tab Features:**
- Community feed → Chat (ask AI about posts)
- Community feed → Map (view locations)
- Map → Save locations (visible in profile)
- Chat → Community (see neighbor posts)

## Component Architecture

### Server Components
- `src/app/community/page.tsx` - Community feed data provider
- `src/app/page.tsx` - Landing page
- Layout components with metadata

### Client Components
- `src/app/community/page-client.tsx` - Interactive community feed
- `src/app/chat/page.tsx` - AI chat interface
- `src/components/foodshare/big-action-button.tsx` - Hero action buttons
- `src/components/navigation/BottomNav.tsx` - Tab navigation
- `src/components/profile/SavedLocationsList.tsx` - Saved locations UI

### Shared UI Components
- `src/components/ui/*` - shadcn/ui primitives
- `src/components/site-header.tsx` - App header
- `src/components/site-footer.tsx` - App footer

## Data Flow

### Community Feed
```
page.tsx (Server) → Prepare static data
  ↓
page-client.tsx (Client) → Handle interactions, filters, state
  ↓
User interactions → Update local state, navigate to chat/map
```

### Saved Locations
```
User clicks save → useSavedLocation hook
  ↓
POST /api/locations → Database write
  ↓
Update UI state → Show "Saved" confirmation
  ↓
Profile page → Fetch and display saved locations
```

### Chat Intent Flow
```
User clicks "I'm hungry" → Send intent preset to AI
  ↓
AI responds → Show quick actions
  ↓
User selects action → Navigate to map/community or send follow-up
```

## Voice & Tone

The implementation uses playful, approachable language throughout:

- **Hungry mood:** "I'm starving, help!" "Find a hot meal before the stomach grumbles"
- **Full mood:** "I'm full and want to share" "Got leftovers to spare"
- **AI assistant:** "TheFeed Sous-chef" "What's cooking, neighbor?"
- **Community:** "Community potluck is buzzing" "Post to the potluck"

## Testing Checklist

When testing this implementation:

- [ ] Community feed filters work (all, shares, requests, updates)
- [ ] Mood toggle switches between "hungry" and "full" correctly
- [ ] Chat intent URLs (`?intent=hungry`, `?intent=full`) work
- [ ] Chat prefill URL (`?prefill=<text>`) works
- [ ] Intent takes priority over prefill when both present
- [ ] Save/unsave locations in map popups
- [ ] Saved locations appear in profile
- [ ] Cross-tab navigation works (chat → community, community → map, etc.)
- [ ] Responsive layout works on mobile and desktop
- [ ] Dark mode styling is correct

## Future Enhancements

Potential improvements not included in this PR:

- Real-time feed updates (websockets)
- Actual post creation (currently mock data)
- User notifications for replies
- Location-based filtering
- Image uploads for food shares
- In-app messaging between neighbors

## Files Changed

Key files modified in this implementation:

```
src/app/chat/page.tsx              - Intent system & URL handling
src/app/community/page.tsx         - Server component with feed data
src/app/community/page-client.tsx  - Interactive feed UI
src/app/api/locations/route.ts     - Saved locations API
src/app/profile/page.tsx           - Display saved locations
src/app/globals.css                - Theming & gradients
src/hooks/use-saved-locations.ts   - Location save/unsave logic
src/components/profile/SavedLocationsList.tsx - Saved locations UI
src/lib/schema.ts                  - Database schema
```

## Performance Considerations

- ✅ Server/client component separation reduces bundle size
- ✅ Static data in server components (SSR)
- ✅ Client-only features use "use client" directive
- ✅ Lazy loading for map components
- ✅ Optimized re-renders with proper React hooks

## Accessibility

- Semantic HTML throughout
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management in modals/dialogs
- Color contrast meets WCAG AA standards

## Documentation References

- **Planning:** `docs/planning/social-media-experience.md` - Original vision
- **Mockups:** `docs/mockups/community-feed-mockup.html` - Visual reference
- **Context:** `context/` - Project decisions and state
