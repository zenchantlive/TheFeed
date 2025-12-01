# Phase 1: Critical Fixes

**Timeline:** Week 1-2  
**Effort:** 10-12 hours  
**Priority:** URGENT  
**Dependencies:** None

---

## Goal

Fix production-blocking bugs and prevent data corruption

## Success Metrics

- Enhancement API functional
- Zero (0,0) coordinate insertions
- All queries properly paginated

---

## Tasks

### 1.1 Fix Enhancement API Schema Error

**File:** `/src/lib/admin-enhancer.ts`

**Current Issue:**
```
Error [AI_APICallError]: Invalid schema for response_format 'response'
```

**Root Cause:** Using `generateText` but OpenRouter expects schema for structured output

**Solution Options:**

**Option A (Recommended): Switch to generateObject**
```typescript
// Replace generateText with generateObject
const { object } = await generateObject({
  model: openrouter(model),
  schema: z.object({
    updates: z.object({
      phone: z.string().nullable().optional(),
      website: z.string().url().nullable().optional(),
      description: z.string().nullable().optional(),
      services: z.array(z.string()).nullable().optional(),
      hours: z.record(z.string(), z.object({
        open: z.string(),
        close: z.string(),
        closed: z.boolean().optional()
      }).nullable()).nullable().optional()
    }),
    summary: z.string(),
    confidence: z.number().min(0).max(1),
    sources: z.array(z.string().url())
  }),
  prompt: `...existing prompt...`,
  temperature: 0.3 // Add for consistency
});

return {
  proposed: object.updates,
  summary: object.summary,
  confidence: object.confidence,
  sources: object.sources,
  focusField
};
```

