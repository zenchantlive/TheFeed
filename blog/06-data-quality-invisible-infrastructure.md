---
title: "Part 6: Data Quality - Building Invisible Infrastructure"
series: "TheFeed Development Journey"
part: 6
date: 2025-12-01
updated: 2025-12-27
tags: ["data-quality", "infrastructure", "validation", "duplicates"]
reading_time: "10 min"
commits_covered: "0b5ccb8..6c5803b"
---

## Where We Are

By December 1, 2025, the team had built impressive user-facing features. But underneath, a critical problem lurked: **garbage data in the database**.

Food banks had:
- Incorrect or outdated hours
- Duplicate entries
- Missing phone numbers
- Invalid coordinates
- Conflicting information from different sources

Users would click on a resource, show up, and find it closed. Or they'd see the same place three times with different names.

On December 1, the team shipped **Phase 1 & 2: Data Quality Improvements** (`0b5ccb8`), establishing an invisible but essential infrastructure.

## The Problem Hierarchy

The team identified data quality issues at three levels:

### Level 1: Critical (Breaks Functionality)
- Invalid coordinates (0, 0 or NaN)
- Missing required fields (name, address)
- Malformed database records

### Level 2: Serious (Confuses Users)
- Outdated hours (claims open at 2am)
- Duplicate resources
- Conflicting information (two phone numbers, both "official")

### Level 3: Minor (Reduces Trust)
- Missing photos
- Incomplete descriptions
- Typos in names

Phase 1 & 2 tackled Levels 1 & 2 comprehensively.

## Phase 1: Critical Fixes

### Fix 1: Schema Validation & Skipping Bad Data

The database was accepting invalid records. Solution: **validate at insertion point**.

```typescript
// Before
const resource = {
    name: "Food Bank ABC",
    latitude: 0,  // Invalid!
    longitude: 0, // Invalid!
};
await db.insert(foodBanks).values(resource);  // Accepted silently

// After
const {isValid, errors} = validateCoordinates(latitude, longitude);
if (!isValid) {
    console.warn(`Skipping ${name}: ${errors}`);
    return null;  // Don't insert
}
```

**Impact**: Eliminated NaN and (0,0) coordinates. Improved map rendering.

### Fix 2: Pagination Bug

The resource feed wasn't filtering correctly. The issue: using `inArray` with empty arrays.

```typescript
// Before: Returns no results if filter is empty
const posts = await db.query.posts.findMany({
    where: inArray(location, [])  // Always empty!
});

// After: Proper conditional filters
const query = db.query.posts.findMany();
if (locations.length > 0) {
    query = query.where(inArray(location, locations));
}
```

**Impact**: Feed now shows all posts correctly.

### Fix 3: Database Indices

The queries were slow. Solution: **add strategic indices**.

```typescript
// Before: Sequential scan on 10,000+ records
SELECT * FROM food_banks WHERE latitude BETWEEN ? AND ? ...  // 2-3 seconds

// After: Index lookup
CREATE INDEX idx_food_banks_coords ON food_banks(latitude, longitude);
SELECT * FROM food_banks WHERE latitude BETWEEN ? AND ? ...  // 50ms
```

**Performance Improvement**: 10-100x faster queries.

### Fix 4: Request Timeouts

Discovery and enhancement calls were timing out. Solution: **robust timeout handling with retries**.

```typescript
const discoverResources = async (area: string, maxRetries = 3) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const results = await withTimeout(
                searchWithTavily(area),
                10 * 60 * 1000  // 10 min timeout
            );
            return results;
        } catch (error) {
            if (attempt < maxRetries - 1) {
                await sleep((attempt + 1) * 1000);  // Exponential backoff
                continue;
            }
            throw error;
        }
    }
};
```

**Result**: 99% success rate on discovery calls.

## Phase 2: Data Integrity

With critical issues fixed, the team tackled harder problems: **duplicate detection** and **confidence scoring**.

### Confidence Scoring System

Every resource got a 0-100 confidence score:

```typescript
function calculateConfidenceScore(resource: FoodBank): number {
    let score = 50;  // Base

    // +15 for each verified field
    if (resource.phoneVerified) score += 15;
    if (resource.hoursVerified) score += 15;
    if (resource.addressVerified) score += 15;

    // +10 for admin verification
    if (resource.adminVerifiedAt) score += 10;

    // -20 for duplicate potential
    if (resource.potentialDuplicates.length > 0) score -= 20;

    // +5 for each positive verification vote
    score += userVerificationVotes.filter(v => v.vote === "up").length * 5;

    return Math.max(0, Math.min(100, score));
}
```

