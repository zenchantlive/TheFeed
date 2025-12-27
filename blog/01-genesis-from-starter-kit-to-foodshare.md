---
title: "Part 1: Genesis - From Starter Kit to FoodShare"
series: "TheFeed Development Journey"
part: 1
date: 2025-11-02
updated: 2025-12-27
tags: ["bootstrap", "architecture", "foodshare", "next-js"]
reading_time: "8 min"
commits_covered: "bd2d88a..41149ed"
---

## Where We Are

In August 2025, a new project emerged from the Agentic Coding Starter Kit with a clear mission: build a hyperlocal food-sharing network to connect people experiencing food insecurity with nearby resources and neighbors. This is the story of how we transformed a generic starter template into FoodShare, establishing the foundation that would eventually become TheFeed.

## The Starting Point

The journey began with the Agentic Coding Starter Kit—a modern Next.js 15 template built on React 19 with TypeScript, Drizzle ORM, and Vercel AI SDK. It was a solid foundation, but completely generic. Our task: brand it, adapt it, and prepare it for a mission-critical domain.

**Initial Infrastructure Setup** (Aug 20-27, 2025):
- Added cursor rules and MCP configurations (`bd2d88a`, `eda917e`)
- Standardized to Tailwind CSS 4 and shadcn/ui for consistency (`9377f6e`)
- Replaced emoji icons with Lucide React icons for better maintainability (`a0de269`)
- Set up Docker Compose with PostgreSQL 18 for local development (`f71cccf`)

The early commits were about **standardization**—establishing the technical baseline that would support everything built on top. We weren't adding features yet; we were preparing the canvas.

## The Strategic Pivot: From Generic to Purpose-Built

On November 2, 2025, everything shifted. The project was officially **bootstrapped as FoodShare** (`f106882`) with a singular focus:

> "Build a hyperlocal food-sharing network connecting people experiencing food insecurity with nearby resources and neighbor-to-neighbor support."

This wasn't a pivot away from the starter kit—it was a crystallization of purpose. Every subsequent decision would be filtered through this mission.

### Tech Stack Decisions Made at Bootstrap

1. **Migration from OpenAI to OpenRouter** (`61e98f2`, Nov 3)
   - Decision: Support multiple AI models with a provider-agnostic approach
   - Rationale: Cost efficiency + flexibility for different use cases
   - Impact: Enabled access to Claude, which would later power our AI sous-chef

2. **Better Auth + Google OAuth** (Already in starter kit, but now purposed)
   - Decision: Treat authentication as a community trust signal
   - Constraint: Users must have real identities (no anonymous posting)
   - Philosophy: Dignity-preserving design requires accountability

3. **Mapbox GL for Resource Discovery** (Pre-existing, but reframed)
   - Decision: Make finding resources as easy as finding restaurants
   - Insight: Walkability matters—actual bikeable/walkable radius (2-5 miles)
   - Design principle: Show, don't tell. Visual discovery > search forms

## FoodShare Branding & Initial Features

With the bootstrap commit established, the next phase focused on **branding and core experience design**.

### Branding Implementation (Nov 5-6)

The team completed FoodShare branding (`41149ed`) with these key additions:

1. **User Profiles with Avatar Dropdowns**
   - Replaced generic nav text with personalized experience
   - Added user profile page (`eb71ad7`)
   - Created relationship foundation for later social features

2. **Saved Locations Feature** (`b050ab5`, `95ed793`, `9955a60`)
   - Users could save favorite food banks for quick access
   - API endpoint to fetch all saved locations (`ba84abb`)
   - First step toward personalization

3. **Map Integration Refinement**
   - Made locations discoverable and saveable
   - Foundation for later "Resources Near You" widget

### Architectural Decisions

**Database Schema Scope** (`src/lib/schema.ts`):
- Core auth tables (user, session, account, verification) from Better Auth
- `foodBanks` table for resource directory
- `savedLocations` table for personalization
- Intentionally minimal—no community features yet

**API Route Structure** (`src/app/api/`):
- `/api/locations` for food bank discovery
- `/api/chat` for AI assistance (Vercel AI SDK)
- Clean separation of concerns

## The Potluck Vision Emerges

By late November, the team was already thinking beyond resource discovery. The name shift from "FoodShare" to "TheFeed" came later, but the vision was evolving:

> "Connect people experiencing food insecurity with resources AND enable neighbor-to-neighbor food sharing through community events."

This vision would drive everything in Phase 1-3.

## What I Learned

1. **Starting from a template is fine if you immediately make it yours**. The Agentic Coding Starter Kit provided solid infrastructure, but real development started when we asked: "What problem are we solving?" and let that question guide every architectural choice.

2. **Naming matters more than you think**. "FoodShare" eventually became "TheFeed" because the brand needed to reflect the aspirational community dynamic, not just the mechanic of sharing. The name change forced us to think bigger.

3. **Constraints are features**. By requiring real identities (Better Auth) and focusing on actual walking distance (2-5 miles), we weren't limiting the product—we were defining its character. Every constraint was a design decision.

4. **Bootstrap with purpose**. It's tempting to just start coding. The project could have skipped the "bootstrap" moment and jumped straight to features. Instead, taking time to establish the tech stack, branding, and core philosophy saved us from reworking foundation decisions later.

## Up Next

With the foundation solid and the mission clear, Phase 1 would build the core community infrastructure. Events were already conceptually sketched. The map was ready. Now we needed the social layer.

---

**Key Commits**: `bd2d88a` (setup), `61e98f2` (OpenRouter), `f106882` (bootstrap), `41149ed` (FoodShare branding)

**Related Code**: `src/lib/schema.ts`, `src/app/api/locations/route.ts`, `src/components/auth/`
