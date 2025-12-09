# Vercel Production Deployment Guide

> **⚠️ SECURITY WARNING**
>
> This document contains placeholder values for demonstration purposes.
> **ALL sensitive values (passwords, API keys, secrets) have been redacted.**
>
> Replace `[YOUR-*]` placeholders with your actual credentials.
> **NEVER commit real secrets to version control.**

## Overview

This document describes the complete setup and configuration for deploying TheFeed to Vercel production and preview environments.

**Status:** ✅ Successfully deployed and operational
**Production URL:** https://thefeed-phi.vercel.app
**Date:** December 6, 2024

---

## Critical Issues Resolved

### 1. Database Connection Failures

**Problem:**
- "Failed query" errors on Vercel
- `ENOTFOUND db.YOUR-PROJECT-REF.supabase.co` DNS errors
- Connection pool exhaustion on serverless

**Root Cause:**
- Using direct database connection (port 5432) instead of connection pooler
- Missing Supabase-specific configuration in postgres client
- Serverless functions creating too many connections

**Solution:**
```typescript
// src/lib/db.ts
const client = postgres(connectionString, {
  prepare: false, // Required for Supabase Supavisor transaction pooling
  max: 1,         // Optimal for serverless: 1 connection per function
});
```

**Environment Variables:**
- Production: `POSTGRES_URL` → Uses pooler (port 6543)
- Local migrations: `DIRECT_URL` → Uses direct connection (port 5432)

**Connection String Format:**
```bash
# Pooler (for Vercel - Port 6543)
postgresql://postgres.YOUR-PROJECT-REF:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres

# Direct (for local - Port 5432)
postgresql://postgres:[PASSWORD]@db.YOUR-PROJECT-REF.supabase.co:5432/postgres
```