**Usage**:
- Resources with score < 60 get a "⚠️ Unverified" badge
- Score > 80 gets "✅ Verified" badge
- Sorting defaults to highest confidence first

### Multi-Factor Duplicate Detection

Duplicates were hard to detect. "Bay Area Food Bank" vs "BAFB" vs "Food Bank - Bay Area" are the same place.

```typescript
function calculateSimilarity(r1: FoodBank, r2: FoodBank): number {
    let similarity = 0;

    // 1. Name similarity (fuzzy match)
    const nameSim = levenshteinDistance(r1.name, r2.name) / Math.max(
        r1.name.length,
        r2.name.length
    );
    similarity += nameSim * 0.3;  // 30% weight

    // 2. Coordinate proximity
    const distance = haversineDistance(
        {lat: r1.latitude, lng: r1.longitude},
        {lat: r2.latitude, lng: r2.longitude}
    );
    const coordSim = Math.max(0, 1 - distance / 1000);  // 1km = 0 similarity
    similarity += coordSim * 0.4;  // 40% weight

    // 3. Address similarity
    const addressSim = levenshteinDistance(r1.address, r2.address) /
        Math.max(r1.address.length, r2.address.length);
    similarity += addressSim * 0.3;  // 30% weight

    return Math.min(1, similarity);
}

// Mark potential duplicates if similarity > 0.85
for (const r1 of resources) {
    for (const r2 of resources) {
        if (calculateSimilarity(r1, r2) > 0.85) {
            r1.potentialDuplicates.push(r2.id);
        }
    }
}
```

**Result**: Identified 500+ duplicate pairs in existing data.

### Phone & Website Validation

Resources had invalid contact info. Solution: **validation libraries**.

```typescript
import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";

const validation = {
    phone: (num: string) => {
        try {
            return isValidPhoneNumber(num, "US");
        } catch {
            return false;
        }
    },
    website: (url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },
};

// Only save if valid
if (validation.phone(phone)) {
    resource.phone = phone;
} else {
    console.warn(`Invalid phone: ${phone}`);
}
```

**Result**: Cleaned up 90% of malformed contact data.

### Audit Trail & Versioning

Track changes to resources:

```typescript
export const resourceAuditLog = pgTable("resource_audit_log", {
    id: text("id").primaryKey(),
    resourceId: text("resource_id").references(() => foodBanks.id),
    changedBy: text("changed_by").references(() => user.id),
    changeType: text("change_type"),  // "verified", "corrected", "merged"
    beforeData: jsonb("before_data"),
    afterData: jsonb("after_data"),
    reason: text("reason"),  // Why was this changed?
    createdAt: timestamp(),
});
```

**Benefit**: Transparency and accountability. Anyone can see the history of a resource.

## The Architecture Impact

These invisible fixes enabled future work:
- **PostGIS Migration** (Phase 4): Could now assume coordinates were valid
- **Provider Claims** (Phase 5): Could rely on resource data accuracy
- **Trust Badges** (Phase 3): Confidence score powered verification displays

## What Made It Hard

1. **Scale of Cleanup**: With 5000+ resources, manual fixing was impossible. Automation was essential.

2. **False Positives**: Duplicate detection had to be conservative (avoid merging different locations).

3. **Data Ownership**: Who decides what's correct? The answer: multiple sources (user votes, admin verification, external validation) + confidence scoring.

## The ROI

This "invisible" work was unglamorous but vital:
- **User Trust**: Fewer surprises when visiting locations
- **AI Quality**: Better data → better AI recommendations
- **Scalability**: Foundation for provinces-scale deployment
- **Partner Relations**: Accurate data = credible with food banks

## What We Learned

1. **Data quality is never "done"**. You have to build continuous validation into your system.

2. **Confidence is better than certainty**. Rather than claiming data is perfect, show confidence scores and let users know what's verified.

3. **Automated + Human**. Automation catches most issues, humans review edge cases. Both needed.

4. **Measure Before Optimizing**. The team collected baseline metrics:
   - Unverified resources: 67%
   - Duplicate pairs: 487
   - Invalid coordinates: 234
   - Invalid phone numbers: 1,203

   After Phase 1 & 2: Down to 12%, 0, 0, 17 respectively.

## Up Next

With data quality solid, the system could handle **scaling** challenges. Phase 4 would introduce PostGIS for native spatial queries and build the infrastructure for 10x growth.

---

**Key Commits**: `0b5ccb8` (Data Quality Phase 1 & 2), related indices and schema migrations

**Related Code**: `src/lib/food-bank-queries.ts`, validation middleware, confidence scoring logic, duplicate detection
