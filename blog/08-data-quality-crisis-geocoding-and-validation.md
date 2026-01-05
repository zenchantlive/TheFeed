---
title: "Part 8: Data Quality Crisis - Geocoding, Duplicates, and Validation"
series: "TheFeed Development Journey"
part: 8
date: 2025-11-18
updated: 2025-12-27
tags: [data-quality, geocoding, validation, ai, automation]
reading_time: "14 min"
commits_covered: "Phase 1 & 2"
---

## The Null Island Problem

Manual seeding worked for Sacramento's 20 food banks. But to scale, I needed **automated discovery** - scraping web sources, using AI to extract structured data, and inserting into the database.

The first automated scan ran. It found 500+ food banks. Success!

Then I looked at the map.

**Half the markers were at coordinates (0, 0)** - a point in the ocean off the coast of Africa, colloquially known as "Null Island."

The geocoding had failed silently.

## Phase 1: Critical Fixes

This began a 2-week crisis mode sprint documented in `docs/archive/phase-1-critical-fixes.md`.

### Fix 1: Geocoding Failure Handling

The original discovery pipeline:

```typescript
// BAD: Returns (0,0) on failure
if (lat === 0 && lng === 0) {
  const coords = await geocodeAddress(...);
  if (coords) {
    return { ...res, latitude: coords.latitude, longitude: coords.longitude };
  }
  return res; // ❌ Returns with lat=0, lng=0
}
```

The fix:

```typescript
// GOOD: Skips invalid resources
async function processBatchResults(rawResults: TavilySearchResult[]) {
  const results: DiscoveryResult[] = [];
  const failures: FailureLog[] = [];

  for (const result of rawResults) {
    let coords = extractCoords(result);

    // Validate coordinates
    if (!coords || coords.latitude === 0 || coords.longitude === 0) {
      // Try geocoding
      coords = await geocodeAddress(result.address, result.city, result.state);

      if (!coords || coords.latitude === 0 || coords.longitude === 0) {
        // Log and skip
        failures.push({
          resource: result.name,
          reason: "Geocoding failed or returned invalid coordinates",
        });
        continue; // Skip this resource
      }
    }

    results.push({ ...result, ...coords });
  }

  if (failures.length > 0) {
    console.warn(`[Geocoding] Failed: ${failures.length} resources`, failures);
  }

  return results;
}
```

**Key change**: **Skip** resources with invalid coordinates instead of inserting bad data.

### Fix 2: Enhancement API Schema Error

The admin enhancement API used `generateText()` but OpenRouter expected structured output:

```typescript
// BEFORE: Schema error
const { text } = await generateText({
  model: openrouter(model),
  prompt: `Enhance this food bank...`,
});

const parsed = JSON.parse(text); // Brittle
```

The fix: Use `generateObject()` with Zod:

```typescript
// AFTER: Type-safe structured output
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
  prompt: `Enhance this food bank data...`,
  temperature: 0.3,
});

return {
  proposed: object.updates,
  summary: object.summary,
  confidence: object.confidence,
  sources: object.sources,
};
```

This eliminated JSON parsing errors and provided **type safety**.

### Fix 3: Resource Feed Pagination

The feed query had broken filter logic:

```typescript
// BUG: Always returns undefined, loading everything
const whereClause = options.includeStatuses
  ? undefined  // ❌ Ignores includeStatuses
  : notInArray(foodBanks.verificationStatus, excludedStatuses);
```

The fix:

```typescript
let query = db
  .select()
  .from(foodBanks)
  .limit(limit)
  .offset(offset);

if (includeStatuses && includeStatuses.length > 0) {
  query = query.where(inArray(foodBanks.verificationStatus, includeStatuses));
} else if (excludeRejected) {
  query = query.where(notInArray(foodBanks.verificationStatus, excludedStatuses));
}

const rows = await query;
```

Now filters worked correctly, and pagination was enforced.

### Fix 4: Database Indices

With 500+ food banks, queries were **slow**. Missing indices:

```sql
-- Before: Full table scans
SELECT * FROM food_banks WHERE latitude BETWEEN ... AND ...;
-- 2-3 seconds with 500 rows

-- After: Indices added
CREATE INDEX idx_food_banks_coords ON food_banks(latitude, longitude);
CREATE INDEX idx_food_banks_status ON food_banks(verification_status);
CREATE INDEX idx_food_banks_created ON food_banks(created_at DESC);

-- Query time: 20-50ms (100x improvement)
```

Simple but **crucial** for performance.

## Phase 2: Data Integrity

With critical bugs fixed, I tackled **data quality**.

### Confidence Scoring

Not all data sources are equal. I built a 0-100 confidence scoring system:

```typescript
// src/lib/admin-queries.ts
export function calculateConfidenceScore(resource: {
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  hours: any;
  description: string | null;
  services: string[] | null;
  latitude: number;
  longitude: number;
}) {
  let score = 0;

  // Base fields (40 points)
  if (resource.name) score += 10;
  if (resource.address) score += 10;
  if (resource.latitude !== 0 && resource.longitude !== 0) score += 20;

  // Contact info (20 points)
  if (resource.phone) score += 10;
  if (resource.website) score += 10;

  // Rich data (40 points)
  if (resource.hours) score += 15;
  if (resource.description) score += 10;
  if (resource.services && resource.services.length > 0) score += 15;

  return Math.min(score, 100);
}
```

