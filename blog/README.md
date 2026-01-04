# TheFeed: Development Journey

A comprehensive 14-part blog series documenting the complete development of **TheFeed** (formerly FoodShare) - a hyperlocal food-sharing network connecting people experiencing food insecurity with nearby resources and neighbor-to-neighbor support.

## About the Project

**TheFeed** is a Next.js 15 web application built over 4.5 months (August - December 2025) that combines:

- **Interactive Map**: Mapbox GL-powered discovery of 500+ food banks and community resources
- **AI Sous-Chef**: Context-aware assistant using OpenRouter AI with 7 integrated tools
- **Community Potluck**: Social feed for offers, requests, events, and volunteer opportunities
- **Provider Tools**: Food bank staff can claim and manage their own listings

**Tech Stack**: Next.js 15, React 19, TypeScript, Drizzle ORM, Supabase PostgreSQL, Better Auth, Mapbox GL JS, PostGIS, CopilotKit, OpenRouter AI, shadcn/ui, Tailwind CSS 4

**Timeline**: 138 days, 290 commits, 50,000+ lines of code

**Production URL**: https://thefeed-phi.vercel.app

**Repository**: https://github.com/zenchantlive/TheFeed

## Series Overview

This blog series documents the **entire development journey** - from initial starter kit setup through production deployment, including technical decisions, UX iterations, and lessons learned from building with AI assistance.

### The Development Arc

**Act 1: Origins** (August 2025)
- Setting up the foundation with Next.js, TypeScript, and a comprehensive starter kit
- 83 days of preparation before discovering the real problem to solve

**Act 2: Foundation** (November 2025)
- The pivot to FoodShare - finding a problem worth solving
- Rapid prototyping: map, AI chat, community features, event hosting
- 52 commits in 4 days building core functionality

**Act 3: Production Reality** (November - December 2025)
- CopilotKit migration for better AI streaming
- Data quality crisis: geocoding failures, duplicate detection, validation systems
- Trust features: verification badges, source attribution, transparency

**Act 4: Going Live** (December 2025)
- Production deployment challenges: database pooling, authentication fixes
- UX redesign: glassmorphic auth modal, mobile-first bottom sheets
- Performance optimization: PostGIS for 100x faster spatial queries

**Act 5: Advanced Features** (December 2025)
- Provider claims system empowering food bank staff
- Admin approval workflows with verification
- Current state and comprehensive lessons learned

## Complete Post List

### Part 1: Genesis - From Starter Kit to Vision
*August 11-13, 2025*

Setting up the opinionated Next.js starter kit with TypeScript, Drizzle ORM, Better Auth, and shadcn/ui. The foundation that would enable rapid development later.

**Key topics**: Stack decisions, authentication setup, developer experience, early mistakes

[Read Part 1 →](01-genesis-from-starter-kit-to-vision.md)

---

### Part 2: The FoodShare Pivot - Finding the Real Problem
*November 5, 2025*

The 83-day gap ends with a pivotal moment: discovering the food insecurity problem and pivoting from a generic starter kit to a mission-driven application.

**Key topics**: Problem validation, product vision, dignity-preserving design, beachhead strategy

[Read Part 2 →](02-the-foodshare-pivot-finding-the-real-problem.md)

---

### Part 3: Building the Map - Food Bank Discovery with Mapbox
*November 6, 2025*

Integrating Mapbox GL JS, manually seeding Sacramento food banks, implementing geolocation and distance calculations, and creating a mobile-first map interface.

**Key topics**: Mapbox integration, manual data curation, spatial search, mobile UX

[Read Part 3 →](03-building-the-map-food-bank-discovery-with-mapbox.md)

---

### Part 4: The AI Sous-Chef - Chat Tools and OpenRouter
*November 7, 2025*

Building an AI assistant with tool calling - search food banks, generate directions, provide personalized help. Migration from OpenAI to OpenRouter for model flexibility.

**Key topics**: Tool calling, OpenRouter integration, streaming chat, voice input, system prompting

[Read Part 4 →](04-the-ai-sous-chef-chat-tools-and-openrouter.md)

---

### Part 5: Building Community - Posts, Comments, and Social Features
*November 7, 2025*

