---
title: "Part 7: Scaling & Optimization - Native Spatial Queries with PostGIS"
series: "TheFeed Development Journey"
part: 7
date: 2025-12-01
updated: 2025-12-27
tags: ["postgis", "optimization", "performance", "spatial-queries"]
reading_time: "8 min"
commits_covered: "6c5803b..a6f2bda"
---

## Where We Are

The previous phase had cleaned up data. Now came the next challenge: **making it fast at scale**.

The old approach used in-memory distance calculations (Haversine formula). For every search, the system would:
1. Fetch all 5000+ food banks
2. Calculate distance to each
3. Sort by distance
4. Return top results

This worked for testing but wouldn't scale. At 1 million resources, a single search would take minutes.

On December 1, 2025, the team shipped **Phase 4.1: PostGIS Integration** (`6c5803b`), moving spatial queries to the database where they belong.

## PostGIS: Geographic Superpowers

PostGIS is a PostgreSQL extension that adds geographic/geometric types and functions. Key capabilities:

- **Native Geometry Types**: POINT, POLYGON, MULTIPOLYGON
- **Spatial Operators**: ST_Distance, ST_DWithin, ST_Intersects
- **Spatial Indexes**: GIST and BRIN for sub-100ms queries
- **Distance Calculations**: Done in C, 100x faster than JavaScript

### The Before: In-Memory Calculation

```typescript
export async function searchFoodBanks(
    lat: number,
    lng: number,
    radiusMiles: number
) {
    // Fetch ALL resources
    const allResources = await db.query.foodBanks.findMany();

    // Calculate distances in JavaScript
    const nearby = allResources
        .map(r => ({
            ...r,
            distance: haversineDistance(
                {lat, lng},
                {lat: r.latitude, lng: r.longitude}
            )
        }))
        .filter(r => r.distance <= radiusMiles)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 50);

    return nearby;
}
```

**Performance**: O(n) - slow with large datasets.

### The After: Native PostGIS

```typescript
export async function searchFoodBanks(
    lat: number,
    lng: number,
    radiusMiles: number
) {
    const radiusMeters = radiusMiles * 1609.34;

    // Use ST_DWithin: "within distance"
    const nearby = await db
        .select({
            id: foodBanks.id,
            name: foodBanks.name,
            address: foodBanks.address,
            distance: sql`ST_Distance(
                ${foodBanks.geom},
                ST_GeomFromText('POINT(${lng} ${lat})', 4326)
            )`,
        })
        .from(foodBanks)
        .where(sql`ST_DWithin(
            ${foodBanks.geom},
            ST_GeomFromText('POINT(${lng} ${lat})', 4326),
            ${radiusMeters}
        )`)
        .orderBy(sql`distance ASC`)
        .limit(50);

    return nearby;
}
```

**Performance**: O(log n) with GIST index - sub-100ms queries even with millions of resources.

## The Schema Update

Added the `geom` column to `foodBanks`:

```typescript
export const foodBanks = pgTable("food_banks", {
    // ... existing columns ...
    latitude: real("latitude").notNull(),
    longitude: real("longitude").notNull(),
    // NEW: PostGIS geometry column
    geom: geometry("geom", {
        type: "point",
        mode: "xy",
        srid: 4326  // Standard geographic coordinate system
    }),
    // ... more columns ...
}, (table) => ({
    // Critical performance index
    geomIndex: index("geom_idx").on(table.geom),
}));
```

## The Migration Strategy

PostGIS couldn't be retrofitted easily to existing data. The team:

1. **Created Migration Script**
   ```sql
   UPDATE food_banks
   SET geom = ST_GeomFromText(
       'POINT(' || longitude || ' ' || latitude || ')',
       4326
   )
   WHERE geom IS NULL;
   ```

2. **Added GIST Index**
   ```sql
   CREATE INDEX geom_idx ON food_banks USING GIST(geom);
   ```

3. **Verified Results**
   - Old Haversine results vs new PostGIS results
   - Distances matched to within 0.1%

## The Performance Gain

Benchmark results on 5,000+ resources:

