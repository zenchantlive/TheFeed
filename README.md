# TheFeed 🍎

**Nourishing Neighborhoods, Together.**

TheFeed is a hyperlocal food-sharing network that connects people experiencing food insecurity with nearby resources and neighbor-to-neighbor support. Built with dignity, privacy, and speed in mind.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)

## ✨ Features

### Crisis Path (No Sign-in Required)
- **Interactive Map** – Mapbox GL-powered discovery of food banks, pantries, and meal programs
- **Real-time Status** – See what's open now, verified by the community
- **Anonymous Access** – Find food without creating an account

### Community Path (Sign-in Required)
- **AI Sous-Chef** – CopilotKit-powered assistant for finding resources, planning meals, and coordinating events
- **Community Feed** – Share surplus food, organize potlucks, and post requests
- **Event Hosting** – Create and manage food events with RSVPs and volunteer signups
- **Provider Dashboard** – Food banks can claim and manage their listings

## 🚀 Quick Start

### Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [Bun 1.1+](https://bun.sh/) (package manager)
- [PostgreSQL](https://www.postgresql.org/) or [Supabase](https://supabase.com/) account

### Installation

```bash
# Clone the repository
git clone https://github.com/zenchantlive/TheFeed.git
cd TheFeed/foodshare

# Install dependencies
bun install

# Copy environment template
cp .env.example .env
```

### Environment Variables

Required environment variables in `.env`:

| Variable | Description |
|----------|-------------|
| `POSTGRES_URL` | PostgreSQL connection string (with `sslmode=require` for Supabase) |
| `BETTER_AUTH_SECRET` | 32+ character random string (`openssl rand -hex 32`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `NEXT_PUBLIC_APP_URL` | Your app URL (e.g., `http://localhost:3000`) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox public access token |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI chat |

**Optional:**
| `OPENROUTER_MODEL` | Model override (default: `openai/gpt-4.1-mini`) |
| `POLAR_WEBHOOK_SECRET` | Polar billing webhook secret |

### Database Setup

```bash
# Generate migrations when schema changes
bun run db:generate

# Apply migrations
bun run db:migrate

# Seed sample Bay Area food banks (optional)
bun run scripts/seed-food-banks.ts
```

### Development

```bash
# Start development server (with Turbopack)
bun dev
```

Visit `http://localhost:3000` and explore:
- `/map` – Discover food banks and resources
- `/chat-v2` – Talk to the AI Sous-Chef
- `/community` – Browse community posts and events

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 15 (App Router), React 19 |
| **Language** | TypeScript 5.9 |
| **Database** | PostgreSQL (Supabase) with Drizzle ORM |
| **Auth** | Better Auth v1.3.34 + Google OAuth |
| **UI** | shadcn/ui + Tailwind CSS 4 |
| **Maps** | Mapbox GL JS v3.1 (react-map-gl) |
| **AI** | Vercel AI SDK + OpenRouter + CopilotKit |
| **Fonts** | Geist Sans & Geist Mono |

## 📂 Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── map/          # Food bank discovery map
│   ├── chat-v2/      # AI Sous-Chef (CopilotKit)
│   ├── community/    # Social feed and events
│   └── api/          # API routes
├── components/       # React components
│   ├── ui/           # shadcn/ui components
│   ├── map/          # Map-related components
│   └── events/       # Event components
├── lib/              # Utilities and database
│   ├── schema.ts     # Drizzle ORM schema
│   ├── auth.ts       # Better Auth config
│   └── ai-tools.ts   # AI chat tools
└── hooks/            # Custom React hooks
```

## 🧪 Development Workflow

```bash
# Type checking (fast, 2-5s)
bun run typecheck

# Linting
bun run lint

# Full build (slower, production verification)
bun run build

# Pre-commit workflow
bun run typecheck && bun run lint && bun run build
```

## 📖 Documentation

- **[CONTRIBUTING.md](CONTRIBUTING.md)** – How to contribute
- **[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)** – Community guidelines
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** – Vercel deployment guide
- **[context/](context/)** – Architecture decisions and project state

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:
- Setting up your development environment
- Git workflow and branch naming
- Code style and TypeScript standards
- Pull request process

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

TheFeed builds on the [Agentic Coding Starter Kit](https://github.com/leonvanzyl/agentic-coding-starter-kit) (MIT licensed).

## 🙏 Acknowledgments

- [Agentic Coding Starter Kit](https://github.com/leonvanzyl/agentic-coding-starter-kit) – Foundation template
- [Feeding America](https://www.feedingamerica.org/) – Food bank data inspiration
- [Mapbox](https://www.mapbox.com/) – Beautiful maps
- [CopilotKit](https://www.copilotkit.ai/) – AI assistant framework

---

**Built with ❤️ by hungry neighbors.**