Creating the social layer - posts, comments, karma, follows, and helpful marks. Database design for a dignity-preserving community experience.

**Key topics**: Social database schema, API routes, cursor pagination, denormalized counters

[Read Part 5 →](05-building-community-posts-comments-and-social-features.md)

---

### Part 6: Event Hosting - Enabling Community Potlucks
*November 8, 2025*

Building a comprehensive event system with RSVPs, capacity management, signup sheets, recurring events, and calendar views.

**Key topics**: Event schema, RSVP workflows, sign-up sheets, calendar UI, map integration

[Read Part 6 →](06-event-hosting-enabling-community-potlucks.md)

---

### Part 7: The CopilotKit Migration - Upgrading AI Chat
*November 15, 2025*

Replacing custom streaming chat with CopilotKit to fix the blank bubble bug. Implementing type-safe tool renderers and context injection.

**Key topics**: CopilotKit integration, tool renderers, streaming optimization, context management

[Read Part 7 →](07-the-copilotkit-migration-upgrading-ai-chat.md)

---

### Part 8: Data Quality Crisis - Geocoding, Duplicates, and Validation
*November 18, 2025*

Fighting the Null Island problem - geocoding failures inserting (0,0) coordinates. Building validation, confidence scoring, and duplicate detection systems.

**Key topics**: Geocoding validation, confidence scoring, duplicate detection, data integrity

[Read Part 8 →](08-data-quality-crisis-geocoding-and-validation.md)

---

### Part 9: Trust & Verification - Building User Confidence
*December 1, 2025*

Building user trust through verification badges, source attribution, data completeness indicators, and transparent data provenance.

**Key topics**: Verification system, source attribution, transparency features, deep linking

[Read Part 9 →](09-trust-and-verification-building-user-confidence.md)

---

### Part 10: Going Live - Production Deployment to Vercel
*December 6, 2025*

The painful but educational journey of deploying to production. Database connection pooling, authentication fixes, SSL configuration, and TypeScript error massacre.

**Key topics**: Vercel deployment, Supabase pooling, Better Auth configuration, environment variables

[Read Part 10 →](10-going-live-production-deployment-to-vercel.md)

---

### Part 11: The UX Redesign - Glassmorphic Auth and Mobile-First
*December 7-9, 2025*

Transforming the UX with a glassmorphic authentication modal, mobile-first bottom sheets, unified creation drawer, and public community access.

**Key topics**: Glassmorphic design, auth modal, bottom sheets, mobile patterns, public access

[Read Part 11 →](11-the-ux-redesign-glassmorphic-auth-and-mobile-first.md)

---

### Part 12: Performance & Scale - PostGIS Integration
*December 1, 2025*

Achieving 100x performance improvement by migrating spatial queries to PostGIS. Native database spatial operations replace in-memory JavaScript filtering.

**Key topics**: PostGIS migration, spatial indices, geometry vs geography, query optimization

[Read Part 12 →](12-performance-and-scale-postgis-integration.md)

---

### Part 13: Provider Claims - Empowering Resource Owners
*December 1-2, 2025*

Building a claims system allowing food bank staff to manage their own listings with admin verification workflows.

**Key topics**: Provider claims, admin approval, verification, provider dashboard, fraud prevention

[Read Part 13 →](13-provider-claims-empowering-resource-owners.md)

---

### Part 14: Current State & Lessons from 4.5 Months
*December 27, 2025*

Comprehensive reflection on the entire journey - what worked, what didn't, metrics that matter, and advice for others building similar projects.

**Key topics**: Retrospective, lessons learned, roadmap, AI-assisted development, solo building

[Read Part 14 →](14-current-state-and-lessons-from-4-5-months.md)

---

## Reading Paths

### For the Impatient (30 minutes)
Read these 4 posts for the essential story:
1. [Part 2: The FoodShare Pivot](02-the-foodshare-pivot-finding-the-real-problem.md)
2. [Part 7: The CopilotKit Migration](07-the-copilotkit-migration-upgrading-ai-chat.md)
3. [Part 10: Going Live](10-going-live-production-deployment-to-vercel.md)
4. [Part 14: Current State & Lessons](14-current-state-and-lessons-from-4-5-months.md)