This let admins **prioritize** low-confidence resources for manual review.

### Duplicate Detection

Automated discovery often found the same food bank multiple times:

```typescript
// src/lib/duplicate-guard.ts
export async function detectDuplicates(candidate: {
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
}) {
  const existing = await db.select().from(foodBanks);

  const duplicates = existing.filter((resource) => {
    // Exact address match (hard duplicate)
    if (
      resource.address?.toLowerCase() === candidate.address.toLowerCase() &&
      resource.city?.toLowerCase() === candidate.city.toLowerCase()
    ) {
      return { type: "hard", confidence: 1.0, resource };
    }

    // Name similarity + distance (soft duplicate)
    const nameSimilarity = levenshtein(
      resource.name.toLowerCase(),
      candidate.name.toLowerCase()
    ) / Math.max(resource.name.length, candidate.name.length);

    const distance = calculateDistance(
      resource.latitude,
      resource.longitude,
      candidate.latitude,
      candidate.longitude
    );

    if (nameSimilarity > 0.8 && distance < 0.1) {
      return { type: "soft", confidence: nameSimilarity, resource };
    }

    return null;
  }).filter(Boolean);

  return duplicates;
}
```

**Hard duplicates** (exact address) were rejected. **Soft duplicates** (fuzzy match) were flagged for admin review.

### Phone & Website Validation

LLMs extract data, but it's often malformed:

```typescript
// src/lib/validators.ts
import { parsePhoneNumber } from 'libphonenumber-js';

export function validatePhone(phone: string): boolean {
  try {
    const parsed = parsePhoneNumber(phone, 'US');
    return parsed.isValid();
  } catch {
    return false;
  }
}

export function validateWebsite(url: string): boolean {
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
}
```

Invalid phone numbers and URLs were rejected during insertion.

### Data Versioning

To track changes, I added audit logging:

```sql
CREATE TABLE data_versions (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL REFERENCES food_banks(id),
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by TEXT REFERENCES user(id),
  change_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_versions_resource ON data_versions(resource_id, created_at DESC);
```

Now every edit was traceable - critical for community-sourced data.

## The Admin Dashboard

Managing 500+ resources required tooling:

```tsx
// src/app/admin/page.tsx
export default async function AdminDashboard() {
  const stats = await db
    .select({
      total: count(),
      verified: countIf(eq(foodBanks.verificationStatus, 'official')),
      pending: countIf(eq(foodBanks.verificationStatus, 'pending')),
      rejected: countIf(eq(foodBanks.verificationStatus, 'rejected')),
      missingPhone: countIf(isNull(foodBanks.phone)),
      missingWebsite: countIf(isNull(foodBanks.website)),
      missingHours: countIf(isNull(foodBanks.hours)),
      lowConfidence: countIf(lt(foodBanks.confidenceScore, 50)),
    })
    .from(foodBanks);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard label="Total Resources" value={stats.total} />
        <StatsCard label="Verified" value={stats.verified} />
        <StatsCard label="Pending Review" value={stats.pending} />
        <StatsCard label="Low Confidence" value={stats.lowConfidence} />
      </div>

      <ResourceQueue />
    </div>
  );
}
```

The queue showed resources needing attention, sorted by confidence score.

## What Went Right

1. **Skip Invalid Data**: Better to have fewer, accurate resources than many bad ones

2. **Confidence Scoring**: Prioritizing low-confidence resources saved hours

3. **Duplicate Detection**: Prevented database bloat

4. **Validation**: libphonenumber-js caught malformed data

5. **Audit Trail**: Data versioning enabled accountability

## What I'd Do Differently

**Mistake 1: No Retry Logic**

Geocoding failures were sometimes transient (API timeouts). Retry with exponential backoff would have recovered more resources.

**Mistake 2: No Caching**

Geocoding the same city 100 times was wasteful. A simple cache would have saved API calls and time.

**Mistake 3: Late Indexing**

Adding indices after performance problems was painful. Should have added them upfront based on expected query patterns.

## What I Learned

1. **Data Quality > Quantity**: 100 accurate resources beat 1000 questionable ones

2. **Geocoding Is Hard**: LLMs are terrible at coordinates; always validate

3. **Indices Matter**: 100x speedup from a single `CREATE INDEX`

4. **Duplicate Detection Is Non-Trivial**: Fuzzy matching + distance heuristics work but aren't perfect

5. **Audit Trails Are Essential**: Community-sourced data needs accountability

## Up Next

In Part 9, I'll cover trust and verification - building user confidence with verification badges, source attribution, and transparency features.

---
**Key Commits**: Phase 1 & 2 completion (multiple commits)

**Related Files**:
- `docs/archive/phase-1-critical-fixes.md` - Phase 1 plan
- `docs/archive/phase-2-data-integrity.md` - Phase 2 plan
- `src/lib/duplicate-guard.ts` - Duplicate detection
- `src/lib/validators.ts` - Phone/website validation
