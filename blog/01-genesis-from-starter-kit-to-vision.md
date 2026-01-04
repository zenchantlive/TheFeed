---
title: "Part 1: Genesis - From Starter Kit to Vision"
series: "TheFeed Development Journey"
part: 1
date: 2025-08-11
updated: 2025-12-27
tags: [nextjs, typescript, starter-kit, authentication, ai]
reading_time: "8 min"
commits_covered: "2af182a..557bbcc"
---

## Where It All Started

Every project begins somewhere. For TheFeed, it started on August 11, 2025, with a single command: `npx create-next-app`.

But this wasn't just another "Hello World" moment. This was the beginning of an (**Agentic Coding Starter Kit**)[https://github.com/leonvanzyl/agentic-coding-starter-kit} - a foundation designed to accelerate AI-assisted development with all the modern web stack essentials built in.

Looking back at that first day (23 commits!), I was setting up the infrastructure that would eventually support a hyperlocal food-sharing network serving people experiencing food insecurity. But I didn't know that yet.

## The Foundation: What's in a Starter Kit?

The initial setup (`2af182a - c412e6e`) established the core stack:

- **Next.js 15** with App Router and React 19
- **TypeScript** for type safety
- **Drizzle ORM** with PostgreSQL (via Supabase)
- **Better Auth** for authentication
- **shadcn/ui** component library with Tailwind CSS 4
- **Vercel AI SDK** for LLM integration

This wasn't minimal. This was **opinionated and complete** - ready for serious development from day one.

### The Authentication Challenge

One of the first real challenges was getting Better Auth working properly. The initial implementation looked simple:

```typescript
// src/lib/auth.ts - Initial setup
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg"
  }),
  emailAndPassword: {
    enabled: true
  }
});
```

But the devil was in the details. Database migrations, session management, OAuth provider setup - each piece needed careful attention. By commit `05384d5`, I had streaming authentication working, but it took multiple iterations to get the avatar component (`616ebb8`) and user profile display right.

## Building Developer Experience

What struck me during these first two days was the focus on **developer experience**. This wasn't just about getting features working - it was about creating a foundation that would accelerate future development.

### Health Checks and Verification

Early on (`9dcb5aa`), I implemented a health checklist UI that verified:
- Database connectivity
- Authentication flow
- API endpoints
- Environment variables

This meant I could **verify the entire stack** before writing any application logic. When something broke, I knew immediately which layer failed.

### Documentation as Code

Another early decision (`557bbcc`) was creating `CLAUDE.md` - a comprehensive guide for AI assistants working on the codebase. This wasn't just documentation; it was **contextual memory** that would persist across sessions.

```markdown
# CLAUDE.md
This file provides guidance to AI assistants when working with code in this repository.

## Project Overview
[Stack details, architecture decisions, and workflow expectations]

## Essential Commands
bun dev              # Development server
bun run build        # Production build
bun run db:push      # Database migrations
```

This early investment paid dividends later. Every AI agent could quickly understand the project structure, conventions, and how to contribute effectively.

## The Stack Decisions

Looking back, several early technical decisions proved crucial:

### 1. Bun Over npm/pnpm

The project started with pnpm but later migrated to Bun. In hindsight, starting with Bun would have saved time, but the migration taught valuable lessons about package manager quirks and Windows vs. WSL compatibility.

### 2. Drizzle Over Prisma

Choosing Drizzle ORM was unconventional (Prisma dominates the Next.js ecosystem), but it offered:
- Better TypeScript inference with `$inferSelect` and `$inferInsert`
- More control over raw SQL when needed
- Lighter runtime bundle
- Easier migration generation

This choice would prove essential when implementing complex spatial queries (PostGIS) months later.

### 3. Better Auth Over NextAuth

Better Auth v1.3.34 was a relatively new player compared to NextAuth/Auth.js. Why choose it?

- Simpler API surface
- Better TypeScript support
- Flexible adapter system
- Active development with responsive maintainer

The trade-off? Less documentation and fewer Stack Overflow answers. But the cleaner architecture made debugging easier.

### 4. shadcn/ui Philosophy

Rather than a heavyweight component library, shadcn/ui provides **copy-paste components** you own. This meant:
- Full customization freedom
- No mysterious dependency upgrades breaking UI
- Learning Radix UI primitives directly
- Tailwind CSS 4 integration

By commit `9377f6e`, I had standardized to Tailwind and shadcn defaults, creating visual consistency across the entire app.

## The AI Integration Layer

One of the most forward-looking decisions was building AI integration from day one. The initial chat implementation (`efdc0b4`) used the Vercel AI SDK with streaming responses:

```typescript
// src/app/api/chat/route.ts - Early version
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4-turbo'),
    messages,
  });

  return result.toDataStreamResponse();
}
```

Simple, elegant, and **ready to add tool calling** when needed. This foundation would later support:
- Food bank search tools
- Direction generation
- Hours parsing
- Resource recommendations

## Early Mistakes and Learnings

Not everything went smoothly. Some early decisions I wish I'd made differently:

### Mistake 1: Not Pinning Dependency Versions

Using `^` ranges in package.json caused headaches later when `lucide-react@0.539.0` broke on Windows. Lesson learned: **pin exact versions** for stability.

### Mistake 2: Mixing PowerShell and WSL

Running `bun install` from WSL caused native dependency mismatches. The fix: **always run from PowerShell** to ensure Windows-compatible binaries. This should have been documented on day one.

### Mistake 3: Skipping Type Safety Early

Early components used `any` types liberally. Cleaning this up months later (`fix/build-issues`) consumed hours. Should have enforced strict TypeScript from commit one.

## What I Learned

These first two days taught fundamental lessons that shaped the entire project:

1. **Invest in Developer Experience Early**: Health checks, documentation, and tooling upfront save exponential time later.

2. **Choose Stack for Maintainability, Not Popularity**: Drizzle and Better Auth weren't the "safe" choices, but they fit the project's needs better than alternatives.

3. **Context Files Are Non-Negotiable**: `CLAUDE.md`, `context/state.md`, and `context/decisions.md` became the project's memory across AI sessions.

4. **Start Opinionated**: The starter kit had strong opinions about structure, naming, and patterns. This **accelerated development** by eliminating decision fatigue.

5. **AI-First Development Works**: Building with AI assistance from day one wasn't a gimmick - it fundamentally changed how fast I could iterate.

## The Vision Emerges

By August 13, I had a working authentication system, database schema, AI chat interface, and deployment pipeline. But I didn't have an **application** yet.

The starter kit was complete. But what would I build with it?

That question wouldn't be answered for another 83 days, when a simple idea would transform this technical foundation into something that could help real people: **TheFeed**.

## Up Next

In Part 2, I'll share the pivotal moment that turned this starter kit into FoodShare - the discovery of a problem worth solving and the rapid prototyping sprint that followed.

---
**Key Commits**:
- `2af182a` - Initial Next.js app
- `efdc0b4` - Streaming chat implementation
- `9dcb5aa` - Health check UI
- `616ebb8` - Avatar component
- `557bbcc` - CLAUDE.md documentation

**Related Files**:
- `src/lib/auth.ts` - Authentication configuration
- `src/lib/db.ts` - Database client
- `CLAUDE.md` - AI assistant documentation