### For Product People (2 hours)
Focus on product and UX decisions:
- Part 2: The Pivot
- Part 5: Community Features
- Part 6: Event Hosting
- Part 9: Trust & Verification
- Part 11: UX Redesign
- Part 14: Lessons Learned

### For Engineers (3-4 hours)
Deep dive into technical implementation:
- Part 1: Genesis & Stack
- Part 3: Map Integration
- Part 4: AI Chat Tools
- Part 7: CopilotKit Migration
- Part 8: Data Quality
- Part 10: Deployment
- Part 12: PostGIS Performance
- Part 13: Provider Claims

### For AI/LLM Enthusiasts (2 hours)
Focus on AI integration and tools:
- Part 4: The AI Sous-Chef
- Part 7: CopilotKit Migration
- Part 8: Data Quality (AI extraction)
- Part 14: AI-Assisted Development Lessons

### Complete Journey (6-8 hours)
Read all 14 posts in order for the full development narrative from initial commit to production deployment.

## Key Themes

### Technical Excellence
- **Type Safety**: Strict TypeScript with Drizzle ORM's type inference
- **Developer Experience**: Fast builds, comprehensive tooling, context documentation
- **Performance**: PostGIS spatial queries, database indices, optimized queries
- **Modern Stack**: Next.js 15, React 19, latest ecosystem tools

### AI-Assisted Development
- **3-5x productivity** gains with careful AI prompting
- **Context files** as infrastructure for AI memory
- **Iterative refinement** of AI-generated code
- **Verification required** - AI can hallucinate

### User-Centered Design
- **Dignity-preserving**: Requests look identical to offers
- **Mobile-first**: Bottom sheets, thumb-friendly targets
- **Trust through transparency**: Verification badges, source attribution
- **Progressive enhancement**: Works without auth, better with it

### Solo Building
- **Strengths**: Fast decisions, focused vision, AI pair programming
- **Challenges**: No code review, decision fatigue, scope creep
- **Mitigation**: Comprehensive documentation, frequent commits, small iterations

## Statistics

- **Duration**: 138 days (August 11 - December 27, 2025)
- **Commits**: 290 total
- **Code**: 50,000+ lines of TypeScript/TSX
- **Components**: 89 files
- **API Routes**: 23 endpoints
- **Database Tables**: 15+ tables
- **Features**: 20+ major features shipped

## Technology Deep Dives

This series includes practical examples and lessons for:

- **Next.js 15 App Router**: Server/client components, API routes, middleware
- **Drizzle ORM**: Type inference, relations, migrations, raw SQL
- **Better Auth**: OAuth setup, session management, middleware
- **Mapbox GL JS**: Maps, markers, popups, geocoding, deep linking
- **PostGIS**: Spatial queries, geometry columns, GIST indices
- **OpenRouter AI**: Model flexibility, tool calling, streaming
- **CopilotKit**: Chat runtime, tool renderers, context injection
- **shadcn/ui**: Component patterns, theming, composition
- **Vercel**: Deployment, environment variables, production config

## Who This Is For

This series will be valuable if you're:

- **Building with AI assistance** and want real-world patterns
- **Creating social/community platforms** and need architecture guidance
- **Working solo** and want to learn from another solo builder's journey
- **Using Next.js 15** and want production-grade examples
- **Integrating AI/LLM features** into your application
- **Interested in food security** and social impact technology
- **Learning from mistakes** - this series shares failures candidly

## About the Author

**Zenchantlive** is a solo developer building TheFeed with heavy AI assistance (primarily Claude). This series documents the real development process - mistakes, pivots, and lessons learned.

## Contributing

The TheFeed project is open source. If you're inspired to contribute:

- **Code**: https://github.com/zenchantlive/TheFeed
- **Issues**: Report bugs or suggest features
- **Documentation**: Help improve guides and context files
- **Community**: Share with others facing food insecurity

## License

This blog series is licensed under CC BY 4.0 - freely share with attribution.

The TheFeed codebase is MIT licensed - see repository for details.

---

**Start Reading**: [Part 1: Genesis - From Starter Kit to Vision →](01-genesis-from-starter-kit-to-vision.md)

**Jump to End**: [Part 14: Current State & Lessons Learned →](14-current-state-and-lessons-from-4-5-months.md)
