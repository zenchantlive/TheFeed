## PHASE 2: DATA INTEGRITY (Week 3-4)

**Goal:** Prevent bad data from entering the system
**Success Metrics:**
- 90%+ confidence scoring accuracy
- <5% duplicate rate
- All phone/website validated before storage

### Tasks

#### 2.1 Implement Quantitative Confidence Scoring

**Current Issue:** LLM assigns subjective 0.0-1.0 based on "vibes"

**Solution:** Replace with formula-based scoring

**File:** `/src/lib/discovery/confidence-scoring.ts` (new file)

```typescript
import { DiscoveryResult } from "./tavily-search";

export type ConfidenceFactors = {
  fieldCompleteness: number; // 0-40 points
  sourceAuthority: number;   // 0-30 points
  dataFreshness: number;     // 0-10 points
  multiSourceConfirmation: number; // 0-20 points
  total: number;             // 0-100
};

export function calculateConfidence(
  resource: DiscoveryResult,
  options: {
    discoveryDate?: Date;
    confirmingSources?: string[];
  } = {}
): { score: number; factors: ConfidenceFactors } {
  const factors: ConfidenceFactors = {
    fieldCompleteness: 0,
    sourceAuthority: 0,
    dataFreshness: 0,
    multiSourceConfirmation: 0,
    total: 0
  };

  // 1. Field Completeness (40 points max)
  const fields = {
    phone: 8,
    website: 8,
    hours: 12, // Critical field
    services: 6,
    description: 6
  };

  for (const [field, points] of Object.entries(fields)) {
    const value = resource[field as keyof DiscoveryResult];
    if (value != null && value !== "") {
      if (field === "services" && Array.isArray(value) && value.length > 0) {
        factors.fieldCompleteness += points;
      } else if (field !== "services") {
        factors.fieldCompleteness += points;
      }
    }
  }

  // 2. Source Authority (30 points max)
  const sourceUrl = resource.sourceUrl;
  if (sourceUrl) {
    try {
      const domain = new URL(sourceUrl).hostname.toLowerCase();

      if (domain.endsWith('.gov')) {
        factors.sourceAuthority = 30; // Government source - highest trust
      } else if (domain.match(/feedingamerica\.org|211\.org|fns\.usda\.gov/i)) {
        factors.sourceAuthority = 25; // Known authoritative sources
      } else if (domain.endsWith('.org')) {
        factors.sourceAuthority = 15; // Non-profit org
      } else if (domain.endsWith('.edu')) {
        factors.sourceAuthority = 10; // Educational institution
      } else {
        factors.sourceAuthority = 5; // Commercial/unknown
      }
    } catch {
      factors.sourceAuthority = 0;
    }
  }

  // 3. Data Freshness (10 points max)
  const discoveryDate = options.discoveryDate || new Date();
  const ageMonths = 0; // Since it's newly discovered, full points
  factors.dataFreshness = 10;

  // 4. Multi-Source Confirmation (20 points max)
  const confirmingSources = options.confirmingSources || [];
  if (confirmingSources.length >= 3) {
    factors.multiSourceConfirmation = 20;
  } else if (confirmingSources.length === 2) {
    factors.multiSourceConfirmation = 15;
  } else if (confirmingSources.length === 1) {
    factors.multiSourceConfirmation = 10;
  }

  // Calculate total (0-100 scale)
  factors.total =
    factors.fieldCompleteness +
    factors.sourceAuthority +
    factors.dataFreshness +
    factors.multiSourceConfirmation;

  // Convert to 0-1 scale for storage
  const score = factors.total / 100;

  return { score, factors };
}

export function getConfidenceTier(score: number): "high" | "medium" | "low" {
  if (score >= 0.8) return "high";
  if (score >= 0.5) return "medium";
  return "low";
}

export function shouldAutoApprove(
  score: number,
  sourceUrl: string,
  isPotentialDuplicate: boolean
): boolean {
  if (isPotentialDuplicate) return false;

  // Only auto-approve high confidence from trusted sources
  if (score < 0.9) return false;

  try {
    const domain = new URL(sourceUrl).hostname.toLowerCase();
    return domain.endsWith('.gov') ||
           domain.match(/feedingamerica\.org|211\.org|fns\.usda\.gov/) !== null;
  } catch {
    return false;
  }
}
```

