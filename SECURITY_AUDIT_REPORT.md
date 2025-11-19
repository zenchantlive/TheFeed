# Security Audit Report: TheFeed

**Audit Date**: 2025-11-19
**Auditor**: Claude Code Security Audit
**Application**: TheFeed - Hyperlocal Food-Sharing Network
**Target Platform**: Vercel

---

## Executive Summary

**Total vulnerabilities found: 17**
- **Critical**: 3
- **High**: 6
- **Medium**: 5
- **Low**: 3

**Overall Security Posture**: **At Risk**

Multiple critical and high-severity vulnerabilities must be addressed before production deployment to Vercel.

---

## Critical Findings

### CRITICAL-1: Unauthenticated Diagnostics Endpoint Exposes System Information

**Category**: Information Disclosure
**Location**: `src/app/api/diagnostics/route.ts:30`
**Description**: The `/api/diagnostics` endpoint is publicly accessible without authentication and exposes whether environment variables are configured (POSTGRES_URL, secrets, API keys).

**Impact**: Attackers can fingerprint your application's infrastructure, determine which services are configured, and use this information for targeted attacks.

**Remediation**:
```typescript
// src/app/api/diagnostics/route.ts
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ... rest of diagnostics code
}
```

**Priority**: **Immediate**

---

### CRITICAL-2: CopilotKit Endpoint Missing Authentication

**Category**: Authentication
**Location**: `src/app/api/copilotkit/route.ts:37`
**Description**: The `/api/copilotkit` POST handler doesn't require authentication. While it attempts to get the session, it doesn't return early if no session exists.

**Impact**: Unauthenticated users can interact with the AI system, potentially incurring costs, accessing data through tools, or abusing the service.

**Remediation**:
```typescript
// src/app/api/copilotkit/route.ts:37
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ... rest of handler
}
```

**Priority**: **Immediate**

---

### CRITICAL-3: High-Severity Dependency Vulnerabilities (expr-eval)

**Category**: Dependencies
**Location**: `package.json` → `@copilotkit/runtime` → `@langchain/community` → `expr-eval`
**Description**: Two high-severity vulnerabilities in `expr-eval` package:
- Arbitrary code execution
- Polynomial ReDoS

**Impact**: Remote code execution or denial of service through crafted input.

**Remediation**:
```bash
# Check if newer version of @copilotkit/runtime fixes this
pnpm update @copilotkit/runtime

# If transitive dependency, add resolution in package.json
{
  "pnpm": {
    "overrides": {
      "expr-eval": ">=2.0.2"
    }
  }
}
```

**Priority**: **Immediate**

---

## High Severity Findings

### HIGH-1: No Rate Limiting on API Routes

**Category**: API Security
**Location**: All files in `src/app/api/`
**Description**: No rate limiting is implemented on any API endpoint.

**Impact**: Vulnerable to brute force attacks, API abuse, resource exhaustion, and DoS attacks.

**Remediation**:
```typescript
// Option 1: Vercel Edge Config
// vercel.json
{
  "functions": {
    "src/app/api/**/*": {
      "rateLimit": {
        "limit": 100,
        "window": "1m"
      }
    }
  }
}

// Option 2: In-app rate limiting with Upstash
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});
```

**Priority**: **High**

---

### HIGH-2: No CSRF Protection

**Category**: CSRF
**Location**: All state-changing API routes
**Description**: No CSRF token validation on POST/PATCH/DELETE endpoints.

**Impact**: Attackers can trick authenticated users into performing unintended actions.

**Remediation**:
```typescript
// Verify Better Auth CSRF is enabled (default)
export const auth = betterAuth({
  advanced: {
    disableCsrfCheck: false,
  },
});

// For custom routes, verify same-origin
const origin = req.headers.get("origin");
const host = req.headers.get("host");
if (origin && !origin.endsWith(host || "")) {
  return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
}
```

**Priority**: **High**

---

### HIGH-3: No Security Headers Configured

**Category**: Headers
**Location**: `next.config.ts`
**Description**: No security headers configured. Missing CSP, X-Frame-Options, HSTS, etc.

**Impact**: Vulnerable to clickjacking, XSS, MIME sniffing, and information leakage.

