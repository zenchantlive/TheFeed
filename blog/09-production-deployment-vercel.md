---
title: "Part 9: Going Live - Production Deployment on Vercel"
series: "TheFeed Development Journey"
part: 9
date: 2025-12-06
updated: 2025-12-27
tags: ["deployment", "vercel", "production", "infrastructure"]
reading_time: "8 min"
commits_covered: "6dea9a8..03e99f6"
---

## Where We Are

By December 6, 2025, the team had built a sophisticated platform with months of development. But it was still running on a local machine.

Time to **go live**.

The decision: Deploy to **Vercel**, the creators of Next.js. It's built for frameworks like ours and handles scaling automatically.

Deployment PR #46 (`6dea9a8..03e99f6`) documented the journey from "working locally" to "accessible to the world."

## The Pre-Deployment Checklist

Before shipping, the team verified:
- ✅ All TypeScript errors resolved (December 4)
- ✅ ESLint passes
- ✅ Database schema stable
- ✅ Environment variables documented
- ✅ Auth configured for production
- ✅ Error handling in place

## The Vercel Setup

### Step 1: Connect GitHub

Vercel integrates with GitHub for automatic deployments:
```
1. Push to main
2. Vercel detects
3. Builds automatically
4. Deploys preview
5. Feedback on PR
```

### Step 2: Environment Configuration

Production needed different env vars than development:

```bash
# .env.production (set in Vercel dashboard, NOT committed)
POSTGRES_URL=postgresql://user:pass@...supabase.co:6543/postgres?...
BETTER_AUTH_SECRET=<32+ char random string>
BETTER_AUTH_URL=https://thefeed-phi.vercel.app
GOOGLE_CLIENT_ID=<production client>
GOOGLE_CLIENT_SECRET=<production secret>
NEXT_PUBLIC_APP_URL=https://thefeed-phi.vercel.app
NEXT_PUBLIC_MAPBOX_TOKEN=<production token>
OPENROUTER_API_KEY=<production key>
```

**Security Note**: All secrets stored in Vercel's secure dashboard, not in code.

## The Gotchas & Solutions

### Gotcha 1: Database Connection Pooling

Vercel runs serverless functions. Each function needs its own connection.

**Problem**: Vercel can spawn 50+ concurrent functions, each needing a database connection. Direct connections quickly exceed Supabase's limit.

**Solution**: Use connection pooling on port 6543:

```typescript
// src/lib/db.ts - Before
const pool = new Client({
    connectionString: process.env.POSTGRES_URL,
});

// After: Use Supabase connection pooler
const url = new URL(process.env.POSTGRES_URL);
url.port = "6543";  // Connection pool port
url.searchParams.set("sslmode", "require");

const pool = new Client({
    connectionString: url.toString(),
});
```

**Result**: Can handle 50+ concurrent requests.

### Gotcha 2: Better Auth with Wildcard Origins

Better Auth validates OAuth redirect URIs. In development, it's localhost. In production, it's vercel.app.

**Problem**: Vercel preview deployments have URLs like `feature-branch-site-name.vercel.app`. Can't whitelist all of them.

**Solution**: Use wildcard trusted origins:

```typescript
// src/lib/auth.ts
export const auth = betterAuth({
    database: getConnection(),
    trustedOrigins: [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://*.vercel.app",  // Wildcard for all Vercel deployments
        "https://thefeed-phi.vercel.app",  // Production
    ],
});
```

### Gotcha 3: Environment Variable Detection

Better Auth needs to know its own URL for OAuth. This URL varies per environment.

**Problem**: `BETTER_AUTH_URL` is hardcoded, but Vercel preview URLs are dynamic.

**Solution**: Detect at runtime:

```typescript
// src/lib/auth-client.ts
const getBetterAuthUrl = () => {
    if (typeof window === "undefined") {
        // Server-side: use env var
        return process.env.BETTER_AUTH_URL;
    }
    // Client-side: use current origin
    return window.location.origin;
};

export const authClient = createAuthClient({
    baseURL: getBetterAuthUrl(),
});
```

This lets each deployment auto-detect its own URL.

### Gotcha 4: Map Styling Quirks

Mapbox GL sometimes renders blank on first load in serverless.

**Solution**: Ensure CSS is fully loaded before rendering:

```typescript
// src/app/map/page.tsx
return (
    <>
        <link href="https://api.mapbox.com/mapbox-gl/v3.1.0/mapbox-gl.css" rel="stylesheet" />
        <MapPageClient />
    </>
);
```

### Gotcha 5: TypeScript in Next.js Build

The build step ran TypeScript checking. Some edge case types broke.

**Solution**: Fix all types before deployment:

```bash
bun run typecheck && bun run lint && bun run build
```

All three had to pass. No exceptions.

## Deployment Flow

```
1. Commit to `main`
2. GitHub webhooks notify Vercel
3. Vercel runs build:
   a. Install dependencies
   b. Run typecheck
   c. Run build (next build)
   d. Generate static pages
4. Deploy to edge network (150+ locations)
5. Health checks verify
6. Old deployment archived
7. Traffic switches to new version
```

**Time**: ~2-3 minutes from push to live.

## Production Verification

After deployment, the team verified:

```
✅ Sign-in works (Google OAuth)
✅ Map loads and displays resources
✅ Chat can search resources
✅ Community posts visible
✅ Events display correctly
✅ Database queries fast
✅ No TypeScript errors in console
✅ Performance metrics acceptable
```

### Monitoring Setup

Added basic monitoring:

```typescript
// Vercel provides Web Vitals
import { reportWebVitals } from "next/web-vitals";

reportWebVitals((metric) => {
    console.log(`${metric.name}: ${metric.value}ms`);
});
```

## The URL

🎉 **Live at: https://thefeed-phi.vercel.app**

## The Scaling Moment

With production deployed, the team realized: **the infrastructure was ready for users**.

Vercel auto-scales:
- 1 user: runs on tiny instance
- 1,000 users: spins up more instances automatically
- No downtime, no manual scaling needed

This infrastructure-as-a-service model meant the team could focus on features, not ops.

## What We Learned

1. **Environment variables are hard**. The number of gotchas with configuration made us appreciate Vercel's dashboard—one place to manage secrets safely.

2. **Serverless has different constraints**. Connection pooling, statelessness, cold starts—we had to think differently than monolithic deployment.

3. **Test in production-like environment**. The issues only surfaced because we deployed to Vercel staging first. Local testing missed them.

4. **Preview deployments are underrated**. Vercel creates a unique URL per PR. QA could test branches before merging. Invaluable.

## The Human Impact

With the app live, real users could:
- Actually find food banks
- Actually post offers/requests
- Actually organize potlucks
- Actually trust the system

The platform was no longer a tech demo. It was real.

## Up Next

With production deployed, the user experience became paramount. The team shifted focus to **UX refinement** and **polish**—making the app delightful, not just functional.

---

**Key Commits**: `6dea9a8` (initial Vercel setup), `03e99f6` (docs), related env config

**Related Code**: `src/lib/auth.ts`, `src/lib/auth-client.ts`, `vercel.json` (if present), environment documentation
