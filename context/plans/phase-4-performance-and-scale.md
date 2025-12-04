## PHASE 4: PERFORMANCE & SCALE (Week 7-8)

**Goal:** Optimize for 50K+ resources
**Success Metrics:**
- Map loads in <1s with 10K resources
- Duplicate detection <100ms per resource
- Admin dashboard supports 100+ resources/page

### Tasks

#### 4.1 PostGIS Spatial Queries

**Install PostGIS extension:**
```sql
-- Run in Supabase SQL editor
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geometry column
ALTER TABLE food_banks
ADD COLUMN geom GEOMETRY(Point, 4326);

-- Populate from existing lat/lng
UPDATE food_banks
SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE latitude != 0 AND longitude != 0;

-- Create spatial index
CREATE INDEX idx_foodbanks_geom ON food_banks USING GIST(geom);
```

**Update duplicate detection:**
```typescript
// File: /src/lib/discovery/duplicate-detector.ts
export async function detectDuplicatesPostGIS(
  resource: {
    latitude: number;
    longitude: number;
    name: string;
  }
): Promise<DuplicateScore[]> {
  const SEARCH_RADIUS_METERS = 200;

  // Use PostGIS ST_DWithin for geo queries (100x faster than bounding box)
  const nearby = await db.execute(sql`
    SELECT
      id,
      name,
      address,
      ST_Distance(
        geom::geography,
        ST_SetSRID(ST_MakePoint(${resource.longitude}, ${resource.latitude}), 4326)::geography
      ) as distance_meters
    FROM food_banks
    WHERE ST_DWithin(
      geom::geography,
      ST_SetSRID(ST_MakePoint(${resource.longitude}, ${resource.latitude}), 4326)::geography,
      ${SEARCH_RADIUS_METERS}
    )
    AND id != ${resource.id}
    ORDER BY distance_meters
    LIMIT 10
  `);

  // Score based on distance + name similarity
  return nearby.rows.map(row => {
    const nameSim = calculateStringSimilarity(resource.name, row.name);
    const distanceScore = (SEARCH_RADIUS_METERS - row.distance_meters) / SEARCH_RADIUS_METERS;

    const score = (nameSim * 60) + (distanceScore * 40);

    return {
      score,
      factors: {
        nameSimilarity: nameSim * 100,
        distanceMeters: row.distance_meters,
        // ...
      },
      confidence: score > 80 ? "high" : score > 50 ? "medium" : "low",
      matchedResource: {
        id: row.id,
        name: row.name,
        address: row.address
      }
    };
  });
}
```

**Acceptance Criteria:**
- [x] PostGIS extension enabled
- [x] Geo queries use ST_DWithin
- [x] Duplicate detection <100ms (was 2s)
- [x] Map "nearby resources" query <50ms

---

#### 4.2 Redis Caching Layer

**Install:**
```bash
bun add @upstash/redis
```

**Setup Upstash Redis:**
1. Create account at upstash.com
2. Create Redis database
3. Add env vars to `.env`:
   ```
   UPSTASH_REDIS_REST_URL=https://...
   UPSTASH_REDIS_REST_TOKEN=...
   ```

**Implement caching:**
```typescript
// File: /src/lib/cache.ts
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    return await redis.get<T>(key);
  } catch (error) {
    console.error("Cache get error:", error);
    return null;
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds = 300 // 5 minutes default
): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, value);
  } catch (error) {
    console.error("Cache set error:", error);
  }
}

export async function cacheInvalidate(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error("Cache invalidate error:", error);
  }
}
```

**Cache resource feed:**
```typescript
// File: /src/lib/resource-feed.ts
import { cacheGet, cacheSet, cacheInvalidate } from "./cache";

export async function getNormalizedResources(
  options: FeedOptions = {}
): Promise<NormalizedResource[]> {
  const cacheKey = `resources:${JSON.stringify(options)}`;

  // Try cache first
  const cached = await cacheGet<NormalizedResource[]>(cacheKey);
  if (cached) {
    console.log("Cache HIT:", cacheKey);
    return cached;
  }

  console.log("Cache MISS:", cacheKey);

  // ... existing query logic ...

  // Cache for 5 minutes
  await cacheSet(cacheKey, rows, 300);

  return rows;
}

// Invalidate on updates
export async function invalidateResourceCache(resourceId?: string) {
  if (resourceId) {
    await cacheInvalidate(`resources:*`);
  } else {
    await cacheInvalidate("resources:*");
  }
}
```

