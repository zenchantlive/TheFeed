# Cross-Area Navigation & Deep Linking Architecture Audit

**Date**: 2025-11-19
**Author**: Architecture Audit Agent
**Branch**: `claude/audit-navigation-deeplink-01P4HxvrMe8HMpsJPBrYHx2J`

---

## Executive Summary

- **Navigation Architecture Health**: **BROKEN**
- **Critical Issues**: 3 blocking cross-area navigation
- **High Priority**: 4 causing state desynchronization
- **Medium/Low Issues**: 5 polish opportunities

### Key Finding

**The documented "URL-driven cross-area navigation" has NOT been implemented.** Despite `state.md` claiming this feature shipped, the map page contains **zero `useSearchParams()` calls**, making all deep links to the map completely non-functional. Community → Map navigation links exist but do nothing.

---

## Architecture Overview

### Current Implementation (Actual)

```
URL Parameters → [IGNORED] → Local useState() → UI
                                     ↑
           localStorage ←──── DiscoveryFiltersProvider
```

### Expected Implementation

```
URL Parameters → useSearchParams() → [Context / State] → UI
       ↑                                                  ↓
       └────────────────── User Actions ←─────────────────┘
```

### Route Parameter Contracts (Documented vs Actual)

| Route | Documented Parameters | Actually Implemented |
|-------|----------------------|---------------------|
| `/map` | `foodBankId`, `eventId`, `postId`, `eventType`, `postKind`, `highlight`, `event` | **NONE** |
| `/community` | None documented | **NONE** (mode is local state) |
| `/community/events/calendar` | `month=YYYY-MM`, `type=all\|potluck\|volunteer` | **YES** (fully working) |
| `/chat-v2` | `intent=hungry\|full` | **PARTIAL** (read-only, no action) |
| `/chat` | `prefill` | **NOT READ** |

---

## Critical Issues

### Issue 1: Map Page Has No URL Parameter Support

**Severity**: CRITICAL
**Category**: Deep Linking
**Affected Routes**: `/map`

**Problem Description**:
The MapPageClient component (`src/app/map/pageClient.tsx`) does not import or call `useSearchParams()` anywhere. All map state is managed via `useState()` hooks initialized to default values, making every deep link to the map page non-functional.

**Broken Deep Links**:
```
/map?event=abc123         → From events-section/index.tsx:92
/map?highlight=abc123     → From SavedLocationsList.tsx:75
/map?foodBankId=abc123    → Documented in CLAUDE.md
/map?eventId=abc123       → Documented in CLAUDE.md
/map?postId=abc123        → Documented in CLAUDE.md
```

**Current Implementation** (`src/app/map/pageClient.tsx:200-219`):
```tsx
function MapPageView({ foodBanks, services }: MapPageClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [openNow, setOpenNow] = useState(false);
  const [maxDistance, setMaxDistance] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);        // ❌ Always null
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null); // ❌ Always null
  // ...
}
```

**Impact**:
- Clicking "Map pin" icon on event cards navigates to `/map?event=123` but shows no event
- Clicking "View on map" for saved locations does nothing
- No way to share a link to a specific food bank
- AI chat tool results can't link to map with pre-selected items

**Recommended Fix**:
```tsx
// src/app/map/pageClient.tsx
import { useSearchParams, useRouter } from "next/navigation";

function MapPageView({ foodBanks, services }: MapPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Read URL parameters on mount and when they change
  useEffect(() => {
    const foodBankId = searchParams.get('foodBankId') || searchParams.get('highlight');
    const eventId = searchParams.get('eventId') || searchParams.get('event');
    const postId = searchParams.get('postId');

    if (foodBankId) {
      setSelectedId(foodBankId);
      // TODO: Center map on this food bank
    } else if (eventId) {
      setSelectedEventId(eventId);
      // TODO: Center map on this event
    } else if (postId) {
      // TODO: Handle post selection
    }
  }, [searchParams]);

  // Update URL when selection changes (optional, for shareable state)
  const handleSelectFoodBank = (id: string | null) => {
    setSelectedId(id);
    setSelectedEventId(null);
    if (id) {
      router.replace(`/map?foodBankId=${id}`, { scroll: false });
    } else {
      router.replace('/map', { scroll: false });
    }
  };

  // ... rest of component
}
```

