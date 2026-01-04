---
title: "Part 10: Going Live - Production Deployment to Vercel"
series: "TheFeed Development Journey"
part: 10
date: 2025-12-06
updated: 2025-12-27
tags: [deployment, vercel, production, supabase, authentication]
reading_time: "12 min"
commits_covered: "75acfe7..03e99f6"
---

## The Moment of Truth

For three months, TheFeed lived on `localhost:3000`. It worked beautifully... on my machine.

But to help real people, it needed to be **live**.

December 6th was deployment day. What could go wrong?

## Everything.

## The Database Connection Disaster

First deployment attempt:

```bash
$ vercel deploy --prod
✓ Build succeeded
✓ Deploying to production
✗ Runtime Error: Connection pool exhausted
```

The issue? Supabase connection pooling.

### The Problem

Next.js serverless functions create a **new database connection** for every request. With concurrent users, this exhausts connection limits quickly:

```typescript
// This creates a NEW connection on every API call
export const db = drizzle(postgres(process.env.POSTGRES_URL));
```

Supabase limits:
- **Direct connections** (port 5432): 20 max
- **Pooled connections** (port 6543): 200 max

### The Fix

Use Supabase's **connection pooler** (port 6543):

```env
# BEFORE (Direct - Port 5432)
POSTGRES_URL=postgresql://user:pass@host.supabase.co:5432/postgres?sslmode=require

# AFTER (Pooled - Port 6543)
POSTGRES_URL=postgresql://user:pass@host.supabase.co:6543/postgres?sslmode=require&pgbouncer=true
```

The `pgbouncer=true` parameter disables prepared statements (not supported by PgBouncer).

**Result**: No more connection errors. ✅

## The Authentication Catastrophe

Second deployment attempt (after DB fix):

```
Sign-in works → Redirects to callback → 404 Error
```

Users couldn't log in. 😱

### The Problem

Better Auth's OAuth callback used **hardcoded localhost URLs**:

```typescript
// src/lib/auth-client.ts - BEFORE
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",  // ❌ Hardcoded
});
```

When deployed to `thefeed-phi.vercel.app`, OAuth redirected to `localhost` - which didn't exist.

### The Fix

Use **dynamic URLs** based on environment:

```typescript
// src/lib/auth-client.ts - AFTER
export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined"
    ? window.location.origin  // ✅ Dynamic
    : process.env.BETTER_AUTH_URL || "http://localhost:3000",
});
```

For server-side auth:

```typescript
// src/lib/auth.ts - AFTER
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    "https://thefeed-phi.vercel.app",
    "https://*.vercel.app",  // ✅ Wildcard for preview deployments
  ],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`,
    },
  },
});
```

**Key changes**:
1. Dynamic `baseURL` using `window.location.origin`
2. Wildcard `trustedOrigins` for preview deployments (`https://*.vercel.app`)
3. Explicit OAuth `redirectURI` using env var

**Result**: Sign-in worked! ✅

## The SSL Certificate Mystery

Third issue (this was getting tedious):

```
Database connection error: SSL verification failed
```

### The Problem

Production Supabase requires SSL, but the connection string didn't enforce it properly:

```env
# Missing SSL mode
POSTGRES_URL=postgresql://user:pass@host.supabase.co:6543/postgres?pgbouncer=true
```

### The Fix

Explicitly require SSL:

```env
POSTGRES_URL=postgresql://user:pass@host.supabase.co:6543/postgres?sslmode=require&pgbouncer=true
```

Simple, but **critical** for production.

## Environment Variable Hell

Fourth issue:

```
Build Error: POSTGRES_URL is not defined
```

But... I had set it in Vercel's dashboard. 🤔

### The Problem

Environment variables in Vercel need **explicit contexts**:

- **Production**: Used for `vercel --prod`
- **Preview**: Used for branch deployments
- **Development**: Used for `vercel dev`

I had only set them for **Production**.

### The Fix

Set ALL critical env vars for **all three contexts**:

```bash
# Via Vercel dashboard
POSTGRES_URL → Production ✓, Preview ✓, Development ✓
BETTER_AUTH_SECRET → Production ✓, Preview ✓, Development ✓
GOOGLE_CLIENT_ID → Production ✓, Preview ✓, Development ✓
# ... all required vars
```

**Result**: Builds succeeded across all environments. ✅

## The Build TypeScript Massacre

Fifth issue (I wanted to give up):