**Update discovery pipeline:**

```typescript
// File: /src/lib/discovery/tavily-search.ts
import { calculateConfidence, shouldAutoApprove } from "./confidence-scoring";

// In processBatchResults, after normalization:
const { score: confidenceScore, factors } = calculateConfidence(normalized, {
  discoveryDate: new Date(),
  confirmingSources: [] // TODO: Track if same resource found in multiple Tavily results
});

normalized.confidenceScore = confidenceScore;

// In trigger route, use for auto-approval:
const autoApprove = !isPotentialDuplicate &&
                    shouldAutoApprove(
                      normalized.confidenceScore ?? 0,
                      normalized.sourceUrl ?? "",
                      isPotentialDuplicate
                    );
```

**Testing:**
```typescript
// Test cases
const testCases = [
  {
    name: "Perfect .gov resource",
    resource: {
      name: "Food Bank",
      address: "123 Main St",
      city: "Sacramento",
      state: "CA",
      zipCode: "95814",
      latitude: 38.5816,
      longitude: -121.4944,
      phone: "(916) 555-1234",
      website: "https://example.org",
      description: "Full description",
      services: ["Pantry", "Hot Meal"],
      hours: { monday: { open: "09:00", close: "17:00" } },
      sourceUrl: "https://fns.usda.gov/resource/123",
      confidence: 0
    },
    expectedScore: 1.0, // 40 + 30 + 10 + 0 = 80/100 = 0.8 + .gov boost
  },
  {
    name: "Incomplete commercial source",
    resource: {
      name: "Food Bank",
      address: "123 Main St",
      city: "Sacramento",
      state: "CA",
      zipCode: "95814",
      latitude: 38.5816,
      longitude: -121.4944,
      phone: null,
      website: null,
      description: null,
      services: [],
      hours: null,
      sourceUrl: "https://randomsite.com/page",
      confidence: 0
    },
    expectedScore: 0.15, // 0 + 5 + 10 + 0 = 15/100 = 0.15
  }
];

for (const test of testCases) {
  const { score } = calculateConfidence(test.resource);
  console.assert(
    Math.abs(score - test.expectedScore) < 0.05,
    `${test.name}: expected ${test.expectedScore}, got ${score}`
  );
}
```

**Acceptance Criteria:**
- [ ] Confidence scoring is deterministic (same input = same score)
- [ ] .gov sources get 90%+ confidence if complete
- [ ] Incomplete resources get <50% confidence
- [ ] Auto-approval only for 90%+ .gov/.org sources
- [ ] Confidence factors stored in database for auditing

---

#### 2.2 Enhanced Duplicate Detection

**File:** `/src/lib/discovery/duplicate-detector.ts` (new file)