**Testing Checklist**:
- [ ] Navigate to `/map?event=123` → Event marker selected, popup open
- [ ] Navigate to `/map?highlight=abc` → Food bank selected, popup open
- [ ] Click event in community → Map shows that event selected
- [ ] Click "View on map" in profile → Food bank selected
- [ ] Refresh page with URL params → Selection persists

---

### Issue 2: DiscoveryFiltersProvider Uses localStorage, Not URL

**Severity**: CRITICAL
**Category**: State Synchronization
**Affected Routes**: `/map`, `/community`

**Problem Description**:
The `DiscoveryFiltersProvider` (`src/app/community/discovery-context.tsx`) persists filter state to localStorage instead of URL parameters. This breaks shareable links and prevents URL-driven navigation.

**Current Implementation** (`src/app/community/discovery-context.tsx:24-54`):
```tsx
const STORAGE_KEYS = {
  eventType: "discovery:eventType",
  dateRange: "discovery:dateRange",
};

export function DiscoveryFiltersProvider({ children }: { children: ReactNode }) {
  const [eventTypeFilter, setEventTypeFilter] = useState<EventTypeFilter>("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>("week");

  // ❌ Reads from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedType = window.localStorage.getItem(STORAGE_KEYS.eventType);
    // ...
  }, []);

  // ❌ Persists to localStorage on change
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.eventType, eventTypeFilter);
  }, [eventTypeFilter]);
  // ...
}
```

**Impact**:
- Sharing `/map?eventType=potluck` does nothing - filters won't apply
- User A's filters don't transfer to User B when sharing links
- No way to bookmark filtered views
- Browser history has no filter state

**Recommended Fix**:
```tsx
// src/app/community/discovery-context.tsx
import { useSearchParams, useRouter } from "next/navigation";

export function DiscoveryFiltersProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Derive state from URL (single source of truth)
  const eventTypeFilter = useMemo(() => {
    const param = searchParams.get('eventType');
    if (param === 'potluck' || param === 'volunteer') return param;
    return 'all';
  }, [searchParams]);

  const dateRangeFilter = useMemo(() => {
    const param = searchParams.get('dateRange');
    if (param === 'month') return 'month';
    return 'week';
  }, [searchParams]);

  // Update URL when filters change
  const setEventTypeFilter = useCallback((value: EventTypeFilter) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'all') {
      params.delete('eventType');
    } else {
      params.set('eventType', value);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const setDateRangeFilter = useCallback((value: DateRangeFilter) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'week') {
      params.delete('dateRange');
    } else {
      params.set('dateRange', value);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  // ... rest of provider
}
```

**Migration Note**: Keep localStorage as fallback for one release cycle to avoid breaking existing users' saved preferences, then remove.

---

### Issue 3: Multiple Independent Provider Instances

**Severity**: HIGH
**Category**: Filter Architecture
**Affected Routes**: `/map`, `/community`

**Problem Description**:
Both `MapPageClient` and `CommunityPageClient` wrap their content in separate `DiscoveryFiltersProvider` instances. These are completely independent - they only share state because they both read/write to the same localStorage keys.

**Current Architecture**:
```
/map
  └─ MapPageClient
       └─ DiscoveryFiltersProvider (Instance A)
            └─ MapPageView

/community
  └─ CommunityPageClient
       └─ DiscoveryFiltersProvider (Instance B)
            └─ CommunityPageView
```

**Impact**:
- Provider state is not shared when navigating (different React trees)
- Must rely on localStorage sync (async, can cause flicker)
- Cannot lift filter state to common ancestor
- Potential for state inconsistencies during rapid navigation

**Recommended Architecture**:
```
app/layout.tsx
  └─ DiscoveryFiltersProvider (Single Instance)
       └─ All discovery routes
            ├─ /map → MapPageView
            ├─ /community → CommunityPageView
            └─ /community/events/calendar → CalendarView
```

Or, if URL is the source of truth (preferred):
```
Each route reads searchParams directly
  └─ No shared provider needed
  └─ URL is the sync mechanism
```

---

## High Priority Issues

### Issue 4: Chat Prefill Parameter Not Implemented

**Severity**: HIGH
**Category**: Deep Linking
**Affected Routes**: `/chat`

