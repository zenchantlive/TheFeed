# FoodShare

FoodShare is a mobile‑first Next.js application that helps people discover nearby food assistance, chat with an AI guide, and stay connected to community programs. It extends the Agentic Coding Starter Kit with map discovery, FoodShare branding, and a Supabase‑backed data layer.

## Highlights

- **Guided assistance** – AI chat tuned for food insecurity scenarios, complete with quick actions and intents.
- **Interactive map** – Mapbox GL map that lists seeded Bay Area food banks with hours, services, and directions.
- **Community stories** – Curated stories and programs to showcase future social features.
- **Account experience** – Better Auth + Google OAuth with saved locations and onboarding tips.
- **Modern stack** – Next.js 15, React 19, TypeScript, Tailwind 4, Drizzle ORM, Vercel AI SDK.

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/zenchantlive/TheFeed.git
cd TheFeed/foodshare
bun install
```

> **Prereqs**: Node 20+, Bun 1.1+, Git.
> **Windows/WSL Users**: Please read [CONTRIBUTING.md](CONTRIBUTING.md) for critical setup instructions.

### 2. Environment Variables

Copy the template and fill in secrets:

```bash
cp .env.example .env
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
bun run db:generate   # when schema changes
bun run db:migrate    # applies migrations
bun run scripts/seed-food-banks.ts   # optional, loads sample Bay Area food banks
```

### 4. Run the App

```bash
bun dev
```

Visit `http://localhost:3000`, sign in with Google, and explore:

- `/chat-v2` – try the intents or type “I’m hungry and in San Jose”.
- `/map` – inspect seeded food banks, toggle filters, open the popup.
- `/community` – view Phase 1 story/program cards.
- `/profile` – review saved locations (seed script adds demo data).

## Scripts

| Script | Description |
| --- | --- |
| `bun dev` | Start the development server (Turbopack). |
| `bun run build` | Production build; runs migrations first. |
| `bun start` | Launch the production server. |
| `bun run lint` | Run ESLint. |
| `bun run typecheck` | Run TypeScript checks. |
| `bun run db:*` | Drizzle helper scripts (generate / migrate / studio / reset). |

## Git Workflow

1. Create a branch for each fix or feature (`git checkout -b feat/map-fixes`).
2. Run `bun run typecheck` and `bun run lint` before committing.
3. Submit PRs against `main`, referencing the relevant GitHub issue.

## Current Focus & Known Issues

- **Provider Dashboard**: Currently investigating an infinite loading loop (Phase 5.2g).
- **Map Post Layer**: Currently disabled in production pending finalizing the implementation.
- **AI Chat**: Ensure you are using `/chat-v2` for the stable CopilotKit experience.

Track progress in GitHub issues and update this section as we close items.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for our branching, setup, linting, and PR guidelines. Please respect the [Code of Conduct](CODE_OF_CONDUCT.md).

## Documentation

- **Deployment**: See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Vercel setup.
- **Architecture**: See `context/info.md` and `context/decisions.md`.
- **Archive**: Old plans are stored in `docs/archive/` for reference.

## License

FoodShare builds on the Agentic Coding Starter Kit (MIT licensed). Unless stated otherwise, contributions are released under MIT. See [LICENSE](LICENSE) for details.