```
Build failed: Type error in src/app/map/pageClient.tsx:142
Type 'FoodBank' is not assignable to type 'FoodBankWithDistance'
```

### The Problem

Local development used **incremental TypeScript checking**. Production builds ran **full type checking** and found 50+ errors I'd ignored.

### The Fix

This required hours of work (documented in Part 1):

1. Remove all `any` types
2. Fix prop mismatches
3. Add missing type exports
4. Use Drizzle's `$inferSelect` consistently

```typescript
// BEFORE
function ResourceCard({ resource }: { resource: any }) { ... }

// AFTER
import type { FoodBank } from '@/lib/schema';

type FoodBankWithDistance = typeof foodBanks.$inferSelect & {
  distance: number;
};

function ResourceCard({ resource }: { resource: FoodBankWithDistance }) { ... }
```

**Result**: Clean build with zero TypeScript errors. ✅

## Security Hardening

With the app finally building and running, I addressed security:

### 1. Updated Dependencies

```bash
$ bun update

# Critical updates
next: 15.4.6 → 15.4.8  # Fixes CVE-2025-55182
react: 19.0.0 → 19.1.2  # Security patch
```

### 2. Environment Variable Gating

Sensitive features only in production:

```typescript
// src/lib/admin-enhancer.ts
export async function enhanceResource(resourceId: string) {
  if (process.env.NODE_ENV !== 'production') {
    throw new Error('Enhancement API only available in production');
  }

  if (!process.env.TAVILY_API_KEY) {
    return {
      error: 'TAVILY_API_KEY not configured',
      status: 'config_error'
    };
  }

  // ... enhancement logic
}
```

This prevented accidental API usage in preview deployments.

### 3. Rate Limiting (Planned)

I documented but deferred implementing rate limiting:

```typescript
// Future: src/middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

export async function middleware(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "anonymous";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new Response("Rate limit exceeded", { status: 429 });
  }

  return NextResponse.next();
}
```

For MVP, this wasn't critical. But it's on the roadmap.

## The Deployment Workflow

After all fixes, I documented the final workflow:

```bash
# 1. Pre-deployment checklist
bun run typecheck     # Fast type checking
bun run lint          # ESLint verification
bun run build         # Full production build

# 2. Deploy to production
vercel --prod

# 3. Verify deployment
# - Test sign-in flow
# - Check map loads
# - Verify API routes
# - Test chat tools

# 4. Monitor
# - Check Vercel logs for errors
# - Monitor Supabase connection pool usage
# - Watch for authentication failures
```

This checklist became part of `docs/DEPLOYMENT.md`.

## What Went Right

1. **Systematic Debugging**: Each error got isolated, fixed, documented

2. **Environment Variable Strategy**: Explicit contexts prevented subtle bugs

3. **TypeScript Strictness**: Catching errors at build time saved runtime issues

4. **Documentation**: `DEPLOYMENT.md` will save future me hours

## What I'd Do Differently

**Mistake 1: No Staging Environment**

I deployed directly to production. A staging environment (`staging.thefeed.app`) would have caught these issues safely.

**Mistake 2: Late Security Hardening**

SSL, dependency updates, and env var gating should have been configured earlier, not as afterthoughts.

**Mistake 3: Manual Testing**

I manually verified every feature post-deployment. Automated E2E tests (Playwright) would have been faster and more reliable.

## What I Learned

1. **Local ≠ Production**: Serverless, connection pooling, and SSL behave differently than `localhost`

2. **Environment Variables Are Tricky**: Contexts matter; set them explicitly

3. **TypeScript Saves Lives**: Strict checking caught bugs before users hit them

4. **OAuth Is Fragile**: Hardcoded URLs break immediately; always use dynamic origins

5. **Document Everything**: Future deployments will thank you

## Up Next

In Part 11, I'll cover the UX redesign - glassmorphic authentication, mobile-first bottom sheets, and unified creation flows.

---
**Key Commits**:
- `1b7d920` - Configure Supabase connection pooling for serverless
- `75acfe7` - Fix Better Auth for Vercel production and preview deployments
- `03e99f6` - Update state.md with Vercel deployment completion
- `9b28cc8` - Add comprehensive Vercel deployment guide

**Related Files**:
- `docs/DEPLOYMENT.md` - Deployment guide
- `src/lib/auth.ts` - Server auth configuration
- `src/lib/auth-client.ts` - Client auth configuration