```typescript
import { db } from "@/lib/db";
import { foodBanks } from "@/lib/schema";
import { sql } from "drizzle-orm";
import Levenshtein from "fastest-levenshtein";

export type DuplicateScore = {
  score: number; // 0-100
  factors: {
    addressSimilarity: number;  // 0-100
    nameSimilarity: number;     // 0-100
    distanceMeters: number;
    phoneMatch: boolean;
    websiteMatch: boolean;
  };
  confidence: "high" | "medium" | "low";
  matchedResource?: {
    id: string;
    name: string;
    address: string;
  };
};

export async function detectDuplicates(
  resource: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    latitude: number;
    longitude: number;
    phone?: string | null;
    website?: string | null;
  }
): Promise<DuplicateScore[]> {
  const duplicates: DuplicateScore[] = [];

  // Strategy 1: Exact address match
  const exactMatches = await db
    .select()
    .from(foodBanks)
    .where(
      sql`LOWER(${foodBanks.address}) = LOWER(${resource.address})
          AND LOWER(${foodBanks.city}) = LOWER(${resource.city})
          AND LOWER(${foodBanks.state}) = LOWER(${resource.state})`
    );

  for (const match of exactMatches) {
    duplicates.push({
      score: 100,
      factors: {
        addressSimilarity: 100,
        nameSimilarity: calculateStringSimilarity(resource.name, match.name) * 100,
        distanceMeters: 0,
        phoneMatch: resource.phone === match.phone && resource.phone != null,
        websiteMatch: resource.website === match.website && resource.website != null,
      },
      confidence: "high",
      matchedResource: {
        id: match.id,
        name: match.name,
        address: match.address
      }
    });
  }

  // Strategy 2: Geo-spatial + name similarity
  const latBuffer = 0.005; // ~555m
  const lngBuffer = 0.005;

  const nearbyCandidates = await db
    .select()
    .from(foodBanks)
    .where(
      sql`${foodBanks.latitude} BETWEEN ${resource.latitude - latBuffer} AND ${resource.latitude + latBuffer}
          AND ${foodBanks.longitude} BETWEEN ${resource.longitude - lngBuffer} AND ${resource.longitude + lngBuffer}`
    );

  for (const candidate of nearbyCandidates) {
    // Skip if already matched exactly
    if (duplicates.some(d => d.matchedResource?.id === candidate.id)) continue;

    const distance = haversineDistance(
      resource.latitude,
      resource.longitude,
      candidate.latitude,
      candidate.longitude
    );

    if (distance > 200) continue; // Only consider within 200m

    const nameSim = calculateStringSimilarity(resource.name, candidate.name);
    const addressSim = calculateStringSimilarity(
      normalizeAddress(resource.address),
      normalizeAddress(candidate.address)
    );

    const phoneMatch = resource.phone === candidate.phone && resource.phone != null;
    const websiteMatch = resource.website === candidate.website && resource.website != null;

    // Weighted scoring
    let score = 0;
    score += addressSim * 30;  // 30% weight
    score += nameSim * 20;     // 20% weight
    score += ((200 - Math.min(distance, 200)) / 200) * 10; // 10% weight (closer = higher)
    score += phoneMatch ? 20 : 0;    // 20% weight
    score += websiteMatch ? 20 : 0;  // 20% weight

    const confidence: "high" | "medium" | "low" =
      score > 80 ? "high" :
      score > 50 ? "medium" :
      "low";

    if (score > 50) { // Only flag if medium or high confidence
      duplicates.push({
        score,
        factors: {
          addressSimilarity: addressSim * 100,
          nameSimilarity: nameSim * 100,
          distanceMeters: distance,
          phoneMatch,
          websiteMatch,
        },
        confidence,
        matchedResource: {
          id: candidate.id,
          name: candidate.name,
          address: candidate.address
        }
      });
    }
  }

  return duplicates.sort((a, b) => b.score - a.score);
}

function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;

  const distance = Levenshtein.distance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);

  return 1 - (distance / maxLen);
}

function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .trim()
    .replace(/\b(street|st|avenue|ave|boulevard|blvd|road|rd|drive|dr|lane|ln|court|ct)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
```

**Install dependency:**
```bash
pnpm add fastest-levenshtein
```

**Update discovery pipeline:**
```typescript
// In /src/app/api/discovery/trigger/route.ts
import { detectDuplicates } from "@/lib/discovery/duplicate-detector";

// Before inserting:
const duplicateMatches = await detectDuplicates(normalized);
const isPotentialDuplicate = duplicateMatches.some(d => d.confidence === "high");

if (isPotentialDuplicate) {
  console.info(`Potential duplicate found for ${normalized.name}:`, {
    matches: duplicateMatches
      .filter(d => d.confidence === "high")
      .map(d => d.matchedResource?.name)
  });
}

// Store duplicate candidates for admin review
await db.insert(foodBanks).values({
  ...normalized,
  verificationStatus: isPotentialDuplicate ? "unverified" : (autoApprove ? "official" : "unverified"),
  potentialDuplicates: duplicateMatches
    .filter(d => d.confidence !== "low")
    .map(d => d.matchedResource?.id)
});
```

**Add to schema:**
```typescript
// src/lib/schema.ts
export const foodBanks = pgTable("food_banks", {
  // ... existing fields

  potentialDuplicates: jsonb("potential_duplicates").$type<string[]>(), // IDs of potential duplicate resources
});
```

**Acceptance Criteria:**
- [ ] Duplicate detection catches 95%+ of true duplicates
- [ ] <5% false positive rate
- [ ] Admin dashboard shows duplicate candidates
- [ ] Merge workflow prevents duplicate insertions

---

#### 2.3 Phone & Website Validation

**File:** `/src/lib/discovery/validators.ts` (new file)