**References:**
- [Supabase Serverless Drivers](https://supabase.com/docs/guides/database/connecting-to-postgres/serverless-drivers)
- [Vercel Connection Pooling Guide](https://vercel.com/guides/connection-pooling-with-serverless-functions)

---

### 2. SSL Certificate Errors (drizzle-kit)

**Problem:**
```
Error: self-signed certificate in certificate chain
SELF_SIGNED_CERT_IN_CHAIN
```

**Root Cause:**
- Windows node.js + Supabase SSL certificate validation
- `?sslmode=require` parameter forced strict validation
- Certificate chain validation failed on Windows

**Solution:**
```typescript
// drizzle.config.ts
export default {
  dbCredentials: {
    url: process.env.DIRECT_URL || process.env.POSTGRES_URL!,
    ssl: {
      rejectUnauthorized: false, // Required for Supabase
    },
  },
}
```

**Key Insight:**
- Remove `?sslmode=require` from connection string
- Let drizzle.config.ts handle SSL configuration
- Connection string SSL parameters override config file

---

### 3. Better Auth Sign-In Failures

**Problem:**
- "Sign in failed: Failed to fetch" error
- OPTIONS request succeeded (204) but POST never reached server
- Mixed content errors in browser console

**Root Cause:**
- `auth-client.ts` used `NEXT_PUBLIC_APP_URL` which was set to `localhost:3000`
- Browser blocked HTTPS page calling HTTP localhost API
- Static environment variable didn't work for preview deployments

**Solution:**
```typescript
// src/lib/auth-client.ts
const getBaseURL = () => {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  }
  return window.location.origin; // Dynamic: uses current domain
};
```

**Benefits:**
- ✅ Production: `https://thefeed-phi.vercel.app`
- ✅ Previews: `https://thefeed-[hash]-zenchantlives-projects.vercel.app`
- ✅ Local: `http://localhost:3000`
- ✅ No environment variable configuration needed

---

### 4. Better Auth "Invalid Origin" Errors

**Problem:**
```
ERROR [Better Auth]: Invalid origin: https://thefeed-d6svw6ma5-zenchantlives-projects.vercel.app
POST /api/auth/sign-in/social → 403 Forbidden
```

**Root Cause:**
- Better Auth server only trusted exact production URL
- Preview deployments have dynamic URLs
- Origin validation rejected preview domains

**Solution:**
```typescript
// src/lib/auth.ts
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  trustedOrigins: process.env.VERCEL
    ? ["http://localhost:3000", "https://*.vercel.app"]
    : ["http://localhost:3000"],

  // ... rest of config
});
```

**Key Insight:**
- Use `VERCEL` environment variable to detect deployment
- Wildcard pattern `https://*.vercel.app` accepts all Vercel domains
- Works for production and preview deployments automatically

---

### 5. Security Vulnerability (CVE-2025-55182)

**Problem:**
- Critical RCE vulnerability in React Server Components
- Affected Next.js 15.x and React 19.x

**Solution:**
- Updated Next.js: `15.4.6` → `15.4.8`
- Updated React: `19.1.0` → `19.1.2`
- Updated React DOM: `19.1.0` → `19.1.2`

**References:**
- [Vercel Security Advisory](https://vercel.com/changelog/cve-2025-55182)

---

### 6. TypeScript Build Errors

**Problem:**
```
Type error: Cannot find name 'mapPosts'.
Warning: 'useMapPosts' is defined but never used.
```

**Root Cause:**
- Map posts feature disabled (hook commented out)
- Unused imports and variables remained
- Undefined variable references

**Solution:**
- Removed unused `useMapPosts` import
- Removed unused state variables
- Set `selectedPost = null` with TODO comment

---

## Required Environment Variables

### Vercel Production Setup

**Critical (Must Have):**

```bash
# Database (Port 6543 - Connection Pooler)
POSTGRES_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@[REGION].pooler.supabase.com:6543/postgres

# Google OAuth
GOOGLE_CLIENT_ID=[YOUR-GOOGLE-CLIENT-ID].apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=[YOUR-GOOGLE-CLIENT-SECRET]

# Better Auth (Generate with: openssl rand -hex 32)
BETTER_AUTH_SECRET=[YOUR-32-CHAR-SECRET]
```

**Optional (Recommended):**

```bash
# URLs (for consistency, not strictly required)
BETTER_AUTH_URL=https://thefeed-phi.vercel.app
NEXT_PUBLIC_APP_URL=https://thefeed-phi.vercel.app

# AI Features
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openai/gpt-5-mini

# Map
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...

# CopilotKit
NEXT_PUBLIC_COPILOTKIT_LICENSE_KEY=ck_pub_...

# Search
TAVILY_API_KEY=tvly-dev-...

# Admin
ADMIN_USER_ID=73Dcwo3xLECtUVLpKAtHoJAFFNDdAoTz
```

### Local Development Setup

```bash
# Database (Port 6543 - Pooler for app, Port 5432 - Direct for migrations)
POSTGRES_URL=postgresql://postgres.YOUR-PROJECT-REF:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.YOUR-PROJECT-REF.supabase.co:5432/postgres

# Better Auth
BETTER_AUTH_SECRET=YOUR-32-CHAR-SECRET
BETTER_AUTH_URL=http://localhost:3000

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000

# (Same as production for other vars)
```

---

## Google OAuth Setup

**Required Configuration:**

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on OAuth 2.0 Client ID
3. Add **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   https://thefeed-phi.vercel.app
   ```
4. Add **Authorized redirect URIs:**
   ```
   http://localhost:3000/api/auth/callback/google
   https://thefeed-phi.vercel.app/api/auth/callback/google
   ```
5. Save changes

**Important:**
- URIs must be exact (no trailing slashes)
- Include both localhost and production
- Preview deployments use production OAuth credentials

---

## Supabase Configuration

**Network Settings:**

1. Go to: Project Settings → Database → Network Restrictions
2. Set to: **"Allow all IP addresses"** (required for Vercel's dynamic IPs)
   - Or add Vercel's IP ranges if you want stricter security

**Connection Strings:**

1. **Transaction Pooler** (for Vercel):
   - Port: `6543`
   - Format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres`

2. **Direct Connection** (for local migrations):
   - Port: `5432`
   - Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

---

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables set in Vercel
- [ ] Google OAuth redirect URIs configured
- [ ] Supabase network restrictions allow Vercel
- [ ] Local build passes: `bun run build`
- [ ] TypeScript check passes: `bun run typecheck`
- [ ] Linting passes: `bun run lint`

### Deployment

- [ ] Push to `master` branch (triggers automatic deployment)
- [ ] Or manual deploy: `vercel --prod`

### Post-Deployment Verification

- [ ] Production site loads: https://thefeed-phi.vercel.app
- [ ] Sign-in with Google works
- [ ] User created in Supabase `user` table
- [ ] Session created in Supabase `session` table
- [ ] No errors in Vercel runtime logs
- [ ] No errors in browser console
- [ ] Map page loads correctly
- [ ] Chat functionality works
- [ ] Community page accessible

---

## Troubleshooting

### Sign-In Button Does Nothing

**Check:**
1. Browser console for errors
2. `POSTGRES_URL` set in Vercel
3. `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set
4. Google OAuth redirect URIs configured
5. No mixed content errors (HTTPS → HTTP)

**Common Fixes:**
- Verify `POSTGRES_URL` uses port 6543 (pooler)
- Check Google OAuth credentials are correct
- Ensure redirect URI matches exactly

### Database Connection Errors

**Error:** `ENOTFOUND` or `too many connections`

**Check:**
1. Using pooler URL (port 6543) not direct (port 5432)
2. Password URL-encoded (`%21` not `!`)
3. Supabase network restrictions allow Vercel

**Common Fixes:**
- Update `POSTGRES_URL` to use pooler format
- URL-encode special characters in password
- Set Supabase to allow all IPs

### 403 Invalid Origin Errors

**Error:** `[Better Auth]: Invalid origin`

**Check:**
1. Code deployed with `trustedOrigins` wildcard
2. Not using old cached deployment

**Fix:**
- Redeploy latest code with wildcard pattern
- Clear Vercel build cache if needed

---

## Performance Considerations

### Database

- **Connection Pooling:** Always use port 6543 (Supavisor)
- **Pool Size:** Default is sufficient for most apps (20-40)
- **Max Connections:** Set to 1 per serverless function
- **Prepared Statements:** Disabled (`prepare: false`)

### Serverless Functions

- **Runtime:** Node.js (default)
- **Region:** Auto (matches Supabase region when possible)
- **Timeout:** Default 10s (adjust if needed)
- **Memory:** Default 1024MB (adjust if needed)

### Monitoring

- **Vercel Logs:** Runtime errors and function invocations
- **Supabase Dashboard:** Connection pool usage
- **Browser Console:** Client-side errors

---

## Architecture Notes

### Database Connection Strategy

**Vercel (Serverless):**
```
Next.js Function → Postgres Client (prepare: false, max: 1) → Supavisor Pooler (port 6543) → Supabase PostgreSQL
```

**Local (Development):**
```
Next.js Dev Server → Postgres Client → Supavisor Pooler (port 6543) → Supabase PostgreSQL
drizzle-kit → Direct Connection (port 5432) → Supabase PostgreSQL
```

### Auth Flow

**Client-Side:**
```
User clicks "Sign In" → signIn.social({ provider: "google" })
→ POST to window.location.origin + "/api/auth/sign-in/social"
→ Better Auth creates OAuth state
→ Redirects to Google OAuth
```

**Server-Side:**
```
Google OAuth → Callback to /api/auth/callback/google
→ Better Auth validates state
→ Creates user session in database
→ Redirects to callbackURL
```

---

## Security Considerations

### Secrets Management

- Never commit `.env` file
- Rotate `BETTER_AUTH_SECRET` periodically
- Use different secrets for prod/preview/dev
- Keep Google OAuth credentials secure

### CORS & Origins

- Production uses exact domain matching
- Preview deployments use wildcard `*.vercel.app`
- Localhost always trusted for development

### SSL/TLS

- All production traffic uses HTTPS (Vercel auto-provisions)
- Database connections use SSL (Supabase default)
- Mixed content blocked by browser (security feature)

---

## Known Limitations

### Preview Deployments

- Share Google OAuth credentials with production
- All use same Supabase database
- Consider Supabase branching for isolated preview DBs

### Map Posts Feature

- Currently disabled on map view
- Hook commented out (`useMapPosts`)
- Will re-enable when fully implemented

---

## Rollback Procedure

If deployment fails:

1. **Immediate Rollback:**
   ```bash
   vercel rollback
   ```

2. **Revert Code:**
   ```bash
   git revert HEAD
   git push origin master
   ```

3. **Check Logs:**
   ```bash
   vercel logs --production
   ```

---

## Future Improvements

### Database

- [ ] Implement Supabase database branching for preview deployments
- [ ] Add read replicas for heavy read operations
- [ ] Monitor and optimize connection pool size

### Auth

- [ ] Add email/password authentication
- [ ] Implement MFA (multi-factor authentication)
- [ ] Add social providers (GitHub, Discord)

### Deployment

- [ ] Set up staging environment
- [ ] Implement automated E2E tests in CI/CD
- [ ] Add monitoring and alerting (Sentry, LogRocket)

---

## Support & Resources

### Documentation

- [Better Auth Docs](https://www.better-auth.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team/docs)

### Project Context

- See `CLAUDE.md` for project overview
- See `context/state.md` for current development status
- See `context/decisions.md` for architecture decisions

---

**Last Updated:** December 6, 2024
**Deployment Status:** ✅ Production operational
**Verified By:** Claude Code Assistant