**Option B: Pure JSON parsing (fallback)**
```typescript
const { text } = await generateText({
  model: openrouter(model),
  prompt: `...existing prompt...`,
  temperature: 0.3
});

// More robust parsing
const cleaned = text
  .replace(/```json\n?/g, '')
  .replace(/\n?```/g, '')
  .trim();

let parsed;
try {
  parsed = JSON.parse(cleaned);
} catch (e) {
  // Fallback: try to extract JSON from markdown
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No valid JSON in response");
  parsed = JSON.parse(jsonMatch[0]);
}

// Validate manually
if (!parsed.updates || typeof parsed.confidence !== 'number') {
  throw new Error("Invalid response structure");
}

return {
  proposed: parsed.updates,
  summary: parsed.summary || "AI enhancement",
  confidence: parsed.confidence,
  sources: Array.isArray(parsed.sources) ? parsed.sources : [],
  focusField
};
```

**Testing:**
```bash
# Test enhancement endpoint
curl -X POST http://localhost:3000/api/admin/resources/{id}/enhance \
  -H "Cookie: better-auth.session_token={token}" \
  -H "Content-Type: application/json"

# Expected: 200 with enhancement proposal
# Actual (before fix): 500 with schema error
```

**Acceptance Criteria:**
- [ ] Enhancement API returns 200 status
- [ ] Proposal includes all fields (phone, website, hours, description, services)
- [ ] Sources array populated from Tavily results
- [ ] Confidence score between 0-1
- [ ] Admin dashboard "✨ Re-Run Analysis" button works

---

### 1.2 Fix Resource Feed Pagination Bug

**File:** `/src/lib/resource-feed.ts`

**Current Issue:**
```typescript
const whereClause = options.includeStatuses
  ? undefined  // ❌ Ignores the provided statuses, loads everything
  : notInArray(foodBanks.verificationStatus, excludedStatuses);
```

**Solution:**
```typescript
export async function getNormalizedResources(
  options: FeedOptions = {}
): Promise<NormalizedResource[]> {
  const {
    limit = 100,
    offset = 0,
    includeStatuses,
    excludeRejected = true
  } = options;

  const excludedStatuses = ["rejected", "duplicate"];

  let query = db
    .select()
    .from(foodBanks)
    .limit(limit)
    .offset(offset);

  // Fix logic
  if (includeStatuses && includeStatuses.length > 0) {
    query = query.where(inArray(foodBanks.verificationStatus, includeStatuses));
  } else if (excludeRejected) {
    query = query.where(notInArray(foodBanks.verificationStatus, excludedStatuses));
  }

  const rows = await query;

  // Don't re-normalize on every call - data is already normalized at insertion
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    address: row.address,
    city: row.city,
    state: row.state,
    zipCode: row.zipCode,
    latitude: row.latitude,
    longitude: row.longitude,
    phone: row.phone,
    website: row.website,
    description: row.description,
    services: row.services || [],
    hours: row.hours,
    verificationStatus: row.verificationStatus,
    confidenceScore: row.confidenceScore,
  }));
}
```

**Add caching layer:**
```typescript
// Install: pnpm add @upstash/redis
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const CACHE_TTL = 60 * 5; // 5 minutes

export async function getNormalizedResources(
  options: FeedOptions = {}
): Promise<NormalizedResource[]> {
  const cacheKey = `resources:${JSON.stringify(options)}`;

  // Try cache first
  const cached = await redis.get<NormalizedResource[]>(cacheKey);
  if (cached) return cached;

  // ... query logic from above ...

  // Cache result
  await redis.setex(cacheKey, CACHE_TTL, rows);

  return rows;
}

// Invalidate cache on updates
export async function invalidateResourceCache() {
  const keys = await redis.keys("resources:*");
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

**Acceptance Criteria:**
- [ ] `includeStatuses` parameter works correctly
- [ ] Pagination enforced (max 100 per query)
- [ ] Map page loads in <1s with 500 resources
- [ ] Cache invalidated on resource updates

---

### 1.3 Fix Geocoding Failure Handling

**File:** `/src/lib/discovery/tavily-search.ts`

**Current Issue (lines 130-134):**
```typescript
if (lat === 0 && lng === 0) {
  const coords = await geocodeAddress(...);
  if (coords) {
    return { ...res, latitude: coords.latitude, longitude: coords.longitude };
  }
  return res; // ❌ Returns with lat=0, lng=0 if geocoding fails
}
```

**Solution:**
```typescript
async function processBatchResults(
  rawResults: TavilySearchResult[],
  city: string,
  state: string,
  onProgress?: (update: ProgressUpdate) => void
): Promise<DiscoveryResult[]> {
  const BATCH_SIZE = 3;
  const results: DiscoveryResult[] = [];
  const geocodingFailures: { resource: DiscoveryResult; reason: string }[] = [];

  for (let i = 0; i < rawResults.length; i += BATCH_SIZE) {
    const batch = rawResults.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map(async (result) => {
        const res = await processResult(result, city, state);

        // Validate coordinates
        if (!res || res.latitude === 0 || res.longitude === 0) {
          // Try geocoding
          const coords = await geocodeAddress(res.address, res.city, res.state);

          if (!coords || coords.latitude === 0 || coords.longitude === 0) {
            // Geocoding failed - log and skip
            geocodingFailures.push({
              resource: res,
              reason: "Geocoding failed or returned invalid coordinates"
            });
            return null; // Skip this resource
          }

          return { ...res, latitude: coords.latitude, longitude: coords.longitude };
        }

        return res;
      })
    );

    // Filter out nulls (failed geocoding)
    results.push(...batchResults.filter((r): r is DiscoveryResult => r !== null));

    if (onProgress) {
      onProgress({
        phase: "geocoding",
        current: Math.min(i + BATCH_SIZE, rawResults.length),
        total: rawResults.length,
        message: `Geocoded ${results.length}/${rawResults.length} resources (${geocodingFailures.length} failures)`
      });
    }

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  // Log failures for admin review
  if (geocodingFailures.length > 0) {
    console.warn(`[Geocoding] Failed to geocode ${geocodingFailures.length} resources:`, {
      failures: geocodingFailures.map(f => ({
        name: f.resource.name,
        address: f.resource.address,
        reason: f.reason
      }))
    });
  }

  return results;
}
```

**Acceptance Criteria:**
- [ ] No resources inserted with (0,0) coordinates
- [ ] Geocoding failures logged to console/monitoring
- [ ] Failed resources skipped from insertion
- [ ] Admin notified of geocoding failures
- [ ] Retry mechanism for transient failures

---

## Phase 1 Deliverables Checklist

- [ ] **1.1** Enhancement API functional
- [ ] **1.2** Feed pagination working correctly
- [ ] **1.3** No (0,0) coordinate insertions
- [ ] All Phase 1 tests passing
- [ ] Performance baseline documented

**Estimated Effort:** 10-12 hours  
**Required Skills:** TypeScript, Next.js, API debugging

---

## Testing

```typescript
// File: /src/__tests__/phase1.test.ts
describe("Phase 1: Critical Fixes", () => {
  test("Enhancement API returns valid proposal", async () => {
    const response = await fetch("/api/admin/resources/123/enhance", {
      method: "POST",
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("proposed");
    expect(data).toHaveProperty("confidence");
    expect(data.confidence).toBeGreaterThanOrEqual(0);
    expect(data.confidence).toBeLessThanOrEqual(1);
  });

  test("Resource feed respects includeStatuses", async () => {
    const response = await fetch("/api/locations?includeStatuses=official");
    const data = await response.json();

    expect(data.resources.every((r: any) => r.verificationStatus === "official")).toBe(true);
  });

  test("Geocoding failures do not insert (0,0)", async () => {
    // Mock geocoding failure
    // Trigger discovery
    // Verify no resources with lat=0, lng=0 inserted
  });
});
```

---

## Deployment Checklist

- [ ] All tests passing locally
- [ ] TypeScript builds without errors
- [ ] Environment variables verified
- [ ] Rollback plan reviewed
- [ ] Team notified of deployment window
- [ ] Database backup created
- [ ] Monitoring alerts configured

---

## Success Metrics

| Metric | Baseline | Target |
|--------|----------|--------|
| Resources with (0,0) coords | ~5% | 0% |
| Enhancement API success rate | 0% | 100% |
| Map load time (500 resources) | 3s | 2s |
| Feed API response time | 1.5s | 800ms |
