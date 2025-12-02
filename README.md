# TheFeed (formerly FoodShare)

TheFeed is a hyperlocal food-sharing network for neighbors to discover trusted resources, coordinate community events, and receive empathetic AI guidance. It is built with Next.js 15 (App Router), React 19, TypeScript, Tailwind v4, Drizzle ORM, Supabase Postgres, Mapbox GL, and the Vercel AI SDK (via OpenRouter).

The project is currently in **Phase 5: Community Engagement** with provider claims tooling in active development, following completed map/chat foundations, the social feed, and the event hosting system.

## Highlights

- **Interactive discovery map** powered by Mapbox GL, PostGIS geometry, and deep links (`/map?resource=ID`).
- **AI sous-chef chat** with OpenRouter models, tool calling (search, directions, hours), and CopilotKit UI renderers (`/chat-v2`).
- **Community feed & profiles** with posts, comments, follows, karma scaffolding, and saved locations.
- **Event hosting** including creation wizard, RSVPs, waitlists, sign-up slots, calendar view (`/community/events/calendar`), and quick map RSVP.
- **Admin & trust layer** with verification badges, data completeness indicators, and in-progress provider claims workflow (schema, submission API, admin tables).

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+
- Postgres (local or Supabase)
- Mapbox public access token (for map tiles)

### 1) Clone & Install

```bash
git clone https://github.com/zenchantlive/TheFeed.git
cd TheFeed
pnpm install
```

### 2) Configure Environment

Copy the template and fill in secrets:

```bash
cp env.example .env
```

Key variables:

- `POSTGRES_URL` – Postgres/Supabase connection string (keep `sslmode=require` for Supabase).
- `BETTER_AUTH_SECRET` – 32+ character secret for Better Auth.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` – OAuth credentials.
- `NEXT_PUBLIC_APP_URL` – Usually `http://localhost:3000` in development.
- `NEXT_PUBLIC_MAPBOX_TOKEN` – Mapbox public token for the map UI.
- `OPENROUTER_API_KEY` (and optional `OPENROUTER_MODEL`) – AI chat provider.
- `POLAR_*` – Only required if enabling Polar billing/webhooks.

### 3) Database & Seed Data

We use Drizzle ORM migrations. After setting `POSTGRES_URL`:

```bash
pnpm run db:generate   # when schema changes
pnpm run db:migrate    # apply migrations
pnpm exec tsx --env-file=.env scripts/seed-food-banks.ts   # optional: seed sample Bay Area food banks
```

### 4) Run the App

```bash
pnpm dev
```

Visit `http://localhost:3000` and explore:

- `/map` – resource discovery with deep links, popups, and quick RSVP for events.
- `/chat-v2` – CopilotKit-powered sous-chef with streaming tool renderers.
- `/community` – event-first layout with posts always visible and map deep links.
- `/community/events/calendar` – month view with type filters.
- `/profile` – saved locations and onboarding tips.

### Production Build

```bash
pnpm build
pnpm start
```

## Quality Gates

Before merging changes, run:

```bash
pnpm lint
pnpm typecheck
```

## Project Structure

- `src/app/map/` – server/client map pages, filters, popups, sidebar resource detail, map event/post layers.
- `src/components/map/` – Mapbox view and search UI.
- `src/app/chat/` & `src/app/chat-v2/` – AI chat experiences (Vercel AI SDK + CopilotKit).
- `src/app/community/` – event-first community layout, composer, post feed, discovery context, calendar view.
- `src/lib/schema.ts` – single source of truth for database schema (auth, resources, social, events, claims).
- `src/lib/*-queries.ts` – Drizzle query helpers for food banks, posts, events, providers.
- `scripts/` – tooling, seeding, and debug helpers for chat/tools.
- `context/` – roadmap, state, and decisions (keep in sync for architecture or workflow changes).

## Current Status

- **Phase 5 (Community Engagement):** Provider claims schema, submission API, query layer, and admin tables are complete; admin review UI is in progress. Gamification indices shipped; broader gamification integration deferred.
- **Phase 4:** PostGIS spatial queries live; Redis caching deferred.
- **Phase 3:** Event hosting, RSVP flows, and calendar view are shipped; sign-up sheet UI and host tools are upcoming.
- Known issues: a handful of pre-existing typecheck warnings (admin layout headers, select component import, event card props, admin geom field).

## Contributing

We are preparing the project for open source. Please review [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), [DEVELOPMENT.md](DEVELOPMENT.md), and [SECURITY.md](SECURITY.md) before opening a PR. Favor pnpm commands, maintain strict typing, and keep context files updated for meaningful architectural changes.

## License

Unless noted otherwise, TheFeed is released under the MIT License. See [LICENSE](LICENSE).

