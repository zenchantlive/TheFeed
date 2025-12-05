/**
 * Bulk Enhance Resources API Endpoint
 *
 * Enhances multiple resources with AI in a single operation.
 * Processes resources sequentially to avoid rate limits.
 */

import { NextRequest, NextResponse } from "next/server";
import { enhanceResource } from "@/lib/admin-enhancer";
import { db } from "@/lib/db";
import { foodBanks } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { withAdminAuth } from "@/lib/auth/admin";

// Request body schema
interface BulkEnhanceRequest {
  resourceIds: string[];
}

export const POST = withAdminAuth<NextRequest>(async (req) => {
  try {
    // Parse request body
    const body = (await req.json()) as BulkEnhanceRequest;
    const { resourceIds } = body;

    // Validate input
    if (!resourceIds || !Array.isArray(resourceIds) || resourceIds.length === 0) {
      return NextResponse.json(
        { error: "resourceIds array is required" },
        { status: 400 }
      );
    }

    // Limit bulk operations to prevent timeouts
    if (resourceIds.length > 20) {
      return NextResponse.json(
        { error: "Cannot enhance more than 20 resources at once" },
        { status: 400 }
      );
    }

    let enhanced = 0;
    const errors: string[] = [];

    // Process each resource sequentially
    for (const resourceId of resourceIds) {
      try {
        // Enhance the resource
        const proposal = await enhanceResource(resourceId);

        // Apply the proposed changes automatically
        await db
          .update(foodBanks)
          .set({
            ...proposal.proposed,
            aiSummary: proposal.summary,
            confidenceScore: proposal.confidence,
            updatedAt: new Date(),
          })
          .where(eq(foodBanks.id, resourceId));

        enhanced++;
      } catch (error) {
        console.error(`Failed to enhance resource ${resourceId}:`, error);
        errors.push(resourceId);
      }
    }

    return NextResponse.json({
      success: true,
      enhanced,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully enhanced ${enhanced} of ${resourceIds.length} resources`,
    });
  } catch (error) {
    console.error("Bulk enhance error:", error);
    return NextResponse.json(
      { error: "Failed to enhance resources" },
      { status: 500 }
    );
  }
});
