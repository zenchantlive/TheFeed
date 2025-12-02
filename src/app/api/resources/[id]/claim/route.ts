/**
 * Resource Claim Submission API
 * Allows authenticated users to claim resource ownership
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { providerClaims, foodBanks } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { hasPendingClaim } from "@/lib/provider-queries";

type RouteContext = {
  params: Promise<{ id: string }>;
};

interface ClaimSubmissionBody {
  claimReason: string;
  verificationInfo?: {
    email?: string;
    phone?: string;
  };
}

/**
 * POST /api/resources/[id]/claim
 * Submit a provider claim for a resource
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: resourceId } = await context.params;
    const body = (await req.json()) as ClaimSubmissionBody;
    const { claimReason, verificationInfo } = body;

    // Validate claim reason
    if (!claimReason || claimReason.trim().length === 0) {
      return NextResponse.json(
        { error: "Claim reason is required" },
        { status: 400 }
      );
    }

    if (claimReason.length > 500) {
      return NextResponse.json(
        { error: "Claim reason must be less than 500 characters" },
        { status: 400 }
      );
    }

    // Check if resource exists
    const resource = await db.query.foodBanks.findFirst({
      where: eq(foodBanks.id, resourceId),
      columns: {
        id: true,
        name: true,
        claimedBy: true,
      },
    });

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    // Check if resource is already claimed
    if (resource.claimedBy) {
      return NextResponse.json(
        { error: "Resource is already claimed by another provider" },
        { status: 409 }
      );
    }

    // Check if user already has a pending claim for this resource
    const alreadyHasClaim = await hasPendingClaim(
      session.user.id,
      resourceId
    );

    if (alreadyHasClaim) {
      return NextResponse.json(
        { error: "You already have a pending claim for this resource" },
        { status: 409 }
      );
    }

    // Create claim
    const claimId = randomUUID();
    const [claim] = await db
      .insert(providerClaims)
      .values({
        id: claimId,
        resourceId,
        userId: session.user.id,
        claimReason: claimReason.trim(),
        verificationInfo: verificationInfo
          ? JSON.stringify(verificationInfo)
          : null,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      {
        claim: {
          id: claim.id,
          status: claim.status,
          createdAt: claim.createdAt,
        },
        message: "Claim submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating provider claim:", error);
    return NextResponse.json(
      { error: "Failed to submit claim" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/resources/[id]/claim
 * Check claim status for current user on this resource
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: resourceId } = await context.params;

    // Get user's most recent claim for this resource
    const claim = await db.query.providerClaims.findFirst({
      where: and(
        eq(providerClaims.resourceId, resourceId),
        eq(providerClaims.userId, session.user.id)
      ),
      orderBy: (claims, { desc }) => [desc(claims.createdAt)],
      columns: {
        id: true,
        status: true,
        claimReason: true,
        createdAt: true,
        reviewNotes: true,
        reviewedAt: true,
      },
    });

    if (!claim) {
      return NextResponse.json({ claim: null });
    }

    return NextResponse.json({ claim });
  } catch (error) {
    console.error("Error fetching claim status:", error);
    return NextResponse.json(
      { error: "Failed to fetch claim status" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/resources/[id]/claim
 * Withdraw a pending claim (user can only withdraw their own pending claims)
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: resourceId } = await context.params;

    // Find user's pending claim for this resource
    const claim = await db.query.providerClaims.findFirst({
      where: and(
        eq(providerClaims.resourceId, resourceId),
        eq(providerClaims.userId, session.user.id),
        eq(providerClaims.status, "pending")
      ),
      columns: {
        id: true,
      },
    });

    if (!claim) {
      return NextResponse.json(
        { error: "No pending claim found to withdraw" },
        { status: 404 }
      );
    }

    // Update claim status to withdrawn (preserves audit trail)
    await db
      .update(providerClaims)
      .set({
        status: "withdrawn",
        updatedAt: new Date(),
      })
      .where(eq(providerClaims.id, claim.id));

    return NextResponse.json({
      success: true,
      message: "Claim withdrawn successfully",
    });
  } catch (error) {
    console.error("Error withdrawing claim:", error);
    return NextResponse.json(
      { error: "Failed to withdraw claim" },
      { status: 500 }
    );
  }
}