**Update routes to invalidate:**
```typescript
// In /src/app/api/admin/resources/[id]/route.ts
import { invalidateResourceCache } from "@/lib/resource-feed";

export const PUT = async (req: NextRequest, { params }: RouteContext) => {
  // ... update logic ...

  // Invalidate cache
  await invalidateResourceCache(id);

  return NextResponse.json({ resource: updatedRecord });
};
```

**Acceptance Criteria:**
- [ ] Resource feed cached for 5 minutes
- [ ] Cache invalidated on resource updates
- [ ] Cache hit rate >80%
- [ ] Map loads in <500ms (cached)

---

#### 4.3 Pagination Everywhere

**Update resource feed:**
```typescript
// File: /src/lib/resource-feed.ts
export type FeedOptions = {
  limit?: number;
  offset?: number;
  cursor?: string; // For cursor-based pagination
  includeStatuses?: string[];
  excludeRejected?: boolean;
};

export async function getNormalizedResources(
  options: FeedOptions = {}
): Promise<{
  resources: NormalizedResource[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}> {
  const limit = Math.min(options.limit || 100, 100); // Max 100
  const offset = options.offset || 0;

  // ... caching and query logic ...

  // Get total count
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(foodBanks)
    .where(whereClause);

  const total = Number(countResult?.count || 0);

  return {
    resources: rows,
    pagination: {
      limit,
      offset,
      total,
      hasMore: offset + limit < total
    }
  };
}
```

**Update map to lazy load:**
```tsx
// File: /src/app/map/pageClient.tsx
"use client";

import { useState, useEffect } from "react";

export default function MapClient({ initialResources }: { initialResources: any[] }) {
  const [resources, setResources] = useState(initialResources);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(100);

  const loadMore = async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    const response = await fetch(`/api/locations?limit=100&offset=${offset}`);
    const data = await response.json();

    setResources(prev => [...prev, ...data.resources]);
    setHasMore(data.pagination.hasMore);
    setOffset(prev => prev + 100);
    setIsLoading(false);
  };

  return (
    <div>
      <MapView resources={resources} />

      {hasMore && (
        <Button onClick={loadMore} disabled={isLoading}>
          {isLoading ? "Loading..." : "Load More Resources"}
        </Button>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] All list endpoints support limit/offset
- [ ] Max page size enforced (100)
- [ ] Total count returned for pagination UI
- [ ] Infinite scroll works on mobile

---

#### 4.4 Batch Operations Optimization

**Current issue:** Batch enhancement processes sequentially

**Optimize:**
```typescript
// File: /src/app/admin/verification/page-client.tsx
const handleBatchEnhance = async () => {
  if (selectedIds.length === 0) return;
  setIsQueueProcessing(true);

  const CONCURRENCY = 3; // Process 3 at a time instead of 1

  for (let i = 0; i < selectedIds.length; i += CONCURRENCY) {
    const chunk = selectedIds.slice(i, i + CONCURRENCY);

    // Process chunk in parallel
    await Promise.allSettled(
      chunk.map(async (id) => {
        try {
          const response = await fetch(`/api/admin/resources/${id}/enhance`, {
            method: "POST",
          });
          if (!response.ok) throw new Error("Failed");
          const proposal = await response.json();
          setEnhancementQueue((prev) => ({ ...prev, [id]: proposal }));
        } catch {
          setEnhancementQueue((prev) => ({ ...prev, [id]: "error" }));
        }
      })
    );

    // Update progress
    setProgress(Math.floor(((i + CONCURRENCY) / selectedIds.length) * 100));
  }

  setIsQueueProcessing(false);
};
```

**Acceptance Criteria:**
- [ ] Batch enhancement processes 3 resources in parallel
- [ ] Progress bar updates smoothly
- [ ] Errors don't block other resources
- [ ] 10 resources enhanced in <30s (was 3 min)

---

### Phase 4 Deliverables Checklist

- [x] **4.1** PostGIS queries implemented
- [ ] **4.2** Redis caching active - IMPORTANT user decided against this
- [ ] **4.3** Pagination enforced everywhere
- [ ] **4.4** Batch operations optimized
- [ ] Load testing with 50K resources completed
- [ ] Performance regression tests added
- [ ] Monitoring dashboards created

**Estimated Effort:** 14-18 hours
**Required Skills:** SQL, PostGIS, caching strategies, performance tuning

---

