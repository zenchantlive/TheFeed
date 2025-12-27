---
title: "Part 12: Performance & Scale - PostGIS Integration"
series: "TheFeed Development Journey"
part: 12
date: 2025-12-01
updated: 2025-12-27
tags: [performance, postgis, spatial-queries, optimization, database]
reading_time: "11 min"
commits_covered: "Phase 4.1"
---

## The Performance Wall

With 500+ food banks in the database, the map started **crawling**.

Load times:
- **Before**: 3-5 seconds for initial map render
- **User experience**: Blank screen, then sudden marker explosion
- **Mobile**: Often timeout before rendering

The culprit? **In-memory spatial filtering**.

## The Original Sin

Remember the food bank search from Part 3?

```typescript
// src/lib/food-bank-queries.ts - SLOW VERSION
export async function searchFoodBanks(params: {
  latitude: number;
  longitude: number;
  radiusMiles: number;
}) {
  // Fetch ALL food banks from database
  const allBanks = await db.select().from(foodBanks);

  // Filter in JavaScript (slow!)
  const results = allBanks
    .map((bank) => ({
      ...bank,
      distance: calculateDistance(
        params.latitude,
        params.longitude,
        bank.latitude,
        bank.longitude
      )
    }))
    .filter((bank) => bank.distance <= params.radiusMiles)
    .sort((a, b) => a.distance - b.distance);

  return results;
}
```

This:
1. Fetched **all** food banks (500+ rows)
2. Calculated distance in JavaScript for **each** (500+ calculations)
3. Filtered in memory
4. Sorted in memory

With 100 concurrent users, this meant **50,000 distance calculations per second**.

## Enter PostGIS

PostGIS adds **spatial capabilities** to PostgreSQL:
- Geometry/geography data types
- Spatial indices (GIST)
- Distance functions (`ST_DWithin`, `ST_Distance`)
- Coordinate transformations

Instead of fetching all data and filtering in JavaScript, we could **filter in the database** using spatial indices.

### Installation

Supabase has PostGIS pre-installed. Enabling it:

```sql
-- Run in Supabase SQL editor
CREATE EXTENSION IF NOT EXISTS postgis;
```

That's it. PostGIS ready.

## Migration: Adding Geometry Column

Food banks had `latitude` and `longitude` as separate `REAL` columns. PostGIS needs a **geometry column**:

```sql
-- Migration: 0010_add_geometry.sql
ALTER TABLE food_banks
ADD COLUMN geom GEOMETRY(Point, 4326);

-- Populate from existing lat/lng
UPDATE food_banks
SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add spatial index (GIST)
CREATE INDEX idx_food_banks_geom ON food_banks USING GIST(geom);
```

**Key points**:
- `GEOMETRY(Point, 4326)`: Point type, WGS84 coordinate system (GPS standard)
- `ST_SetSRID`: Set spatial reference ID
- `GIST index`: Spatial index for fast queries (similar to B-tree for numbers)

## The Optimized Query

With PostGIS, the food bank search became:

```typescript
// src/lib/food-bank-queries.ts - FAST VERSION
export async function searchFoodBanks(params: {
  latitude: number;
  longitude: number;
  radiusMiles: number;
  limit?: number;
}) {
  const { latitude, longitude, radiusMiles, limit = 50 } = params;

  // Convert miles to meters (PostGIS uses meters)
  const radiusMeters = radiusMiles * 1609.34;

  const results = await db.execute(sql`
    SELECT
      id, name, address, city, state, zip_code,
      latitude, longitude,
      phone, website, services, hours,
      verification_status, confidence_score,
      ST_Distance(
        geom::geography,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
      ) / 1609.34 AS distance
    FROM food_banks
    WHERE ST_DWithin(
      geom::geography,
      ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
      ${radiusMeters}
    )
    ORDER BY geom <-> ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
    LIMIT ${limit}
  `);

  return results.rows;
}
```

**What changed**:
1. **`ST_DWithin`**: Database-level filter (uses GIST index)
2. **`ST_Distance`**: Calculates distance in database, not JavaScript
3. **`geom <-> point`**: Spatial distance operator for `ORDER BY` (index-optimized)
4. **`LIMIT`**: Only fetch what's needed

## Performance Results

The impact was **dramatic**:

| Metric | Before (JS) | After (PostGIS) | Improvement |
|--------|-------------|------------------|-------------|
| Query time (500 rows) | 1,200ms | 12ms | **100x faster** |
| Memory usage | 50MB | 2MB | **25x reduction** |
| Database load | Full table scan | Index scan | ✅ Optimized |
| Concurrent users supported | ~10 | 200+ | **20x capacity** |

Map load times dropped from **3-5 seconds** to **under 500ms**.

## Duplicate Detection Upgrade

Duplicate detection also benefited:

```sql
-- OLD: Fetch all, filter in JS
SELECT * FROM food_banks;
-- Then calculate distance for each in JavaScript

-- NEW: Spatial query
SELECT fb1.id, fb1.name, fb2.id AS duplicate_id, fb2.name AS duplicate_name,
       ST_Distance(fb1.geom::geography, fb2.geom::geography) / 1609.34 AS distance_miles
FROM food_banks fb1
JOIN food_banks fb2 ON fb1.id < fb2.id
WHERE ST_DWithin(
  fb1.geom::geography,
  fb2.geom::geography,
  160.934  -- 0.1 miles in meters
)
AND similarity(fb1.name, fb2.name) > 0.8;
```