**Remediation**:
```typescript
// next.config.ts
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' *.mapbox.com; ..." }
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};
```

**Priority**: **High**

---

### HIGH-4: Next.js SSRF Vulnerability

**Category**: Dependencies
**Location**: `package.json` → `next@15.4.6`
**Description**: The installed Next.js version has a moderate SSRF vulnerability.

**Remediation**:
```bash
pnpm update next@^15.4.7
```

**Priority**: **High**

---

### HIGH-5: Type Casting Environment Variables Without Validation

**Category**: Configuration
**Location**: `src/lib/auth.ts:10-11`
**Description**: Environment variables are cast with `as string` without validation.

**Remediation**:
```typescript
import { z } from "zod";

const envSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
});

const env = envSchema.parse({
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
});
```

**Priority**: **High**

---

### HIGH-6: Missing Next.js Middleware for Route Protection

**Category**: Authentication
**Location**: No `src/middleware.ts` file exists
**Description**: No centralized route protection at the edge.

**Remediation**: Create `src/middleware.ts` with authentication checks for protected routes.

**Priority**: **High**

---

## Medium Severity Findings

### MEDIUM-1: Better Auth Missing Explicit Cookie Configuration

**Location**: `src/lib/auth.ts`

```typescript
export const auth = betterAuth({
  advanced: {
    cookiePrefix: "thefeed",
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});
```

---

### MEDIUM-2: Error Messages May Leak Information

**Location**: Multiple API routes

Ensure error handlers return generic messages to clients while logging details server-side.

---

### MEDIUM-3: PrismJS DOM Clobbering Vulnerability

**Location**: Transitive dependency

```json
{
  "pnpm": {
    "overrides": {
      "prismjs": ">=1.30.0"
    }
  }
}
```

---

### MEDIUM-4: js-yaml Prototype Pollution

**Location**: `@eslint/eslintrc` → `js-yaml`

```bash
pnpm update @eslint/eslintrc
```

---

### MEDIUM-5: No Input Length Validation in CopilotKit Actions

**Location**: `src/app/api/copilotkit/route.ts`

Add length validation to all action handlers.

---

## Low Severity Findings

### LOW-1: Source Maps May Be Generated in Production

```typescript
const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
};
```

---

### LOW-2: esbuild Development Server CORS Issue

Development only - consider updating drizzle-kit.

---

### LOW-3: No Subresource Integrity for External Resources

Consider adding SRI for Mapbox resources.

---

## Security Checklist Summary

| Category | Status | Count |
|----------|--------|-------|
| ✅ Passed | Authentication, ORM, .gitignore, React XSS protection | 8 |
| ❌ Failed | Rate limiting, CSRF, Headers, Middleware, Diagnostics | 10 |
| ⚠️ Warning | Some validation gaps | 2 |

---

## Pre-Deployment Checklist

### Critical (Must Fix)
- [ ] Protect `/api/diagnostics` endpoint with authentication
- [ ] Add authentication check to `/api/copilotkit` endpoint
- [ ] Update Next.js to 15.4.7+ to fix SSRF vulnerability

### High Priority
- [ ] Add security headers to `next.config.ts`
- [ ] Create `middleware.ts` for centralized route protection
- [ ] Implement rate limiting on all API routes
- [ ] Address expr-eval dependency vulnerabilities

### Medium Priority
- [ ] Configure Better Auth cookie settings explicitly
- [ ] Add environment variable validation with Zod
- [ ] Override vulnerable transitive dependencies

---

## Confidence Assessment

**Overall Confidence**: **High**

- Complete examination of all 13 API routes
- Full review of authentication system
- Dependency vulnerability scan completed
- Configuration files reviewed

**Limitations**:
- Cannot verify actual cookie behavior without runtime testing
- Cannot test rate limiting requirements without load testing
- Vercel-specific deployment settings not available

---

## Next Steps

1. Address all **CRITICAL** issues before any deployment
2. Fix **HIGH** severity issues before production deployment
3. Plan remediation of **MEDIUM** issues within 30 days
4. Schedule **LOW** priority items for future sprints
5. Re-run security audit after remediations are complete
