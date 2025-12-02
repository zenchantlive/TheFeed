/**
 * Provider Claims Query Layer
 * Reusable database queries for provider claim operations
 */

import { db } from "./db";
import { providerClaims, foodBanks, user } from "./schema";
import { eq, and, desc, sql } from "drizzle-orm";

export type ClaimStatus = "pending" | "approved" | "rejected" | "withdrawn";

/**
 * Get claims by status
 * @param status - Filter by claim status
 * @returns Array of claims with related resource and user data
 */
export async function getClaimsByStatus(status: ClaimStatus) {
  return await db.query.providerClaims.findMany({
    where: eq(providerClaims.status, status),
    with: {
      resource: {
        columns: {
          id: true,
          name: true,
          address: true,
          city: true,
          state: true,
        },
      },
      claimer: {
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      reviewer: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [desc(providerClaims.createdAt)],
  });
}

/**
 * Get a single claim by ID with full details
 * @param claimId - The claim ID
 * @returns Claim with related data or null if not found
 */
export async function getClaimById(claimId: string) {
  return await db.query.providerClaims.findFirst({
    where: eq(providerClaims.id, claimId),
    with: {
      resource: true,
      claimer: {
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      reviewer: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Get all claims for a specific resource
 * @param resourceId - The resource ID
 * @returns Array of claims for the resource
 */
export async function getClaimsByResource(resourceId: string) {
  return await db.query.providerClaims.findMany({
    where: eq(providerClaims.resourceId, resourceId),
    with: {
      claimer: {
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      reviewer: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [desc(providerClaims.createdAt)],
  });
}

/**
 * Get all claims submitted by a specific user
 * @param userId - The user ID
 * @returns Array of claims by the user
 */
export async function getClaimsByUser(userId: string) {
  return await db.query.providerClaims.findMany({
    where: eq(providerClaims.userId, userId),
    with: {
      resource: {
        columns: {
          id: true,
          name: true,
          address: true,
          city: true,
          state: true,
        },
      },
      reviewer: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [desc(providerClaims.createdAt)],
  });
}

/**
 * Check if a user has a pending claim for a resource
 * @param userId - The user ID
 * @param resourceId - The resource ID
 * @returns True if user has a pending claim, false otherwise
 */
export async function hasPendingClaim(
  userId: string,
  resourceId: string
): Promise<boolean> {
  const claim = await db.query.providerClaims.findFirst({
    where: and(
      eq(providerClaims.userId, userId),
      eq(providerClaims.resourceId, resourceId),
      eq(providerClaims.status, "pending")
    ),
    columns: {
      id: true,
    },
  });

  return !!claim;
}

/**
 * Get the count of claims by status
 * @returns Object with counts for each status
 */
export async function getClaimCounts() {
  const result = await db
    .select({
      status: providerClaims.status,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(providerClaims)
    .groupBy(providerClaims.status);

  const counts = {
    pending: 0,
    approved: 0,
    rejected: 0,
    withdrawn: 0,
    total: 0,
  };

  for (const row of result) {
    if (row.status in counts) {
      counts[row.status as ClaimStatus] = row.count;
    }
    counts.total += row.count;
  }

  return counts;
}

/**
 * Get all resources claimed by a user (approved claims only)
 * @param userId - The user ID
 * @returns Array of resources with claim metadata
 */
export async function getUserClaimedResources(userId: string) {
  const approvedClaims = await db.query.providerClaims.findMany({
    where: and(
      eq(providerClaims.userId, userId),
      eq(providerClaims.status, "approved")
    ),
    with: {
      resource: true,
    },
    orderBy: [desc(providerClaims.createdAt)],
  });

  return approvedClaims.map((claim) => ({
    ...claim.resource,
    claimId: claim.id,
    claimedAt: claim.createdAt,
  }));
}