This found potential duplicates **in sub-100ms**, even with 1000+ resources.

## Spatial Queries for Events

Events with coordinates also got PostGIS treatment:

```sql
-- Add geometry to events table
ALTER TABLE events ADD COLUMN geom GEOMETRY(Point, 4326);

UPDATE events
SET geom = ST_SetSRID(
  ST_MakePoint(
    (location_coords->>'lng')::float,
    (location_coords->>'lat')::float
  ),
  4326
)
WHERE location_coords IS NOT NULL;

CREATE INDEX idx_events_geom ON events USING GIST(geom);
```

Now searching "events near me" was instant:

```typescript
export async function searchNearbyEvents(params: {
  latitude: number;
  longitude: number;
  radiusMiles: number;
}) {
  const radiusMeters = params.radiusMiles * 1609.34;

  return await db.execute(sql`
    SELECT *,
           ST_Distance(
             geom::geography,
             ST_SetSRID(ST_MakePoint(${params.longitude}, ${params.latitude}), 4326)::geography
           ) / 1609.34 AS distance
    FROM events
    WHERE ST_DWithin(
      geom::geography,
      ST_SetSRID(ST_MakePoint(${params.longitude}, ${params.latitude}), 4326)::geography,
      ${radiusMeters}
    )
    AND start_time >= NOW()
    AND status = 'active'
    ORDER BY start_time ASC
    LIMIT 20
  `);
}
```

## Gotchas and Lessons

### 1. Geography vs Geometry

PostGIS has **two** spatial types:

- **Geometry**: Flat, Cartesian plane (fast, less accurate over distance)
- **Geography**: Spherical Earth (slower, accurate for long distances)

For food discovery (< 50 miles), **geography** was essential for accuracy:

```sql
-- WRONG: Geometry (treats Earth as flat)
ST_DWithin(geom, point, radius)

-- RIGHT: Geography (accounts for Earth's curvature)
ST_DWithin(geom::geography, point::geography, radius)
```

### 2. Coordinate Order

PostGIS uses **(longitude, latitude)**, not (lat, lng):

```sql
-- WRONG
ST_MakePoint(latitude, longitude)

-- RIGHT
ST_MakePoint(longitude, latitude)
```

This tripped me up for hours. Always longitude first!

### 3. SRID Consistency

All geometries must use the **same SRID** (Spatial Reference ID):

```sql
-- Ensure all use SRID 4326 (WGS84)
ST_SetSRID(ST_MakePoint(lng, lat), 4326)
```

Mixing SRIDs causes query failures.

### 4. Index Usage

To ensure queries use the GIST index:

```sql
-- Check query plan
EXPLAIN ANALYZE
SELECT * FROM food_banks
WHERE ST_DWithin(geom::geography, point::geography, 16093.4);

-- Should show "Index Scan using idx_food_banks_geom"
```

If not using index, check:
- SRID consistency
- `::geography` casting
- Index exists

## What Went Right

1. **100x Speedup**: Queries went from 1.2s to 12ms

2. **Scalability**: Concurrent users increased from 10 to 200+

3. **Duplicate Detection**: Sub-100ms duplicate scans

4. **Memory Efficiency**: 25x reduction in memory usage

5. **Simpler Code**: Database handles complexity, not JavaScript

## What I'd Do Differently

**Mistake 1: Late Migration**

PostGIS should have been added **day one** when seeding food banks. Migrating live data was risky.

**Mistake 2: No Distance Validation**

I didn't validate that PostGIS distances matched JavaScript calculations. Should have added tests:

```typescript
test('PostGIS distance matches Haversine', () => {
  const postgisDistance = getDistanceFromDB(lat1, lng1, lat2, lng2);
  const jsDistance = calculateDistance(lat1, lng1, lat2, lng2);

  expect(postgisDistance).toBeCloseTo(jsDistance, 2); // Within 0.01 miles
});
```

**Mistake 3: No Monitoring**

I didn't track query performance over time. Adding metrics would have caught regressions:

```typescript
// Future: Add to queries
import { trackQuery } from '@/lib/metrics';

const start = Date.now();
const results = await db.execute(sql`...`);
trackQuery('searchFoodBanks', Date.now() - start);
```

## What I Learned

1. **Spatial Indices Are Magic**: GIST indices make spatial queries instant

2. **Do Spatial Work in the Database**: PostGIS beats JavaScript for geo calculations

3. **Geography > Geometry**: Use geography for Earth-based coordinates

4. **Coordinate Order Matters**: Longitude first, always

5. **Performance Is a Feature**: 3s → 0.5s load times transformed UX

6. **Migrate Early**: Adding spatial columns later is harder than starting with them

## Up Next

In Part 13, I'll cover provider claims - empowering food bank staff to manage their own listings with admin approval workflows.

---
**Key Commits**: Phase 4.1 completion

**Related Files**:
- `drizzle/migrations/0010_add_geometry.sql` - PostGIS migration
- `src/lib/food-bank-queries.ts` - Optimized spatial queries
- `src/lib/event-queries.ts` - Event spatial queries
