---
title: "Part 8: Trust & Enterprise - Provider Claims System"
series: "TheFeed Development Journey"
part: 8
date: 2025-12-02
updated: 2025-12-27
tags: ["provider-claims", "verification", "enterprise", "phase-5"]
reading_time: "9 min"
commits_covered: "eb32d56..ad20386"
---

## Where We Are

By early December, the platform had solid features and good data. But a new user category emerged: actual food bank staff who wanted to manage their own resources.

They asked: "Can I claim this listing as ours? We need to keep hours accurate."

This created a new problem: **resource ownership**. How do you let food banks manage their own data while preventing abuse?

Phase 5.2 shipped the answer: **Provider Claims System** (`eb32d56..ad20386`).

## The Problem Statement

Before provider claims:
- Food banks couldn't edit their own listings
- Admins manually updated hours (didn't scale)
- Data went stale quickly
- No verification that "Bob's Food Pantry" was actually run by Bob

With claims:
- Providers can claim resources
- Admins review and verify claims
- Providers can edit their own data
- Audit trail tracks changes

## The Schema: Provider Claims

Added a new table to track resource ownership:

```typescript
export const providerClaims = pgTable("provider_claims", {
    id: text("id").primaryKey(),
    resourceId: text("resource_id")
        .notNull()
        .references(() => foodBanks.id),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    // Status workflow
    status: text("status"),  // "pending" | "approved" | "rejected" | "withdrawn"
    rejectionReason: text("rejection_reason"),
    // Verification info
    jobTitle: text("job_title"),  // "Director", "Volunteer Coordinator"
    phone: text("phone"),  // Facility phone (not personal)
    verificationInfo: jsonb("verification_info"),  // Flexible for future methods
    // Admin review
    reviewedBy: text("reviewed_by").references(() => user.id),
    reviewedAt: timestamp("reviewed_at"),
    // Timeline
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
    resourceIdIdx: index("claims_resource_id_idx").on(table.resourceId),
    userIdIdx: index("claims_user_id_idx").on(table.userId),
    statusIdx: index("claims_status_idx").on(table.status),
}));
```

Also updated `foodBanks` with ownership fields:

```typescript
export const foodBanks = pgTable("food_banks", {
    // ... existing fields ...
    claimedBy: text("claimed_by").references(() => user.id),
    claimedAt: timestamp("claimed_at"),
    providerRole: pgEnum("provider_role_enum", [
        "owner",
        "manager",
        "staff",
        "volunteer"
    ])("provider_role"),
    providerVerified: boolean("provider_verified").default(false),
    providerCanEdit: boolean("provider_can_edit").default(true),
    // ...
});
```

## The Workflow

### Step 1: Provider Submits Claim

A food bank staff member visits the resource detail page and clicks "Claim This Resource".

Form asks for:
- Job title (to verify authority)
- Facility phone number (verification)
- Why are you claiming this? (explanation)

```typescript
export async function submitClaim(
    userId: string,
    resourceId: string,
    input: ClaimInput
) {
    // Validate that claim doesn't exist
    const existing = await getClaimByUserAndResource(userId, resourceId);
    if (existing && ["pending", "approved"].includes(existing.status)) {
        throw new Error("Claim already exists");
    }

    // Create claim
    return await db.insert(providerClaims).values({
        userId,
        resourceId,
        status: "pending",
        jobTitle: input.jobTitle,
        phone: input.phone,
        verificationInfo: {
            claimReason: input.reason,
            submittedAt: new Date(),
        },
    });
}
```

### Step 2: Admin Review

Admins see claims in a dashboard (later implemented in Part 10):

```
Pending Claims (23)

Food Bank: Bay Area Food Bank
Claimant: Maria Gonzalez (maria@bafb.org)
Job Title: Community Coordinator
Phone: 916-555-0123

Status: Pending Review
[Approve] [Reject] [Request More Info]
```

Admins can:
- View the resource and claim details
- Contact the provider via phone or email
- Approve with conditions
- Reject with explanation

```typescript
export async function approveClaim(
    claimId: string,
    reviewedBy: string
) {
    return await db
        .update(providerClaims)
        .set({
            status: "approved",
            reviewedBy,
            reviewedAt: new Date(),
        })
        .where(eq(providerClaims.id, claimId));
}

export async function rejectClaim(
    claimId: string,
    reviewedBy: string,
    reason: string
) {
    return await db
        .update(providerClaims)
        .set({
            status: "rejected",
            rejectionReason: reason,
            reviewedBy,
            reviewedAt: new Date(),
        })
        .where(eq(providerClaims.id, claimId));
}
```

### Step 3: Provider Edits Resource

Once approved, the provider can update hours, services, description, etc.

```typescript
export async function updateResourceAsProvider(
    resourceId: string,
    userId: string,
    updates: ResourceUpdate
) {
    // Verify user owns this resource
    const claim = await getApprovedClaimByUserAndResource(userId, resourceId);
    if (!claim) {
        throw new Error("Not authorized");
    }

    // Update resource with audit trail
    return await db.transaction(async (tx) => {
        // 1. Save old version to audit log
        const oldResource = await tx.query.foodBanks.findFirst({
            where: eq(foodBanks.id, resourceId),
        });

        await tx.insert(resourceAuditLog).values({
            resourceId,
            changedBy: userId,
            changeType: "provider_edit",
            beforeData: oldResource,
            afterData: updates,
            reason: "Provider update",
        });

        // 2. Update resource
        return await tx
            .update(foodBanks)
            .set({
                ...updates,
                updatedAt: new Date(),
            })
            .where(eq(foodBanks.id, resourceId));
    });
}
```

## API Routes

The system exposed clean endpoints:

```typescript
// POST /api/resources/[id]/claim
// Submit a claim for a resource
// Body: {jobTitle, phone, reason}

// GET /api/resources/[id]/claim
// Check claim status
// Returns: {status, claim}

// DELETE /api/resources/[id]/claim
// Withdraw pending claim

// GET /api/admin/claims
// List all claims (admin only)
// Query: ?status=pending&limit=50&offset=0

// PUT /api/admin/claims/[id]/approve
// Approve a claim (admin only)

// PUT /api/admin/claims/[id]/reject
// Reject a claim with reason (admin only)
```

## The Verification Strategy

The team designed verification as **layers**, not binary:

```
Level 0: Unverified
  - Data from discovery or seed
  - May be inaccurate
  - Low confidence score

Level 1: Community Verified
  - 3+ users confirmed hours correct
  - Upvoted accuracy
  - Medium confidence

Level 2: Provider Claimed
  - Staff member verified ownership
  - Can edit own data
  - High confidence

Level 3: Admin Verified
  - Admin manually reviewed
  - Spot-checked phone/location
  - Highest confidence badge
```

UI displays appropriate badges:
- 🟠 Unverified (orange)
- 🟡 Community Verified (yellow)
- 🟢 Provider Claimed (light green)
- 🟢✅ Admin Verified (green checkmark)

## The Challenges

### Challenge 1: Impersonation Risk
What prevents someone from claiming a resource they don't run?

Solution: **Verification layering** + **phone verification** + **admin review**
- Job titles help spot fakes ("Director of Operations" vs "I want to help")
- Phone number enables outbound verification
- Admins can call to confirm

### Challenge 2: Dispute Resolution
What if two people claim the same resource?

Solution: **First-approved wins** + **dispute mechanism**
- First approved claim blocks others
- Non-approved claims can be "upgraded" if owner changes

### Challenge 3: Data Silos
Approved providers can edit, but admins need to know about changes.

Solution: **Audit trail** + **automatic notifications**
- Every change logged
- Admins see "Resource updated by provider" notifications

## The Business Impact

For food banks:
- ✅ Keep your own hours current
- ✅ Respond to operational changes quickly
- ✅ Build credibility on platform

For TheFeed:
- ✅ Data quality improves automatically
- ✅ Relationships with food banks deepen
- ✅ Trust signals increase

For users:
- ✅ Hours are more accurate
- ✅ Official resources marked clearly
- ✅ Better experience overall

## What We Learned

1. **Trust is layered, not binary**. Rather than "verified" or "not", we built a confidence system that acknowledges degrees of trust.

2. **Verification is not just validation**. Checking if data is valid != checking if it's true. Provider claims added human verification.

3. **Audit trails are essential**. Once providers could edit, transparency became non-negotiable.

## Up Next

With the enterprise infrastructure in place, the system needed to actually **reach production**. Next: deploying to Vercel and handling the real-world constraints of production infrastructure.

---

**Key Commits**: `fa09fb3` (schema), `c50a67e` (query layer), `43f0524` (submission API), `eb32d56` (approval workflow)

**Related Code**: `src/lib/provider-queries.ts`, `src/app/api/resources/[id]/claim/`, `src/app/api/admin/claims/`