**Links Creating This Pattern**:
- `src/app/community/components/sidebar/map-cta-widget.tsx:32`
- `src/app/community/components/sidebar/index.tsx:105`
- `src/app/community/components/composer/index.tsx:113`

**Problem**: Links navigate to `/chat?prefill=...` but the chat page doesn't read this parameter.

**Current**: Chat page has no `useSearchParams()` call for prefill.

**Fix**: Add useSearchParams to read prefill and populate input.

---

### Issue 5: Chat-v2 Intent Parameter Read but Not Actioned

**Severity**: HIGH
**Category**: Deep Linking
**File**: `src/app/chat-v2/page-client.tsx:82-94`

**Current Implementation**:
```tsx
useEffect(() => {
  if (hasFiredIntentRef.current || hasAppliedIntent) return;

  const intent = searchParams?.get("intent");
  if (intent && (intent === "hungry" || intent === "full")) {
    hasFiredIntentRef.current = true;
    setHasAppliedIntent(true);

    // TODO: Implement auto-send via useCopilotChat when CopilotChat is ready
    console.log("Intent detected:", intent, INTENT_PRESETS[intent]);
  }
}, [searchParams, hasAppliedIntent]);
```

**Problem**: Intent is read but only logged, not sent to chat.

---

### Issue 6: No Standardized URL Parameter Construction

**Severity**: HIGH
**Category**: URL Contracts

**Problem**: Links are constructed with inconsistent parameter names:
- `/map?event=123` vs `/map?eventId=123`
- `/map?highlight=123` (foodBankId alias)

**Current Link Patterns Found**:
```tsx
// events-section/index.tsx
<Link href={`/map?event=${event.id}`}>  // Uses "event"

// SavedLocationsList.tsx
<Link href={`/map?highlight=${bank.id}`}>  // Uses "highlight"

// CLAUDE.md documents
/map?eventId=...    // Uses "eventId"
/map?foodBankId=... // Uses "foodBankId"
```

**Recommended**: Create utility function:
```typescript
// src/lib/utils/navigation.ts
export function mapUrl(params: {
  foodBankId?: string;
  eventId?: string;
  postId?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params.foodBankId) searchParams.set('foodBankId', params.foodBankId);
  if (params.eventId) searchParams.set('eventId', params.eventId);
  if (params.postId) searchParams.set('postId', params.postId);

  const query = searchParams.toString();
  return query ? `/map?${query}` : '/map';
}
```

---

### Issue 7: Calendar Filters Don't Sync with Map/Community

**Severity**: HIGH
**Category**: State Synchronization

**Problem**: Calendar page uses server-side searchParams properly, but uses different parameter names and doesn't integrate with DiscoveryFiltersProvider.

**Calendar**: `?month=2025-01&type=potluck`
**Map/Community**: Uses `eventTypeFilter` from Context

These are completely separate systems.

---

## Medium Priority Issues

### Issue 8: No Browser History Management for Filters

**Severity**: MEDIUM
**Category**: Browser History

**Problem**: When filters change, no history entry is created. Back button doesn't restore previous filter state.