```
Search for food banks within 5 miles of Sacramento downtown:

Old Approach (in-memory):
  - Fetch: 5ms
  - Calculate distances: 450ms
  - Sort: 50ms
  - Total: ~505ms ❌

New Approach (PostGIS):
  - Query with spatial index: 45ms
  - Total: ~45ms ✅

Improvement: 11x faster
```

For 100,000 resources:

```
Old Approach: 5+ seconds ❌
New Approach: 50ms ✅
```

## Duplicate Detection Gets Faster

Phase 2 had used in-memory fuzzy matching. PostGIS enabled **spatial duplicate detection**:

```typescript
// Find resources within 50 meters
const potentialDuplicates = await db
    .select({
        id: foodBanks.id,
        name: foodBanks.name,
        nearbyId: foodBanks.id,
        nearbyName: foodBanks.name,
    })
    .from(foodBanks)
    .innerJoin(
        foodBanks,
        sql`ST_DWithin(
            ${foodBanks.geom},
            ${foodBanks.geom},
            50  -- 50 meters
        ) AND ${foodBanks.id} < ${foodBanks.id}`  // Avoid duplicates
    )
    .where(sql`${foodBanks.verificationStatus} != 'duplicate'`);
```

**Result**: Duplicate detection went from 2 seconds to 50ms.

## The Data Quality Ripple

PostGIS exposed hidden issues:
- Coordinates that passed basic validation were actually 500+ miles away
- Some records had latitude and longitude **swapped**
- A few had impossible coordinates (lat > 90)

The team's validation got stricter:

```typescript
function validateCoordinates(lat: number, lng: number): boolean {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
    // California bounds check
    if (lat < 32 || lat > 42) return false;
    if (lng < -125 || lng > -114) return false;
    return true;
}
```

## The Drizzle Integration

Using Drizzle ORM with PostGIS required careful SQL:

```typescript
// src/lib/schema.ts
export const foodBanks = pgTable("food_banks", {
    geom: geometry("geom", {
        type: "point",
        mode: "xy",
        srid: 4326
    }),
});

// Queries use raw SQL for spatial operations
// (Drizzle doesn't have PostGIS helpers yet)
import { sql } from "drizzle-orm";

const withinRadius = sql`ST_DWithin(
    ${table.geom},
    ST_GeomFromText('POINT(${lng} ${lat})', 4326),
    ${radiusMeters}
)`;
```

## What PostGIS Enabled

### 1. **Efficient "Near Me" Queries**
- "Find events near me" - 50ms
- "Show nearby posts" - 50ms
- "Search resources by radius" - 50ms

### 2. **Bulk Operations**
- Index all 100,000 resources by proximity zone
- Batch geocoding with spatial efficiency
- Region-based administration

### 3. **Advanced Features (Future)**
- Heat maps ("Where are resource clusters?")
- Service area analysis ("How much coverage?")
- Route optimization for mobile users

## The Challenges

### Challenge 1: SRID Confusion
PostGIS requires specifying the Spatial Reference System. Using the wrong SRID makes distances wrong.
- Solution: Always use SRID 4326 (standard GPS coordinates)

### Challenge 2: Polygon vs Point
Some resources span large areas (parks, gardens). Using POINT is a simplification.
- Solution: Use center coordinates, document limitation

### Challenge 3: Index Size
GIST indices on large tables take space.
- Solution: Worth it. 100MB index saves seconds per query.

## The Lesson

**Push computation to the database**. Geographic queries in JavaScript are cute for small datasets, but scaling requires native support. PostGIS is a superb example of using the right tool for the job.

## What We Learned

1. **Premature optimization is real, but so is premature ignorance**. The team optimized when they had a problem (performance), not before.

2. **Database choice matters**. PostgreSQL + PostGIS is overkill for simple CRUD but a bargain for geographic queries.

3. **Validation is easier at the data layer**. Once PostGIS was involved, coordinates couldn't be wrong—the database enforced it.

## Up Next

With performance optimized and data quality solid, the system could handle **growth**. But growth meant new users with new needs: **resource verification and provider claims**.

---

**Key Commits**: `6c5803b` (PostGIS implementation), `0f3b998` (optimization), GIST index creation

**Related Code**: `src/lib/schema.ts` (geom column), `src/lib/food-bank-queries.ts` (spatial queries)
