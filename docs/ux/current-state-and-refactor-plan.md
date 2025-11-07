# TheFeed Experience Integration Plan

## 1. Current App Snapshot

### 1.1 Navigation & Shell
- **Global layout** (`src/app/layout.tsx`) provides a header (`SiteHeader`), footer, and fixed bottom navigation (`BottomNav`).
- **Header** currently brands the product as “FoodShare”, exposes the account dropdown (`UserProfile`), and a dropdown theme toggle (`ModeToggle`).
- **Bottom navigation** exposes four primary destinations: `/chat` (AI assistant), `/map` (resource explorer), `/community` (stories/programs showcase), and `/profile` (user dashboard). Items highlight based on the current route, with the map pill visually emphasized.
- **Theme system** lives in `ThemeProvider` with CSS tokens defined in `globals.css`. Light mode uses blue–teal gradients; dark mode leans on navy/purple. Gradient tokens power quick actions and hero surfaces across tabs.

### 1.2 AI Chat Tab (`src/app/chat/page.tsx`)
- Uses `useChat` from `@ai-sdk/react` for streaming responses.
- Two hero action buttons (“I need food support”, “I want to help”) trigger canned prompts via `BigActionButton`.
- Conversation area renders assistant/user bubbles with markdown support.
- Quick action chips allow extra prompts or deep linking to the map.
- Copy is earnest and service oriented; humor/mood language (“I’m hungry / I’m full”) is not yet present.

### 1.3 Map Tab (`src/app/map`)
- Server component fetches food banks via Drizzle ORM, deduplicates service filters, and passes data to the client entry (`pageClient.tsx`).
- Client side keeps search filters (open now, distance, service tags) and user geolocation state.
- Map UI (via `MapView`, `MapSearchBar`, `LocationPopup`) focuses on discoverability, not on the playful tone or cross-linking to other tabs.

### 1.4 Community Tab (`src/app/community/page.tsx`)
- Currently a static marketing-style page with story cards and program listings.
- No composer, feed, or engagement controls. Tone is informational and lacks the “I’m hungry/I’m full” vernacular.
- Layout does not mirror the dual light/dark mockup or surface participation hooks.

### 1.5 User Dashboard (`src/app/profile/page.tsx`)
- Acts as a profile dashboard surfacing saved locations and quick links back to map/chat/community.
- Content is largely informative with gradient hero, but copy retains formal voice.
- Tab label in bottom nav is “Profile”, though spec refers to it as the dashboard.

### 1.6 Supporting Components
- `BigActionButton` + gradient tokens deliver prominent CTAs across tabs.
- `ModeToggle` uses a dropdown; theme palette is not aligned to the new warm gray/sage mockup.
- Tone guidelines (“I’m hungry / I’m full”) aren’t reflected in reusable copy helpers yet.

## 2. Experience Goals
1. **Unify tone and mood** — playful hunger/full language flows through chat, community, map, and dashboard.
2. **Blend mockup visuals into production UI** — warm light & cozy dark palettes, rounded shells, and dual-column layout on large screens.
3. **Surface community participation** — composer, mood toggles, and inline engagement controls inside the community feed.
4. **Cross-connect tabs** — AI suggests map/community actions, feed cards reference map pins, dashboard resurfaces AI prompts.
5. **Mobile-first delivery** — sticky composer/actions on small screens, collapsible community energy panel, and safe-area aware spacing.

## 3. Refactor Plan

### Phase A — Brand & Theme Alignment
- Rename visible branding from “FoodShare” to “TheFeed” across metadata, header, and hero copy.
- Rebuild CSS design tokens in `globals.css` to match the mockup palettes:
  - Light: warm white background, sage primary, terracotta accent.
  - Dark: charcoal background, lighter card surfaces, warm white text, sage primary.
- Update gradient tokens (`--primary-start`, etc.) to reflect new hues for hungry/full moods.
- Refresh `ModeToggle` to a pill switch that matches the mockup’s in-context control (sun/moon + “Lights / Night Bites” labeling).

### Phase B — Navigation & Tone Cohesion
- Retheme `SiteHeader` with playful copy, integrate the new toggle style, and keep avatar/profile entry.
- Update `BottomNav` labels to emphasize tab jobs (e.g., “Chat”, “Map”, “Community”, “Dashboard”) while keeping the playful tone in tooltips/sr-only labels.
- Create a tiny `MoodChip` / helper component for re-usable mood labels (“I’m hungry”, “I’m full”).

### Phase C — Community Tab Overhaul
- Replace the static stories/programs layout with the mockup-inspired structure:
  - Top strip: neighborhood selector stub (“Within 2 miles”), active neighbor count, and quick jump buttons to chat/map.
  - Composer card with mood toggles, text area, and playful helper text.
  - Feed list rendering sample cards for requests, offers, guide posts, and newly added locations (matching mockup states with badges and actions).
  - Inline engagement chips (“Add a comment”, “Claim these leftovers”) showing mobile-friendly controls.
- Add a responsive community energy panel (desktop column / mobile accordion) highlighting live stats, trending tags, and quick filters linking to Map or Chat.
- Ensure components use the new palette, spacing, and humor.

### Phase D — Cross-tab Touchpoints
- Chat tab: rename hero actions to “I’m hungry” / “I’m full”, update descriptions with playful tone, and extend quick actions to include deep links to the community feed (“See what neighbors are sharing”).
- Map tab: add a warm hero strip referencing the moods, include CTA chips to jump into chat or community, and ensure location popups expose “Message the neighbors” actions.
- Dashboard tab: rename nav label to “Dashboard”, adjust hero copy to the playful tone, and highlight recent community/map activity.

### Phase E — Utilities & Copy
- Update shared strings/components (buttons, empty states, helper text) to reflect the humorous voice.
- Document final theme tokens and usage guidelines inline for future contributors.

## 4. Execution Checklist
1. 📄 Produce this current-state summary and integration plan (complete).
2. 🎨 Implement theme token & brand updates (Phase A).
3. 🧭 Refresh header/nav tone and controls (Phase B).
4. 🏘️ Rebuild community tab with interactive surfaces (Phase C).
5. 🔗 Wire cross-tab affordances in chat/map/dashboard (Phase D).
6. ✏️ Sweep for copy consistency and update reusable helpers (Phase E).
7. ✅ Verify responsive behavior via Tailwind utility classes and run linting.

We will execute Phases A–E in this change set to deliver the integrated experience the mockup depicts.