**Recommendation**: Use `router.replace()` for filter changes (doesn't add history) and `router.push()` for navigation between routes.

---

### Issue 9: No Loading States During Deep Link Resolution

**Severity**: MEDIUM
**Category**: Deep Linking

**Problem**: When navigating to `/map?eventId=123`, there's no loading indicator while the event is being located and the map is centering.

**Recommendation**: Add Suspense boundary or loading state.

---

### Issue 10: No 404 Handling for Invalid Deep Links

**Severity**: MEDIUM
**Category**: Error Handling

**Problem**: If user navigates to `/map?eventId=nonexistent`, no error shown.

**Recommendation**: Validate entity exists, show toast or redirect if not.

---

### Issue 11: Community Mode Not URL-Persisted

**Severity**: MEDIUM
**Category**: State Synchronization
**File**: `src/app/community/page-client.tsx`

**Current**: `activeMode` is local state (`useState<"hungry" | "full" | null>(null)`)

**Impact**: Can't share link to "I'm hungry" filtered view.

---

### Issue 12: Post Feed Scroll Position Not Restored

**Severity**: LOW
**Category**: Browser History

**Problem**: Navigating away from community and back resets scroll position.

---

## State Synchronization Analysis

### Current Filter State Flow

```
                    ┌─────────────────┐
                    │   localStorage  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
    ┌─────────────────┐ ┌─────────────┐ ┌─────────────┐
    │ Map Provider    │ │ Community   │ │ Calendar    │
    │ (Instance A)    │ │ Provider    │ │ (Server)    │
    │                 │ │ (Instance B)│ │             │
    │ eventTypeFilter │ │ eventType   │ │ ?type=...   │
    │ dateRangeFilter │ │ dateRange   │ │ ?month=...  │
    └─────────────────┘ └─────────────┘ └─────────────┘
           │                   │              │
           │                   │              │
    Not synced!          Not synced!    Different system!
```

### Recommended Filter State Flow

```
                    ┌─────────────────┐
                    │  URL Parameters │  ← Single Source of Truth
                    └────────┬────────┘
                             │
                    useSearchParams()
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
    ┌─────────────────┐ ┌─────────────┐ ┌─────────────┐
    │ Map Page        │ │ Community   │ │ Calendar    │
    │                 │ │ Page        │ │ Page        │
    │ ?eventType=     │ │ ?eventType= │ │ ?type=      │
    │ ?dateRange=     │ │ ?dateRange= │ │ ?month=     │
    └─────────────────┘ └─────────────┘ └─────────────┘
           │                   │              │
           └───────────────────┼──────────────┘
                               │
                    Synchronized via URL!
```

---

## Critical Flow Validation Results

### Flow 1: Community Event → Map with Event Selected

**Path**: Click map pin icon on event card in `/community`

**Expected**:
1. Navigate to `/map?event=abc123`
2. Map centers on event location
3. Event marker is highlighted
4. Event popup opens automatically

**Current Status**: **COMPLETELY BROKEN**
- ✅ Link correctly constructs `/map?event=abc123`
- ❌ MapPageClient doesn't read any URL params
- ❌ Event not selected
- ❌ Map doesn't center
- ❌ No popup opens

---

### Flow 2: Saved Location → Map with Food Bank Selected

**Path**: Click "View on map" in profile's saved locations

**Expected**:
1. Navigate to `/map?highlight=abc123`
2. Map centers on food bank
3. Food bank marker selected
4. LocationPopup opens

**Current Status**: **COMPLETELY BROKEN**
- ✅ Link correctly constructs `/map?highlight=abc123`
- ❌ MapPageClient doesn't read `highlight` param
- ❌ Nothing happens

---

### Flow 3: Chat Prefill from Community

**Path**: Click "Summarize posts" link in sidebar

**Expected**:
1. Navigate to `/chat?prefill=...`
2. Chat input pre-populated with text
3. User can immediately send

**Current Status**: **BROKEN**
- ✅ Link correctly constructs `/chat?prefill=...`
- ❌ Chat page doesn't read `prefill` param
- ❌ Input remains empty

---

### Flow 4: Calendar Month Navigation

**Path**: Click prev/next month arrows in calendar

**Expected**:
1. Navigate to `/community/events/calendar?month=2025-02&type=potluck`
2. Calendar shows correct month
3. Filters preserved

**Current Status**: **WORKING** ✅
- ✅ Links construct correct URLs
- ✅ Server component reads searchParams
- ✅ Month and type filters apply correctly

---

## Quick Wins (High Impact, Low Effort)

### 1. Add useSearchParams to MapPageClient
**File**: `src/app/map/pageClient.tsx`
**Effort**: 30 minutes
**Impact**: Fixes ALL map deep links

```tsx
import { useSearchParams } from "next/navigation";

function MapPageView({ foodBanks, services }: MapPageClientProps) {
  const searchParams = useSearchParams();

  // Initialize selected state from URL
  useEffect(() => {
    const foodBankId = searchParams.get('foodBankId') || searchParams.get('highlight');
    const eventId = searchParams.get('eventId') || searchParams.get('event');

    if (foodBankId) setSelectedId(foodBankId);
    else if (eventId) setSelectedEventId(eventId);
  }, [searchParams]);

  // ... rest unchanged
}
```

### 2. Standardize Link Parameter Names
**Files**: All components with map links
**Effort**: 15 minutes
**Impact**: Consistent API

Change all to use canonical names:
- `event` → `eventId`
- `highlight` → `foodBankId`

### 3. Add prefill Support to Chat
**File**: `src/app/chat/page.tsx`
**Effort**: 15 minutes
**Impact**: Fixes chat deep links

---

## Implementation Roadmap

### Phase 1: Critical Fixes (Week 1)
1. **Add URL parameter reading to MapPageClient** - 2 hours
2. **Standardize parameter names across all links** - 1 hour
3. **Add prefill support to chat** - 30 minutes

### Phase 2: URL-Driven Filters (Week 2)
1. **Refactor DiscoveryFiltersProvider to use URL** - 4 hours
2. **Add eventType/dateRange params to map and community** - 2 hours
3. **Unify filter param names across all routes** - 1 hour

### Phase 3: Polish (Week 3)
1. **Add loading states for deep link resolution** - 2 hours
2. **Add 404 handling for invalid entity IDs** - 2 hours
3. **Persist community mode to URL** - 1 hour
4. **Improve browser history behavior** - 2 hours

---

## Testing Checklist

### Manual Testing Scenarios

**Deep Link Entry Points**:
- [ ] `/map?foodBankId=abc` → Food bank selected, popup open
- [ ] `/map?eventId=abc` → Event selected, popup open
- [ ] `/map?eventType=potluck` → Only potluck events shown
- [ ] `/community?mode=hungry` → Hungry mode active (after implementation)
- [ ] `/chat?prefill=Hello` → Chat input pre-populated
- [ ] `/chat-v2?intent=hungry` → Auto-sends hungry prompt

**Cross-Route Navigation**:
- [ ] Community event card → Map pin icon → Event visible on map
- [ ] Profile saved location → View on map → Food bank selected
- [ ] Calendar event → Event detail → Back → Same month/filters
- [ ] Map filters changed → Community → Same filters

**Browser Controls**:
- [ ] Filter change → Back button → Previous filter state
- [ ] Deep link → Back button → Previous page
- [ ] Refresh page with filters → Filters persist

---

## Confidence Assessment

**Overall Confidence**: HIGH

**Methodology**: Static code analysis of all navigation-related components.

**Verified via**:
- Grep for `useSearchParams` usage (found in only 1 file: chat-v2)
- Read of MapPageClient confirming zero URL param handling
- Link pattern search confirming deep links being created
- DiscoveryFiltersProvider inspection confirming localStorage usage

**Limitations**:
- Cannot verify runtime behavior without running app
- Cannot test actual map centering/popup behavior
- Cannot verify all edge cases

**Recommendation**: Implement Quick Wins first, then test in development environment before proceeding with larger refactors.

---

## Appendix: File Reference

### Files Requiring Changes

| File | Changes Needed | Priority |
|------|---------------|----------|
| `src/app/map/pageClient.tsx` | Add useSearchParams, handle all deep link params | CRITICAL |
| `src/app/community/discovery-context.tsx` | Refactor to use URL instead of localStorage | CRITICAL |
| `src/app/community/components/events-section/index.tsx` | Change `event` to `eventId` | HIGH |
| `src/components/profile/SavedLocationsList.tsx` | Change `highlight` to `foodBankId` | HIGH |
| `src/app/chat/page.tsx` | Add prefill param support | HIGH |
| `src/app/chat-v2/page-client.tsx` | Implement intent auto-send | HIGH |
| `src/app/community/page-client.tsx` | Add mode to URL params | MEDIUM |

### Files Working Correctly

| File | Status |
|------|--------|
| `src/app/community/events/calendar/page.tsx` | ✅ Properly uses searchParams |

---

## Summary

The navigation architecture requires immediate attention. The most critical issue is that **MapPageClient has zero URL parameter support**, making all cross-area navigation to the map completely non-functional. This should be fixed before any other work on the feature.

The recommended approach is:
1. **Week 1**: Add `useSearchParams` to MapPageClient and standardize link parameters
2. **Week 2**: Migrate DiscoveryFiltersProvider from localStorage to URL
3. **Week 3**: Polish and edge case handling

After these changes, the application will have true URL-driven navigation where:
- Any state can be shared via link
- Browser back/forward works correctly
- Filters sync across all discovery surfaces
- Deep links work from external sources
