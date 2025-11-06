# FoodShare

FoodShare is a mobile‑first Next.js application that helps people discover nearby food assistance, chat with an AI guide, and stay connected to community programs. It extends the Agentic Coding Starter Kit with map discovery, FoodShare branding, and a Supabase‑backed data layer.

## Highlights

- **Guided assistance** – AI chat tuned for food insecurity scenarios, complete with quick actions and intents.
- **Interactive map** – Mapbox GL map that lists seeded Bay Area food banks with hours, services, and directions.
- **Community stories** – Curated stories and programs to showcase future social features.
- **Account experience** – Better Auth + Google OAuth with saved locations and onboarding tips.
- **Modern stack** – Next.js 15, React 19, TypeScript, Tailwind, Drizzle ORM, Vercel AI SDK.

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/zenchantlive/TheFeed.git
cd TheFeed/foodshare
pnpm install
```

> **Prereqs**: Node 18+, pnpm 9+, Git.

### 2. Environment Variables

Copy the template and fill in secrets:

```bash
cp env.example .env
```

Required values:

| Key | Description |
| --- | --- |
| `POSTGRES_URL` | Supabase (or Postgres) connection string. Keep `sslmode=require` if using Supabase. |
| `BETTER_AUTH_SECRET` | 32+ char random string (`openssl rand -hex 32`). |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | OAuth credentials for Google sign‑in. |
| `NEXT_PUBLIC_APP_URL` | Usually `http://localhost:3000` in development. |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Public Mapbox access token for the map UI. |
| `OPENROUTER_API_KEY` | API key for chat (or swap to another provider in `src/app/api/chat/route.ts`). |
| `OPENROUTER_MODEL` | Optional override (defaults to `openai/gpt-4.1-mini`). |
| `POLAR_WEBHOOK_SECRET` | Only needed if enabling Polar billing webhooks. |

### 3. Database

We use Drizzle ORM. Once `POSTGRES_URL` is set:

```bash
pnpm run db:generate   # when schema changes
pnpm run db:migrate    # applies migrations
pnpm exec tsx scripts/seed-food-banks.ts   # optional, loads sample Bay Area food banks
```

### 4. Run the App

```bash
pnpm dev
```

Visit `http://localhost:3000`, sign in with Google, and explore:

- `/chat` – try the intents or type “I’m hungry and in San Jose”.
- `/map` – inspect seeded food banks, toggle filters, open the popup.
- `/community` – view Phase 1 story/program cards.
- `/profile` – review saved locations (seed script adds demo data).

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Start the development server (Turbopack). |
| `pnpm build` | Production build; runs migrations first. |
| `pnpm start` | Launch the production server. |
| `pnpm lint` | Run ESLint. |
| `pnpm typecheck` | Run TypeScript checks. |
| `pnpm run db:*` | Drizzle helper scripts (generate / migrate / studio / reset). |

## Git Workflow

1. Create a branch for each fix or feature (`git checkout -b feat/map-fixes`).
2. Run `pnpm typecheck` and `pnpm lint` before committing.
3. Submit PRs against `main`, referencing the relevant GitHub issue.

## Current Focus & Known Issues

- Map markers and search need refinement with live Supabase data.
- AI chat occasionally returns an empty response after zip-code prompts.
- Community feed is still static; real social features are scoped for later phases.

Track progress in GitHub issues and update this section as we close items.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for our branching, linting, and PR guidelines. Please respect the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

FoodShare builds on the Agentic Coding Starter Kit (MIT licensed). Unless stated otherwise, contributions are released under MIT. See [LICENSE](LICENSE) for details.