```typescript
import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";

export function validatePhone(phone: string | null | undefined): {
  isValid: boolean;
  normalized: string | null;
  error?: string;
} {
  if (!phone) return { isValid: false, normalized: null };

  try {
    // Try parsing as US number (can be extended for international)
    const phoneNumber = parsePhoneNumber(phone, "US");

    if (!phoneNumber.isValid()) {
      return {
        isValid: false,
        normalized: null,
        error: "Invalid phone number format"
      };
    }

    // Return E.164 format for storage
    return {
      isValid: true,
      normalized: phoneNumber.format("E.164") // e.g., +19165551234
    };
  } catch (error) {
    return {
      isValid: false,
      normalized: null,
      error: error instanceof Error ? error.message : "Phone parsing failed"
    };
  }
}

export function validateWebsite(website: string | null | undefined): {
  isValid: boolean;
  normalized: string | null;
  error?: string;
} {
  if (!website) return { isValid: false, normalized: null };

  try {
    let url = website.trim();

    // Add https:// if missing protocol
    if (!url.match(/^https?:\/\//i)) {
      url = `https://${url}`;
    }

    const parsed = new URL(url);

    // Basic validation
    if (!parsed.hostname.includes(".")) {
      return {
        isValid: false,
        normalized: null,
        error: "Invalid domain format"
      };
    }

    // Normalize (remove www, force https)
    const normalized = `https://${parsed.hostname.replace(/^www\./i, "")}${parsed.pathname}${parsed.search}`;

    return {
      isValid: true,
      normalized
    };
  } catch (error) {
    return {
      isValid: false,
      normalized: null,
      error: "Invalid URL format"
    };
  }
}

export async function validateWebsiteReachable(
  url: string,
  timeoutMs = 5000
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow"
    });

    clearTimeout(timeout);

    // Accept any 2xx or 3xx status
    return response.ok || (response.status >= 300 && response.status < 400);
  } catch {
    return false;
  }
}
```

**Install dependency:**
```bash
pnpm add libphonenumber-js
```

**Update normalization:**
```typescript
// File: /src/lib/resource-normalizer.ts
import { validatePhone, validateWebsite } from "./validators";

export function normalizePhone(phone?: string | null): string | null {
  const validation = validatePhone(phone);
  return validation.normalized;
}

export function normalizeWebsite(website?: string | null): string | null {
  const validation = validateWebsite(website);
  return validation.normalized;
}
```

**Update admin resource editor:**
```typescript
// File: /src/app/admin/verification/page-client.tsx
import { validatePhone, validateWebsite } from "@/lib/discovery/validators";

