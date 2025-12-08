# TheFeed Complete Wireframes: Option 1 (Bifurcated Entry)
## Revised with Implementation Notes

**Date:** December 7, 2025  
**Version:** 2.0 (Incorporates feedback)

---

## Table of Contents
1. [Landing & Entry Point](#landing--entry-point)
2. [Crisis Path (No Auth)](#crisis-path-no-auth-required)
3. [Community Path (Auth Required)](#community-path-auth-required)
4. [Shared Components](#shared-components)
5. [Navigation Patterns](#navigation-patterns)
6. [Technical Implementation Notes](#technical-implementation-notes)

---

## Landing & Entry Point

### 1.1 Landing Page (First Load)

```
┌─────────────────────────────────────┐
│                                     │
│              🍽️                     │
│           TheFeed                   │
│                                     │
│     Connecting neighbors with       │
│    food resources and community     │
│                                     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │  🆘 I NEED FOOD NOW         │   │
│  │                             │   │
│  │  Find pantries, food banks, │   │
│  │  and free meals near you    │   │
│  │                             │   │
│  │  • No sign-in required      │   │
│  │  • See what's open now      │   │
│  │  • Get directions instantly │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │  🤝 JOIN THE COMMUNITY      │   │
│  │                             │   │
│  │  Share food, organize       │   │
│  │  potlucks, and connect      │   │
│  │  with neighbors             │   │
│  │                             │   │
│  │  • Share surplus food       │   │
│  │  • Organize potlucks        │   │
│  │  • Build local connections  │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│                                     │
│  Serving 147 communities nationwide │
│  Updated 2 minutes ago              │
│                                     │
│                                     │
│  [Learn More About TheFeed]         │
│                                     │
└─────────────────────────────────────┘
```

**Design Notes:**
- Large tap targets (minimum 2.75rem ≈ 44px at default browser settings)
- Clear visual hierarchy (crisis path slightly larger/elevated)
- No ambiguity about which path to choose
- Social proof at bottom builds trust
- Optional "Learn More" doesn't block action

---

## Crisis Path (No Auth Required)

### 2.1 Location Detection & Management

**IMPLEMENTATION NOTE:** Your existing auto-geolocation flow is preserved. This adds location change capability and current location display matching the Community page pattern.

```
Auto-location detected on page load
         ↓
┌─────────────────────────────────────┐
│ ← Back                     🔍 ⚙️    │
├─────────────────────────────────────┤
│                                     │
│ 📍 Fair Oaks, CA        [Change]    │
│    Your current location            │
│                                     │
│ Found 6 food resources nearby       │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 🟢 OPEN NOW (2)                     │
│                                     │
│ [Resource cards continue below...]  │
│                                     │
└─────────────────────────────────────┘
```

**Location Change Flow:**
```
User taps "[Change]" next to location
         ↓
Modal slides up from bottom:

┌─────────────────────────────────────┐
│ Change Location        [✕ Close]    │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │  📍 Use My Current Location │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│                                     │
│       ────────  OR  ────────        │
│                                     │
│                                     │
│  Enter a different address or ZIP:  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 1234 Main St, Sacramento... │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Update Location]                  │
│                                     │
│                                     │
│  🔒 Privacy: We only use your       │
│     location to show nearby food    │
│     resources. Nothing is stored.   │
│                                     │
└─────────────────────────────────────┘
```

**Map View with Location Management:**
```
User navigates to Map view
         ↓
┌─────────────────────────────────────┐
│ ← List View                  🔍 ⚙️  │
├─────────────────────────────────────┤
│ 📍 Fair Oaks, CA        [Change]    │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│         🗺️ MAP VIEW                 │
│                                     │
│    ┌───┐   📍 You (blue dot)       │
│    │ • │   🟢 Open now              │
│    └───┘   🟡 Opens soon            │
│            🔴 Closed                │
│                                     │
│    [Interactive Mapbox map fills    │
│     this space with pins color-     │
│     coded by status. User's current │
│     location shown as blue dot]     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ 🟢 2 Open Now                       │
│ 🟡 1 Opens Soon                     │
│ 🔴 3 Closed Today                   │
│                                     │
│ [📍 Recenter on Me]                 │
│                                     │
└─────────────────────────────────────┘
```

**Technical Notes:**
- Location display matches Community page pattern (top of view, "📍 Fair Oaks, CA [Change]")
- Blue dot on map shows user's current location (like standard map UX)
- "Recenter on Me" button re-centers map on user's location
- Location change modal updates both list and map views
- Deep linking preserves selected resource when changing location
- Uses existing geolocation utilities from your codebase

---

### 2.2 Resources List (Primary View)

```
After location confirmed
         ↓
┌─────────────────────────────────────┐
│ ← Change Location   🔍 Filter    ⚙️ │
├─────────────────────────────────────┤
│                                     │
│ 📍 Fair Oaks, CA        [Change]    │
│ Found 6 food resources nearby       │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 🟢 OPEN NOW (2)                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🏪 Northeast Food Pantry        │ │
│ │ ✅ Verified today               │ │
│ │                                 │ │
│ │ 📍 0.4 miles · Closes 5:00 PM   │ │
│ │ ⏱️ Closes in 3 hours            │ │
│ │                                 │ │
│ │ ✓ Walk-ins welcome              │ │
│ │ ✓ No ID required                │ │
│ │ ✓ Fresh produce available       │ │
│ │                                 │ │
│ │ ┌─────────────┐ ┌─────────────┐ │ │
│ │ │📍 Directions│ │📞 Call      │ │ │
│ │ └─────────────┘ └─────────────┘ │ │
│ │                                 │ │
│ │ [ℹ️ More Details]               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🍲 Loaves & Fishes Dining Hall │ │
│ │ ⚠️ Call ahead recommended       │ │
│ │                                 │ │
│ │ 📍 0.8 miles · Lunch 11:30-1:00 │ │
│ │ ⏱️ Opens in 45 minutes          │ │
│ │                                 │ │
│ │ ℹ️ Hot meals, serves ~300 daily │ │
│ │ ✓ Wheelchair accessible         │ │
│ │                                 │ │
│ │ ┌─────────────┐ ┌─────────────┐ │ │
│ │ │📍 Directions│ │📞 Call      │ │ │
│ │ └─────────────┘ └─────────────┘ │ │
│ │                                 │ │
│ │ [ℹ️ More Details]               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 🟡 OPENS SOON (1)    [Show ▼]      │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 🔴 CLOSED TODAY (3)  [Show ▼]      │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 🗺️ [View All on Map]               │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 🤝 Want to help others in your      │
│    community?                       │
│    [Join the Community →]           │
│                                     │
└─────────────────────────────────────┘
     ↓
┌─────────────────────────────────────┐
│ Bottom Navigation                   │
├──────────┬──────────┬──────────┬────┤
│ 📍       │ 🗺️      │ ➕       │ ℹ️ │
│ Nearby   │ Map      │ Create   │Help│
└──────────┴──────────┴──────────┴────┘
```

**Key Features:**
- **Status-first organization**: Green (open now) at top
- **Time-sensitive info**: "Closes in X hours" creates urgency
- **Requirements clear**: "No ID required" removes barriers
- **One-tap actions**: Directions button launches maps app
- **Collapsible sections**: "Opens soon" / "Closed" sections collapsed by default
- **Progressive disclosure**: "More Details" reveals full info
- **Community upsell**: Gentle invitation at bottom
- **Note**: AI chat removed from this view per feedback

**Color Coding:**
- 🟢 Green = Open now
- 🟡 Yellow = Opens within 2 hours
- 🔴 Red = Closed today
- ⚠️ Warning icon = Special conditions

**Design Units:**
- All spacing uses rem/em units
- Minimum tap target: 2.75rem (ensures ≥44px at default settings)
- Font sizes: clamp() for fluid typography
- Card padding: 1rem minimum, scales with viewport

---

### 2.3 Filter Modal

```
User taps "Filter" icon
         ↓
┌─────────────────────────────────────┐
│ Filters               [✕ Close]     │
├─────────────────────────────────────┤
│                                     │
│ 📊 Status                           │
│ ☑️ Open now                         │
│ ☐ Opens today                       │
│ ☐ Closed today                      │
│ ☐ Show all                          │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 📏 Distance                         │
│ ○ Walking (< 1 mile)                │
│ ● Transit (< 3 miles)               │
│ ○ Driving (< 10 miles)              │
│ ○ Show all                          │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 🏷️ Services                         │
│ ☐ Fresh produce                     │
│ ☐ Hot meals                         │
│ ☐ Emergency groceries               │
│ ☐ CalFresh assistance               │
│ ☐ Senior services                   │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ ♿ Accessibility                     │
│ ☐ Wheelchair accessible             │
│ ☐ Public transit accessible         │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 📋 Requirements                     │
│ ☐ No ID required                    │
│ ☐ Walk-ins welcome                  │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ [Clear All]      [Apply Filters]    │
│                                     │
└─────────────────────────────────────┘
```

**Interaction Notes:**
- Filters applied immediately on "Apply"
- "Clear All" resets to default (Open now + Transit distance)
- Selected count badge on filter icon in header
- Filters stored in URL params for shareable links

---

### 2.4 Resource Detail Page

```
User taps "More Details" on a resource
         ↓
┌─────────────────────────────────────┐
│ ← Back to Results                   │
├─────────────────────────────────────┤
│                                     │
│ 🏪 Northeast Food Pantry            │
│ ✅ Verified today by community      │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 🟢 OPEN NOW                         │
│ Closes at 5:00 PM (in 3 hours)      │
│                                     │
│ ┌─────────────┐ ┌─────────────┐    │
│ │📍 Get       │ │📞 Call      │    │
│ │  Directions │ │  (916)      │    │
│ │             │ │  555-0100   │    │
│ └─────────────┘ └─────────────┘    │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 📍 Location                         │
│ 1300 National Dr                    │
│ Sacramento, CA 95834                │
│ 0.4 miles away (8 min walk)         │
│                                     │
│ [View on Map]                       │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ ⏰ Hours                             │
│ Monday:    Closed                   │
│ Tuesday:   Closed                   │
│ Wednesday: 2:00 PM - 5:00 PM        │
│ Thursday:  2:00 PM - 5:00 PM        │
│ Friday:    2:00 PM - 5:00 PM        │
│ Saturday:  10:00 AM - 2:00 PM       │
│ Sunday:    Closed                   │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ ℹ️ What They Offer                  │
│ • Fresh produce (seasonal)          │
│ • Canned goods & dry goods          │
│ • Dairy products                    │
│ • Personal care items               │
│ • Baby supplies                     │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 📋 What to Know                     │
│ ✓ Walk-ins welcome                  │
│ ✓ No ID required                    │
│ ✓ Bring reusable bags (optional)    │
│ ✓ Limit: Once per household/week    │
│ ✓ Serves Sacramento County residents│
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ ♿ Accessibility                     │
│ ✓ Wheelchair accessible entrance    │
│ ✓ Accessible parking available      │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 🌐 Website                          │
│ [Visit sacramentofoodbank.org]      │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ ✨ Community Updates                │
│                                     │
│ 👍 "Still open, very helpful"       │
│    - Verified 2 hours ago           │
│                                     │
│ 👍 "Line was short today"           │
│    - Verified 5 hours ago           │
│                                     │
│ [👍 Confirm Still Open]             │
│ [⚠️ Report Issue]                   │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 📊 Data Source                      │
│ Feeding America Network             │
│ Last updated: Today at 9:00 AM      │
│                                     │
│ [Suggest an Update]                 │
│                                     │
└─────────────────────────────────────┘
```

**Key Features:**
- **Status at top**: Most critical info first
- **Action buttons elevated**: Directions/call immediately visible
- **Progressive disclosure**: Full details below fold
- **Community intelligence**: Recent verifications build trust
- **Anonymous contribution**: Can confirm/report without login
- **Data transparency**: Source and freshness clearly stated
- **Suggest updates**: Improves data quality over time

---

### 2.5 Anonymous Contribution Flow

```
User taps "Confirm Still Open"
         ↓
┌─────────────────────────────────────┐
│ Thanks for helping! 🙏              │
├─────────────────────────────────────┤
│                                     │
│ Northeast Food Pantry               │
│                                     │
│ What's the current status?          │
│                                     │
│ ○ Yes, currently open and serving   │
│ ○ Open but long wait (30+ min)     │
│ ○ No, closed or unavailable         │
│ ○ Different hours than listed       │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ Additional details (optional):      │
│ ┌─────────────────────────────────┐ │
│ │ e.g., "Line is long" or         │ │
│ │ "Out of produce today"          │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 🔒 Your contribution is anonymous   │
│    and helps others in real-time    │
│                                     │
│ [Submit]              [Cancel]      │
│                                     │
└─────────────────────────────────────┘
```

**Anti-Spam Protection:**
- Rate limiting by device fingerprint (not stored, just hashed)
- AI review flags suspicious patterns
- Community moderators review reports
- Confirmation required for negative reports

**Success State:**
```
After submission
         ↓
┌─────────────────────────────────────┐
│ ✅ Thank you!                       │
│                                     │
│ Your update has been recorded and   │
│ will help others find food today.   │
│                                     │
│ [Back to Resource]                  │
└─────────────────────────────────────┘
```

---

### 2.6 Map View (Crisis Path)

```
User taps "View All on Map" or "Map" in bottom nav
         ↓
┌─────────────────────────────────────┐
│ ← List View                  🔍 ⚙️  │
├─────────────────────────────────────┤
│ 📍 Fair Oaks, CA        [Change]    │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│         🗺️ MAP VIEW                 │
│                                     │
│    ┌───┐   📍 You                  │
│    │ • │   🟢 Open now              │
│    └───┘   🟡 Opens soon            │
│            🔴 Closed                │
│                                     │
│    [Interactive Mapbox map fills    │
│     this entire space with pins     │
│     color-coded by status]          │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ 🟢 2 Open Now                       │
│ 🟡 1 Opens Soon                     │
│ 🔴 3 Closed Today                   │
│                                     │
│ [📍 Recenter on Me]                 │
│                                     │
└─────────────────────────────────────┘
```

**Map Marker Tap → Quick Info Card:**
```
User taps a green marker
         ↓
Card slides up from bottom:

┌─────────────────────────────────────┐
│ 🏪 Northeast Food Pantry            │
│ 🟢 OPEN · 0.4 mi · Closes 5 PM      │
│                                     │
│ ✓ Walk-ins welcome · No ID needed   │
│                                     │
│ ┌─────────────┐ ┌─────────────┐    │
│ │📍 Directions│ │ℹ️ Details   │    │
│ └─────────────┘ └─────────────┘    │
└─────────────────────────────────────┘
```

**Interaction Notes:**
- Tap "Details" → Full resource detail page
- Tap "Directions" → Launches maps app
- Tap outside card → Dismisses card
- Map stays at same zoom/position
- Filters from list view apply here too
- Deep linking works: `/map?resourceId=123` highlights that resource

**Technical Notes:**
- Uses existing map infrastructure
- Location display matches list view
- "Recenter on Me" button uses existing geolocation
- Blue dot shows current user location

---

### 2.7 Help Page (Crisis Path)

```
User taps "Help" in bottom nav
         ↓
┌─────────────────────────────────────┐
│ ← Back                              │
├─────────────────────────────────────┤
│ ℹ️ Help & Information               │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 📖 How TheFeed Works                │
│                                     │
│ TheFeed helps you find free food    │
│ resources in your community:        │
│                                     │
│ • Food banks & pantries             │
│ • Community meal programs           │
│ • Emergency food assistance         │
│                                     │
│ All resources shown are verified    │
│ by our community and updated        │
│ regularly.                          │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ ❓ Common Questions                 │
│                                     │
│ [Do I need to sign up?] ▼           │
│ [Is this really free?] ▼            │
│ [What should I bring?] ▼            │
│ [How often can I visit?] ▼          │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 🔒 Privacy & Safety                 │
│                                     │
│ • We don't store your location      │
│ • No account required               │
│ • Your searches are anonymous       │
│ • All data is encrypted             │
│                                     │
│ [Read full privacy policy]          │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 📞 Additional Resources             │
│                                     │
│ 🆘 211 - United Way Helpline        │
│    Call 2-1-1 for immediate help    │
│                                     │
│ 📱 SNAP/CalFresh Hotline            │
│    Call 1-877-847-3663              │
│                                     │
│ 🏥 Emergency Services               │
│    Call 911 for emergencies         │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 💬 Contact Us                       │
│                                     │
│ Found incorrect information?        │
│ [Report an Issue]                   │
│                                     │
│ Questions about TheFeed?            │
│ [Send Feedback]                     │
│                                     │
└─────────────────────────────────────┘
```

---

## Community Path (Auth Required)

### 3.1 Sign In Gate

```
User taps "JOIN THE COMMUNITY"
         ↓
┌─────────────────────────────────────┐
│ ← Back                              │
├─────────────────────────────────────┤
│                                     │
│         🍽️ TheFeed                  │
│    NEIGHBORHOOD COMMUNITY           │
│                                     │
│                                     │
│  Share food, organize potlucks,     │
│  and connect with neighbors         │
│                                     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │  Continue with Google       │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│                                     │
│  By signing in, you agree to our    │
│  Terms of Service and Privacy Policy│
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│  Looking for food resources?        │
│  [Find Food Without Signing In]     │
│                                     │
└─────────────────────────────────────┘
```

**Key Features:**
- Only Google OAuth (existing implementation)
- Clear escape hatch to crisis path
- Terms/privacy linked
- Simple, trustworthy

---

### 3.2 Community Onboarding (First Time)

```
After successful Google sign-in (first time only)
         ↓
┌─────────────────────────────────────┐
│                                     │
│    👋 Welcome to TheFeed, Jordan!   │
│                                     │
│  Let's personalize your experience  │
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│  What brings you here?              │
│  (You can select multiple)          │
│                                     │
│  ☐ I have extra food to share       │
│  ☐ I'm looking for food             │
│  ☐ I want to organize potlucks      │
│  ☐ I want to volunteer              │
│  ☐ I'm just exploring               │
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│  Where are you located?             │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📍 Fair Oaks, CA            │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Change]                           │
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│  [Skip for Now]    [Get Started]    │
│                                     │
└─────────────────────────────────────┘
```

---

### 3.3 Community Home (Default View)

```
After onboarding complete
         ↓
┌─────────────────────────────────────┐
│ TheFeed                    👤 Jordan│
│ NEIGHBORHOOD COMMUNITY              │
├─────────────────────────────────────┤
│                                     │
│ ┌───────────────┐ ┌───────────────┐│
│ │🍽️ I'm hungry │ │🥗 I'm Full    ││
│ └───────────────┘ └───────────────┘│
│                                     │
│ 📍 Fair Oaks, CA        [Change]    │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 📊 Today in your neighborhood       │
│                                     │
│   2              2              1   │
│ Shares       Requests        Events │
│ available    waiting          today │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 🔥 Active Now                       │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🍕 Maria · 12 min ago           │ │
│ │ "Half a pizza left from lunch, │ │
│ │  anyone near McKinley Park?"    │ │
│ │                                 │ │
│ │ 📍 0.8 mi away · Expires 3 PM   │ │
│ │                                 │ │
│ │ [I'm Interested]                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🥕 David · 1 hour ago           │ │
│ │ "Need vegetables for family     │ │
│ │  dinner tonight. Can trade eggs"│ │
│ │                                 │ │
│ │ 📍 1.2 mi away                  │ │
│ │                                 │ │
│ │ [Offer to Help] [Comment (2)]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 📅 This Week's Events               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎉 Southside Park Potluck       │ │
│ │ Wednesday, Dec 10 · 6:00 PM     │ │
│ │                                 │ │
│ │ 3 attending · Open capacity     │ │
│ │ Hosted by Jordan Hindo          │ │
│ │                                 │ │
│ │ [RSVP]                          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [View All Events →]                 │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 🍽️ Need food resources?            │
│    [Find Food Banks & Pantries]     │
│                                     │
└─────────────────────────────────────┘
     ↓
┌─────────────────────────────────────┐
│ Bottom Navigation                   │
├──────────┬──────────┬──────────┬────┤
│ 🏠       │ 🗺️      │ ➕       │ 📅 │
│Community │ Map      │ Create   │Cal │
│          │          │          │    │
│ 👤 Profile (5th icon, far right)    │
└──────────┴──────────┴──────────┴────┘
```

**Key Features:**
- Mood toggles at top (preserves your humor/personality)
- Stats show neighborhood activity
- "Active Now" = urgent/expiring posts first
- Events prominently featured
- Crisis resource link at bottom
- Bottom nav: 5 items for authenticated users

**Note:** This IS the feed view. Removed redundant 3.6 as this covers it.

---

### 3.4 Post Creation Flow (Revised per Feedback)

**IMPLEMENTATION NOTE:** This follows your hierarchical structure: FOOD → (Need Food | Have Extra), CREATE → (Post | Event), ASK → (Sous-Chef with animated examples)

```
User taps "+" in bottom nav
         ↓
┌─────────────────────────────────────┐
│ Create                 [✕ Close]    │
├─────────────────────────────────────┤
│                                     │
│ What would you like to do?          │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 🍽️ FOOD                             │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🆘 Need Food                    │ │
│ │ Find nearby food resources      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🥗 Have Extra                   │ │
│ │ Share surplus with neighbors    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 📝 CREATE                           │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📢 Post                         │ │
│ │ Share an update                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎉 Event                        │ │
│ │ Organize a potluck              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 💬 ASK                              │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🤖 Sous-Chef                    │ │
│ │                                 │ │
│ │ Ask me:                         │ │
│ │ [Animated typing examples]      │ │
│ │ "Find potlucks near me"         │ │
│ │   → erases, types next...       │ │
│ │ "I need help planning meals"    │ │
│ │   → erases, types next...       │ │
│ │ "Show food on the map"          │ │
│ │   → loops...                    │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

**Animated Examples Component:**
- Typing animation with cursor
- Cycles through 5-7 example queries
- Types out, pauses 2s, backspaces, types next
- Reusable component for other surfaces
- Examples personalized to context

**Technical Notes:**
```typescript
// Reusable AnimatedExamples component
interface AnimatedExamplesProps {
  examples: string[];
  typingSpeed?: number; // ms per character
  pauseDuration?: number; // ms pause after complete
  loop?: boolean;
}

// Usage:
<AnimatedExamples 
  examples={[
    "Find potlucks near me",
    "I need help planning meals",
    "Show food on the map",
    "What's open right now?",
    "How can I volunteer?"
  ]}
  typingSpeed={50}
  pauseDuration={2000}
  loop={true}
/>
```

---

**"Need Food" Flow:**
```
User taps "Need Food"
         ↓
Routes to Crisis Path (map view)
         ↓
┌─────────────────────────────────────┐
│ ← Back to Community                 │
├─────────────────────────────────────┤
│ 📍 Fair Oaks, CA        [Change]    │
│                                     │
│         🗺️ FOOD RESOURCES           │
│                                     │
│ Showing pantries, food banks, and   │
│ meal programs near you              │
│                                     │
│ [Map with highlighted closest       │
│  resource - uses existing deep      │
│  link logic to highlight]           │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 🟢 Closest & Open Now:              │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🏪 Northeast Food Pantry        │ │
│ │ 0.4 mi · Open til 5 PM          │ │
│ │ [📍 Directions] [ℹ️ Details]    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [View All Resources →]              │
│                                     │
└─────────────────────────────────────┘
```

**Key Features:**
- "Need Food" routes to crisis map with closest resource highlighted
- Uses existing deep linking (`/map?resourceId=<closest>`)
- Back button returns to community
- Clean transition between paths
- **No "request food" post creation** (per feedback: not offering this yet)

---

**"Have Extra" Flow:**
```
User selects "Have Extra"
         ↓
┌─────────────────────────────────────┐
│ ← Back                  [Post]      │
├─────────────────────────────────────┤
│ 🥗 Share Food                       │
│                                     │
│ What are you sharing?               │
│ ┌─────────────────────────────────┐ │
│ │ e.g., "Half a pizza", "Fresh    │ │
│ │ tomatoes from my garden"        │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 📍 Where can people pick it up?     │
│                                     │
│ ○ My location (Fair Oaks)           │
│ ○ Specific place                    │
│                                     │
│ 🔒 Your exact address is never      │
│    shared publicly                  │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ ⏰ Available until?                 │
│                                     │
│ ○ Today                             │
│ ● Tomorrow                          │
│ ○ This week                         │
│ ○ Specific time                     │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 📸 Add photo (optional)             │
│ [Upload Image]                      │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ [Cancel]              [Post Share]  │
│                                     │
└─────────────────────────────────────┘
```

---

**"Post" Flow:**
```
User selects "Post"
         ↓
┌─────────────────────────────────────┐
│ ← Back                  [Post]      │
├─────────────────────────────────────┤
│ 📢 Create Post                      │
│                                     │
│ Share an update with your           │
│ neighborhood                        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ What's on your mind?            │ │
│ │                                 │ │
│ │                                 │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 📸 Add photo (optional)             │
│ [Upload Image]                      │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ [Cancel]              [Post Update] │
│                                     │
└─────────────────────────────────────┘
```

---

**"Event" Flow:**
```
User selects "Event"
         ↓
[Existing AI event creation flow]
[Keep current implementation]
```

---

**"Sous-Chef" Flow:**
```
User taps "Sous-Chef" card
         ↓
Routes to /chat (or /chat-v2)
[Your existing chat implementation]
[Will be worked on separately]
```

---

### 3.5 Calendar View (Revised per Feedback)

```
User taps "Calendar" in bottom nav
         ↓
┌─────────────────────────────────────┐
│ TheFeed                    👤 Jordan│
│ COMMUNITY EVENTS                    │
├─────────────────────────────────────┤
│ Calendar                            │
│                                     │
│ Browse potlucks and volunteer       │
│ shifts, then RSVP or host your own. │
│                                     │
│ ┌─────────┐ ┌──────────────────┐   │
│ │ Host an │ │ Back to Community│   │
│ │ Event   │ │                  │   │
│ └─────────┘ └──────────────────┘   │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ December 2025            < >        │
│                                     │
│ Filters:                            │
│ [All] [Potlucks] [Volunteer]        │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ SUN  MON  TUE  WED  THU  FRI  SAT  │
│                                     │
│  1    2    3   •4    5    6    7   │
│                                     │
│  8    9   •10  11   12   13   14   │
│                                     │
│ 15   16   17   18   19   20   21   │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ Upcoming Events:                    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Wed, Dec 10 · 6:00 PM           │ │
│ │ 🎉 Southside Park Potluck       │ │
│ │ 3 attending · Open              │ │
│ │ [RSVP]                          │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

**Day Click Behavior (Revised):**
```
User taps day with • indicator (Dec 4)
         ↓
Modal/panel slides up from bottom:

┌─────────────────────────────────────┐
│ Events on December 4, 2025          │
│                          [✕ Close]  │
├─────────────────────────────────────┤
│                                     │
│ 2 events in Fair Oaks area          │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎉 Southside Park Potluck       │ │
│ │ 6:00 PM · Southside Park        │ │
│ │                                 │ │
│ │ 3 attending · Open capacity     │ │
│ │ Hosted by Jordan Hindo          │ │
│ │                                 │ │
│ │ [RSVP]        [View Details]    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🤝 Food Bank Volunteer Shift    │ │
│ │ 2:00 PM · Sacramento Food Bank  │ │
│ │                                 │ │
│ │ 5 attending · 2 spots left      │ │
│ │ Hosted by Sarah Chen            │ │
│ │                                 │ │
│ │ [RSVP]        [View Details]    │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

**Key Features:**
- **Dot indicator (•) on days with events**
- **Click day → Shows all events for that day in the area**
- **No event icons cluttering calendar**
- **Clean, scannable month view**
- **Event details shown in modal/panel**

**Technical Notes:**
- "In the area" = user's neighborhood (from profile)
- Modal can scroll if many events
- Dismiss by tapping outside or [✕]
- Each event card has RSVP + View Details

---

### 3.6 Map View (Community)

**REMOVED PER FEEDBACK:** "We don't want to complicate that page so remove the community map view."

**Existing map page remains as-is for crisis resources.**

**Community posts/events on map are handled via existing deep linking:**
- Community event cards link to `/map?eventId=123`
- Map highlights that event marker
- Uses existing infrastructure
- No separate "community map view" needed

---

### 3.7 Profile Page

```
User taps profile icon in bottom nav
         ↓
┌─────────────────────────────────────┐
│ ← Back                         ⚙️   │
├─────────────────────────────────────┤
│                                     │
│         👤 Jordan Hindo             │
│         @jordan · Fair Oaks         │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 🌿 Community Guide                  │
│ Karma: 47 points                    │
│                                     │
│ Member since November 2024          │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 📊 Activity                         │
│                                     │
│  12          5           2          │
│ Shares    Requests    Events        │
│ given     helped     hosted         │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 📍 My Saved Locations               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ⭐ Sacramento Food Bank         │ │
│ │ 1300 National Dr                │ │
│ │ [View on Map]                   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Add Location]                      │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ My Posts & Events                   │
│ [View All Activity →]               │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ [Sign Out]                          │
│                                     │
└─────────────────────────────────────┘
```

---

## Shared Components

### 4.1 Location Permission Modal

```
First time app requests location
         ↓
┌─────────────────────────────────────┐
│ Location Access                     │
├─────────────────────────────────────┤
│                                     │
│ TheFeed needs your location to show │
│ food resources near you.            │
│                                     │
│ 📍 Your location is only used to:   │
│ • Show nearby resources             │
│ • Calculate distances               │
│ • Improve search results            │
│                                     │
│ 🔒 We never:                        │
│ • Store your exact location         │
│ • Share it with third parties       │
│ • Track your movements              │
│                                     │
│ [Allow Location]                    │
│ [Enter Address Instead]             │
│                                     │
└─────────────────────────────────────┘
```

---

### 4.2 Settings/Filter Panel

```
User taps ⚙️ icon
         ↓
┌─────────────────────────────────────┐
│ Settings                [✕ Close]   │
├─────────────────────────────────────┤
│                                     │
│ 🌍 Location                         │
│ Fair Oaks, CA                       │
│ [Change Location]                   │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 🔔 Notifications                    │
│ ☑️ New shares near me               │
│ ☑️ Event reminders                  │
│ ☐ Weekly digest                     │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ 🔒 Privacy                          │
│ [Privacy Settings]                  │
│ [Data & Security]                   │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ ℹ️ About                            │
│ [How TheFeed Works]                 │
│ [Privacy Policy]                    │
│ [Terms of Service]                  │
│ [Contact Support]                   │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│ App Version 1.0.0                   │
│                                     │
└─────────────────────────────────────┘
```

---

## Navigation Patterns

### 5.1 Crisis Path Navigation (No Auth)

**Bottom Navigation (4 items):**
```
┌──────────┬──────────┬──────────┬─────────┐
│ 📍       │ 🗺️      │ ➕       │ ℹ️      │
│ Nearby   │ Map      │ Create   │ Help    │
│ (Active) │          │          │         │
└──────────┴──────────┴──────────┴─────────┘
```

**Navigation Logic:**
- **Nearby**: List view of resources (default)
- **Map**: Map view of same resources
- **Create**: Opens creation modal (routes to crisis or community paths)
- **Help**: FAQ, contact, additional resources

**Design Units:**
- Bottom nav height: 4rem (ensures ≥64px at default settings)
- Icons: 1.5rem (≥24px) with 0.25rem labels
- Tap targets: Full width of each section (≥2.75rem tall)

---

### 5.2 Community Path Navigation (Auth Required)

**Bottom Navigation (5 items):**
```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ 🏠       │ 🗺️      │ ➕       │ 📅       │ 👤       │
│Community │ Map      │ Create   │ Calendar │ Profile  │
│ (Active) │          │          │          │          │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

**Navigation Logic:**
- **Community**: Feed view (default)
- **Map**: Existing map (food banks + deep linked events/posts)
- **Create** (center): Create modal (hierarchical options)
- **Calendar**: Event calendar
- **Profile**: User profile + settings

---

### 5.3 Cross-Path Navigation

**From Crisis → Community:**
```
Multiple entry points:
1. "Want to help others?" CTA at bottom of resource list
2. "Join the Community" button in Help page
3. "Sign In" option in settings
```

**From Community → Crisis:**
```
Multiple entry points:
1. "Need food resources?" widget on Community home
2. "Need Food" option in Create modal
3. "Find Food Banks" link in Help
```

**Seamless Switching:**
- User can be signed in but still use crisis path
- Crisis path always accessible (even if authenticated)
- Community features only visible when authenticated

---

## Technical Implementation Notes

### 6.1 Route Structure (Optional / Recommendation)

**IMPORTANT NOTE:** This route structure is **optional and represents one recommended approach**. Your existing routes can be preserved if they work well. The key is **functional separation**, not specific URLs.

**If you prefer to keep your existing routes**, focus on:
- Conditional rendering based on auth state
- Feature flags/guards on community features
- The UX patterns (not the exact URLs)

**Recommended Structure (if refactoring):**

```
/                           # Landing page (bifurcated entry)

# Crisis Path (no auth required)
/resources                  # Resource list view (or keep existing /map)
/resources/[id]             # Resource detail page
/map                        # Existing map (keep as-is)

# Community Path (auth required)
/community                  # Community home/feed
/community/events/[id]      # Event detail (existing)
/community/posts/[id]       # Post detail (existing)
/community/calendar         # Calendar view (existing)
/community/profile          # User profile

# Shared
/chat                       # AI chat (both paths can access)
/api/*                      # Existing API routes
```

**Alternative: Keep Your Existing Routes**
```
/                           # Landing → bifurcation logic
/map                        # Existing map (works for both paths)
/community                  # Existing (add auth guard)
/community/events/*         # Existing
/chat                       # Existing
```

**Why the Recommended Structure Works:**
- **Clearer separation** between crisis and community features
- **Easier to enforce auth** on `/community/*` routes
- **Better analytics** (can track crisis vs community usage)
- **SEO benefits** (separate URL structure for different user intents)

**Why Your Existing Structure Might Be Better:**
- **Less refactoring** needed
- **Existing deep links preserved**
- **Users already familiar with URLs**
- **Simpler mental model** (one map, one community)

**Recommendation:** Start with landing page bifurcation using your existing routes. Only refactor URLs if auth enforcement or analytics become problematic.

---

### 6.2 Auth Middleware Strategy

```typescript
// Simplified approach using your existing Better Auth setup

// Public paths (no auth required)
const publicPaths = [
  '/',
  '/map',           // Existing map (crisis + deep links)
  '/chat',          // Optional AI assistance
  '/api/food-banks',
  '/api/locations',
  // ... other public APIs
];

// Protected paths (auth required)
const protectedCommunityPaths = [
  '/community',
  '/community/events',
  '/community/posts',
  '/community/calendar',
  '/community/profile',
  '/api/posts',
  '/api/events',
  // ... other community APIs
];

// Middleware checks path and redirects if needed
// If user not authenticated + trying to access community → redirect to sign-in
// If user authenticated → can access everything (crisis + community)
```

---

### 6.3 Data Layer Considerations

**Crisis Path:**
- Uses existing `food-bank-queries.ts`
- No user context required
- Anonymous location tracking (not stored)
- Anonymous community confirmations (device fingerprint only)

**Community Path:**
- Uses existing `post-queries.ts`, `event-queries.ts`
- Requires `userId` from Better Auth
- User profiles, karma, follows, etc.

**Shared Data:**
- Map markers can show both food banks AND community posts/events
- Filter/layer toggles control what's visible (existing implementation)
- Same geolocation utilities used by both paths
- Deep linking works across both paths

---

### 6.4 Design System (Responsive Units)

**CRITICAL: All units must be relative, never fixed pixels.**

```css
/* ✅ CORRECT - Relative units */
.button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  min-height: 2.75rem; /* ≥44px tap target at default settings */
}

.card {
  padding: 1rem;
  gap: 0.75rem;
  border-radius: 0.5rem;
}

/* Fluid typography */
h1 {
  font-size: clamp(1.5rem, 5vw, 2.5rem);
}

/* Spacing scale (base 0.25rem) */
--space-xs: 0.25rem;   /* 4px */
--space-sm: 0.5rem;    /* 8px */
--space-md: 1rem;      /* 16px */
--space-lg: 1.5rem;    /* 24px */
--space-xl: 2rem;      /* 32px */

/* ❌ WRONG - Fixed pixels */
.bad-button {
  padding: 12px 24px;  /* DON'T DO THIS */
  height: 44px;        /* DON'T DO THIS */
}
```

**Accessibility Minimums:**
```css
/* Minimum tap targets (WCAG 2.1 Level AAA) */
button, a, input {
  min-height: 2.75rem; /* ≥44px at default 16px base */
  min-width: 2.75rem;
}

/* Text size minimums */
body {
  font-size: clamp(1rem, 2.5vw, 1.125rem); /* Never smaller than 1rem */
}

small {
  font-size: clamp(0.875rem, 2vw, 1rem); /* ≥14px at default */
}
```

**Container Queries (Modern Responsive):**
```css
/* Use container queries for component-level responsiveness */
.card-container {
  container-type: inline-size;
}

.card {
  display: flex;
  flex-direction: column;
}

@container (min-width: 30rem) {
  .card {
    flex-direction: row;
  }
}
```

---

### 6.5 Mobile Considerations

**Touch Targets:**
- Minimum 2.75rem (≈44px at default) for all interactive elements
- Extra padding on buttons (0.75rem vertical minimum)
- No hover states (tap only)
- Focus states visible and high contrast

**Performance:**
- Lazy load images on posts
- Virtual scrolling for long lists
- Optimize map rendering (cluster markers on zoom out)
- Cache location permissions locally
- Debounce search inputs (300ms)

**Offline Support:**
- Cache last known location
- Show cached results with "offline" indicator
- Queue anonymous confirmations for later sync
- Service worker for PWA installability

**Gestures:**
- Swipe to dismiss modals
- Pull to refresh on feeds
- Pinch to zoom on maps (handled by Mapbox)
- Long press for context menus (future)

---

### 6.6 Accessibility

**Screen Readers:**
- Semantic HTML throughout (`<nav>`, `<main>`, `<article>`, etc.)
- ARIA labels on all interactive elements
- ARIA live regions for status announcements
- Skip navigation links
- Landmark regions properly labeled

**Keyboard Navigation:**
- Tab order follows visual flow
- Focus indicators visible (2px outline, high contrast)
- Escape dismisses modals
- Enter submits forms
- Arrow keys navigate lists (future enhancement)

**Color Contrast:**
- WCAG AA minimum (4.5:1) for normal text
- WCAG AAA preferred (7:1) for important text
- Status colors have text labels too ("Open Now", not just green)
- Don't rely on color alone (use icons + text)
- Dark mode support (respects prefers-color-scheme)

**Focus Management:**
- Focus trap in modals
- Return focus to trigger element on modal close
- First focusable element auto-focused in modals
- Focus visible for keyboard users, hidden for mouse

---

### 6.7 Analytics & Tracking

**Crisis Path (Anonymous):**
- Page views (no user ID)
- Resource interactions (clicks on directions, call buttons)
- Filter usage patterns
- Time to action (how quickly they find help)
- Search queries (anonymized, hashed)
- Anonymous contribution submissions

**Community Path (Authenticated):**
- User engagement (posts created, events attended)
- Karma accumulation over time
- Follow graph growth
- Post interactions (helpful marks, comments)
- Event RSVP conversion rate
- Feature adoption (AI chat usage, map layers)

**Privacy-First:**
- No PII in anonymous tracking
- Opt-out mechanism in settings
- GDPR/CCPA compliant
- Clear privacy policy linked prominently
- Cookie consent banner (if EU traffic)

**Key Metrics:**
```typescript
// Crisis path success
const crisisMetrics = {
  timeToFirstAction: 'seconds', // Target: <120s
  directionsClicks: 'count',
  callClicks: 'count',
  anonymousConfirmations: 'count',
  returnVisits: 'percentage', // 7-day, 30-day
};

// Community path success
const communityMetrics = {
  postsCreated: 'count',
  eventsCreated: 'count',
  rsvpConversions: 'percentage',
  karmaDistribution: 'histogram',
  activeUsers: 'count', // DAU, WAU, MAU
};

// Cross-path conversion
const conversionMetrics = {
  crisisToCommunitySignups: 'count',
  communityToCrisisUsage: 'count',
  pathSwitchingRate: 'percentage',
};
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
1. ✅ Create landing page with bifurcated entry
2. ✅ Update middleware to enforce auth only on community routes
3. ✅ Add location change modal to crisis path
4. ✅ Test auth flow and redirects
5. ✅ Implement AnimatedExamples component

### Phase 2: Crisis Path Polish (Week 2)
6. ✅ Add "📍 Fair Oaks, CA [Change]" to all crisis views
7. ✅ Wire location change modal to both list and map
8. ✅ Add "Recenter on Me" button to map
9. ✅ Test deep linking with location changes
10. ✅ Polish anonymous contribution flow

### Phase 3: Community Path Refactor (Week 3)
11. ✅ Implement hierarchical Create modal (Food/Create/Ask)
12. ✅ Wire "Need Food" to crisis path with closest resource
13. ✅ Remove "request food" post type (not offered yet)
14. ✅ Update calendar day-click to show all events in modal
15. ✅ Test full community flow

### Phase 4: Cross-Pollination (Week 4)
16. ✅ Add "Join Community" CTAs to crisis path
17. ✅ Add "Find Food Banks" links to community path
18. ✅ Test transitions between paths
19. ✅ Polish navigation transitions
20. ✅ Update bottom nav for both paths

### Phase 5: Testing & Launch (Week 5)
21. User testing with target audiences (crisis users + community members)
22. Accessibility audit (screen readers, keyboard nav, color contrast)
23. Performance optimization (lazy loading, caching, map clustering)
24. Analytics setup (PostHog or similar)
25. Soft launch to Sacramento Midtown

---

## Success Metrics

### Crisis Path
- **Primary**: # users finding resources (tap "Directions")
- **Target**: >80% of visitors tap directions within 2 minutes
- **Secondary**: Anonymous confirmations submitted
- **Target**: >5% of detail page views result in contribution

### Community Path
- **Primary**: # posts created (shares + updates)
- **Target**: >20 posts/week in first month
- **Secondary**: # events with RSVPs
- **Target**: >50% of created events get ≥1 RSVP

### Cross-Path
- **Conversion**: Crisis users → Community sign-ups
- **Target**: >10% of crisis users sign up within 30 days
- **Engagement**: Community users → Crisis resource usage
- **Target**: >30% of community users view crisis resources
- **Retention**: 7-day and 30-day return rates
- **Target**: >40% return within 7 days, >20% within 30 days

---

## Design System Tokens

```css
/* Color Palette (CSS Variables) */
:root {
  /* Status colors */
  --color-open: hsl(142, 76%, 36%);      /* Green */
  --color-soon: hsl(45, 93%, 47%);       /* Yellow */
  --color-closed: hsl(0, 72%, 51%);      /* Red */
  --color-warning: hsl(38, 92%, 50%);    /* Orange */
  --color-verified: hsl(199, 89%, 48%);  /* Blue */
  
  /* Semantic colors */
  --color-primary: hsl(142, 76%, 36%);
  --color-secondary: hsl(199, 89%, 48%);
  --color-danger: hsl(0, 72%, 51%);
  --color-success: hsl(142, 76%, 36%);
  
  /* Neutral palette */
  --color-gray-50: hsl(0, 0%, 98%);
  --color-gray-100: hsl(0, 0%, 96%);
  --color-gray-200: hsl(0, 0%, 90%);
  --color-gray-300: hsl(0, 0%, 83%);
  --color-gray-400: hsl(0, 0%, 64%);
  --color-gray-500: hsl(0, 0%, 45%);
  --color-gray-600: hsl(0, 0%, 32%);
  --color-gray-700: hsl(0, 0%, 25%);
  --color-gray-800: hsl(0, 0%, 15%);
  --color-gray-900: hsl(0, 0%, 9%);
  
  /* Spacing scale (base 0.25rem = 4px) */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  
  /* Font sizes (fluid with clamp) */
  --font-xs: clamp(0.75rem, 1.5vw, 0.875rem);
  --font-sm: clamp(0.875rem, 2vw, 1rem);
  --font-base: clamp(1rem, 2.5vw, 1.125rem);
  --font-lg: clamp(1.125rem, 3vw, 1.25rem);
  --font-xl: clamp(1.25rem, 4vw, 1.5rem);
  --font-2xl: clamp(1.5rem, 5vw, 2rem);
  --font-3xl: clamp(2rem, 6vw, 2.5rem);
  
  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  
  /* Z-index scale */
  --z-base: 0;
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --color-gray-50: hsl(0, 0%, 9%);
    --color-gray-100: hsl(0, 0%, 15%);
    --color-gray-200: hsl(0, 0%, 25%);
    --color-gray-300: hsl(0, 0%, 32%);
    --color-gray-400: hsl(0, 0%, 45%);
    --color-gray-500: hsl(0, 0%, 64%);
    --color-gray-600: hsl(0, 0%, 83%);
    --color-gray-700: hsl(0, 0%, 90%);
    --color-gray-800: hsl(0, 0%, 96%);
    --color-gray-900: hsl(0, 0%, 98%);
  }
}
```

---

## Component Library Mapping

**Existing shadcn/ui Components to Use:**
- ✅ Button
- ✅ Card
- ✅ Dialog (modals)
- ✅ Input
- ✅ Textarea
- ✅ Select
- ✅ Checkbox
- ✅ RadioGroup
- ✅ Tabs
- ✅ Calendar (for event calendar)
- ✅ Separator (dividers)
- ✅ Badge (status indicators)
- ✅ Avatar (user profiles)

**New Components to Create:**
- 🆕 AnimatedExamples (typing animation)
- 🆕 ResourceCard (crisis path)
- 🆕 PostCard (community path)
- 🆕 EventCard (community path)
- 🆕 LocationChangeModal
- 🆕 CreateModal (hierarchical options)
- 🆕 FilterPanel
- 🆕 StatusBadge (Open/Soon/Closed)
- 🆕 BottomNav
- 🆕 MapPopup (info card on marker tap)

---

## Final Notes

### What Changed from Original
1. ✅ Added location change capability to crisis path (matching Community page)
2. ✅ Removed AI chat from crisis default view (optional, not primary)
3. ✅ Removed search page (not needed per feedback)
4. ✅ Restructured post creation with hierarchical categories (Food/Create/Ask)
5. ✅ "Need Food" routes to crisis map (not request post - not offered yet)
6. ✅ Added AnimatedExamples component for Sous-Chef
7. ✅ Removed redundant Community feed section (default view covers it)
8. ✅ Removed separate community map view (uses existing map with deep links)
9. ✅ Updated calendar day-click to show all events in modal (not icons on calendar)
10. ✅ Changed all design units to rem/em (no px except for minimums)
11. ✅ Made route structure optional with explanation of trade-offs
12. ✅ Bottom nav updated: Crisis gets 4 items, Community gets 5

### What Stayed the Same
- ✅ Bifurcated entry (crisis vs community)
- ✅ No auth requirement for crisis path
- ✅ Status-first organization for resources
- ✅ Anonymous community contributions
- ✅ Mood toggles in community ("I'm hungry" / "I'm Full")
- ✅ Dignity-preserving post design (shares/requests look identical)
- ✅ Progressive disclosure patterns
- ✅ Mobile-first approach
- ✅ Accessibility standards (WCAG AA minimum)
- ✅ Privacy-first tracking

### Implementation Priority
1. **High**: Landing bifurcation, location management, create modal hierarchy
2. **Medium**: AnimatedExamples component, calendar day-click modal
3. **Low**: Advanced analytics, dark mode polish, advanced gestures

---

**End of Document**

*This wireframe spec incorporates all feedback and represents the final UX direction for TheFeed Option 1 (Bifurcated Entry).*