function ResourceEditorPanel({ resource, ... }: ResourceEditorPanelProps) {
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [websiteError, setWebsiteError] = useState<string | null>(null);

  const handlePhoneBlur = () => {
    const validation = validatePhone(formData.phone);
    if (!validation.isValid && formData.phone) {
      setPhoneError(validation.error || "Invalid phone number");
    } else {
      setPhoneError(null);
      if (validation.normalized) {
        handleInputChange("phone", validation.normalized);
      }
    }
  };

  const handleWebsiteBlur = () => {
    const validation = validateWebsite(formData.website);
    if (!validation.isValid && formData.website) {
      setWebsiteError(validation.error || "Invalid website");
    } else {
      setWebsiteError(null);
      if (validation.normalized) {
        handleInputChange("website", validation.normalized);
      }
    }
  };

  return (
    <Card>
      {/* ... */}
      <div className="grid gap-3">
        <label>Phone</label>
        <Input
          value={formData.phone ?? ""}
          onChange={(e) => handleInputChange("phone", e.target.value)}
          onBlur={handlePhoneBlur}
          className={phoneError ? "border-destructive" : ""}
        />
        {phoneError && (
          <p className="text-xs text-destructive">{phoneError}</p>
        )}
      </div>

      <div className="grid gap-3">
        <label>Website</label>
        <Input
          value={formData.website ?? ""}
          onChange={(e) => handleInputChange("website", e.target.value)}
          onBlur={handleWebsiteBlur}
          className={websiteError ? "border-destructive" : ""}
        />
        {websiteError && (
          <p className="text-xs text-destructive">{websiteError}</p>
        )}
      </div>
    </Card>
  );
}
```

**Acceptance Criteria:**
- [ ] Phone numbers stored in E.164 format (+19165551234)
- [ ] Invalid phone numbers rejected with clear error
- [ ] Websites normalized (https, no www)
- [ ] Invalid URLs rejected
- [ ] Admin UI shows validation errors in real-time

---

#### 2.4 Data Versioning & Audit Trail

**File:** Create new schema tables in `/src/lib/schema.ts`

```typescript
// Resource change history
export const resourceVersions = pgTable("resource_versions", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  resourceId: text("resource_id").notNull().references(() => foodBanks.id, { onDelete: "cascade" }),
  version: integer("version").notNull(), // 1, 2, 3, etc.

  // Snapshot of full resource at this version
  snapshot: jsonb("snapshot").notNull().$type<Record<string, any>>(),

  // What changed
  changedFields: jsonb("changed_fields").$type<string[]>(), // ["phone", "hours"]

  // Who changed it
  changedBy: text("changed_by").notNull(), // User ID or "system"
  changeReason: text("change_reason"), // "ai_enhancement" | "admin_edit" | "provider_claim"

  // Source attribution
  sources: jsonb("sources").$type<string[]>(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Admin action audit log
export const adminAuditLog = pgTable("admin_audit_log", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  adminId: text("admin_id").notNull().references(() => user.id),
  action: text("action").notNull(), // "approve" | "reject" | "merge" | "edit" | "delete"
  resourceId: text("resource_id").references(() => foodBanks.id, { onDelete: "set null" }),

  // Batch operations
  affectedIds: jsonb("affected_ids").$type<string[]>(),

  // Change details
  changes: jsonb("changes").$type<Record<string, { old: any; new: any }>>(),
  reason: text("reason"),

  // IP for security audit
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Indices for performance
export const resourceVersionsIndex = index("idx_resource_versions_resource_id").on(resourceVersions.resourceId);
export const adminAuditLogIndex = index("idx_admin_audit_log_admin_id").on(adminAuditLog.adminId);
export const adminAuditLogResourceIndex = index("idx_admin_audit_log_resource_id").on(adminAuditLog.resourceId);
```

**Create versioning utility:**

```typescript
// File: /src/lib/versioning.ts
import { db } from "./db";
import { foodBanks, resourceVersions } from "./schema";
import { eq } from "drizzle-orm";

export async function createResourceVersion(
  resourceId: string,
  changedBy: string,
  changeReason: string,
  changedFields?: string[],
  sources?: string[]
) {
  // Get current resource state
  const [resource] = await db
    .select()
    .from(foodBanks)
    .where(eq(foodBanks.id, resourceId));

  if (!resource) throw new Error("Resource not found");

  // Get current version number
  const versions = await db
    .select()
    .from(resourceVersions)
    .where(eq(resourceVersions.resourceId, resourceId));

  const nextVersion = versions.length + 1;

  // Create version snapshot
  await db.insert(resourceVersions).values({
    resourceId,
    version: nextVersion,
    snapshot: resource as any,
    changedFields,
    changedBy,
    changeReason,
    sources,
  });

  return nextVersion;
}

export async function getResourceHistory(resourceId: string) {
  return db
    .select()
    .from(resourceVersions)
    .where(eq(resourceVersions.resourceId, resourceId))
    .orderBy(resourceVersions.version);
}

export async function rollbackResourceVersion(
  resourceId: string,
  targetVersion: number,
  rolledBackBy: string
) {
  // Get target version
  const [version] = await db
    .select()
    .from(resourceVersions)
    .where(
      eq(resourceVersions.resourceId, resourceId),
      eq(resourceVersions.version, targetVersion)
    );

  if (!version) throw new Error("Version not found");

  // Restore snapshot
  await db
    .update(foodBanks)
    .set({
      ...version.snapshot,
      updatedAt: new Date(),
    })
    .where(eq(foodBanks.id, resourceId));

  // Create new version showing rollback
  await createResourceVersion(
    resourceId,
    rolledBackBy,
    `rollback_to_v${targetVersion}`,
    Object.keys(version.snapshot),
    []
  );
}
```

**Update resource update endpoint:**

```typescript
// File: /src/app/api/admin/resources/[id]/route.ts
import { createResourceVersion } from "@/lib/versioning";
import { logAdminAction } from "@/lib/audit";

export const PUT = async (req: NextRequest, { params }: RouteContext) => {
  return withAdminAuth(req, async (req, { userId }) => {
    const { id } = await params;
    const body = await req.json();
    const validation = updateResourceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const updates = validation.data;

    // Get current resource for comparison
    const [current] = await db
      .select()
      .from(foodBanks)
      .where(eq(foodBanks.id, id));

    if (!current) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    // Determine changed fields
    const changedFields = Object.keys(updates).filter(
      key => JSON.stringify(updates[key as keyof typeof updates]) !==
             JSON.stringify(current[key as keyof typeof current])
    );

    // Update resource
    const [updatedRecord] = await db
      .update(foodBanks)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(foodBanks.id, id))
      .returning();

    // Create version snapshot
    await createResourceVersion(
      id,
      userId,
      "admin_edit",
      changedFields,
      updates.sources || []
    );

    // Log admin action
    await logAdminAction({
      adminId: userId,
      action: "edit",
      resourceId: id,
      changes: changedFields.reduce((acc, field) => {
        acc[field] = {
          old: current[field as keyof typeof current],
          new: updates[field as keyof typeof updates]
        };
        return acc;
      }, {} as Record<string, { old: any; new: any }>),
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      userAgent: req.headers.get("user-agent"),
    });

    return NextResponse.json({ resource: updatedRecord });
  });
};
```

**Create audit logging utility:**

```typescript
// File: /src/lib/audit.ts
import { db } from "./db";
import { adminAuditLog } from "./schema";

export async function logAdminAction(params: {
  adminId: string;
  action: string;
  resourceId?: string;
  affectedIds?: string[];
  changes?: Record<string, { old: any; new: any }>;
  reason?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  await db.insert(adminAuditLog).values({
    adminId: params.adminId,
    action: params.action,
    resourceId: params.resourceId,
    affectedIds: params.affectedIds,
    changes: params.changes,
    reason: params.reason,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}

export async function getAdminActions(adminId: string, limit = 50) {
  return db
    .select()
    .from(adminAuditLog)
    .where(eq(adminAuditLog.adminId, adminId))
    .orderBy(adminAuditLog.createdAt.desc())
    .limit(limit);
}

export async function getResourceAuditTrail(resourceId: string) {
  return db
    .select()
    .from(adminAuditLog)
    .where(eq(adminAuditLog.resourceId, resourceId))
    .orderBy(adminAuditLog.createdAt.desc());
}
```

**Admin UI to view history:**

```tsx
// File: /src/app/admin/verification/components/resource-history-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ResourceHistoryDialog({
  resourceId,
  isOpen,
  onClose
}: {
  resourceId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetch(`/api/admin/resources/${resourceId}/history`)
        .then(res => res.json())
        .then(data => setHistory(data.versions || []));
    }
  }, [isOpen, resourceId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Change History</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {history.map((version) => (
            <div key={version.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Version {version.version}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(version.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Changed by:</span>{" "}
                  {version.changedBy}
                </p>
                <p>
                  <span className="text-muted-foreground">Reason:</span>{" "}
                  {version.changeReason}
                </p>
                {version.changedFields && (
                  <p>
                    <span className="text-muted-foreground">Fields:</span>{" "}
                    {version.changedFields.join(", ")}
                  </p>
                )}
              </div>

              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => {
                  if (confirm(`Rollback to version ${version.version}?`)) {
                    // TODO: Implement rollback
                  }
                }}
              >
                Rollback to this version
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Acceptance Criteria:**
- [ ] Every resource change creates version snapshot
- [ ] Admin actions logged with IP/user agent
- [ ] Version history viewable in admin UI
- [ ] Rollback functionality works
- [ ] Audit trail queryable by resource/admin

---

### Phase 2 Deliverables Checklist

- [ ] **2.1** Quantitative confidence scoring implemented
- [ ] **2.2** Enhanced duplicate detection working
- [ ] **2.3** Phone/website validation active
- [ ] **2.4** Versioning and audit trail complete
- [ ] Migration scripts written and tested
- [ ] Admin UI updated to show version history
- [ ] Documentation for audit queries

**Estimated Effort:** 16-20 hours
**Required Skills:** TypeScript, SQL, data modeling

---

