/**
 * Bulk Verify Resources API Endpoint
 *
 * Marks multiple resources as admin-verified in a single operation.
 * Used by the verification workspace for batch approvals.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { foodBanks } from "@/lib/schema";
import { inArray } from "drizzle-orm";
import { withAdminAuth } from "@/lib/auth/admin";

// Request body schema
interface BulkVerifyRequest {
  resourceIds: string[];
}

export const POST = async (req: NextRequest) => {
  return withAdminAuth(req, async (req, { userId }) => {
    try {
      // Parse request body
      const body = (await req.json()) as BulkVerifyRequest;
      const { resourceIds } = body;

      // Validate input
      if (!resourceIds || !Array.isArray(resourceIds) || resourceIds.length === 0) {
        return NextResponse.json(
          { error: "resourceIds array is required" },
          { status: 400 }
        );
      }

      // Limit bulk operations to prevent timeouts
      if (resourceIds.length > 100) {
        return NextResponse.json(
          { error: "Cannot verify more than 100 resources at once" },
          { status: 400 }
        );
      }

      // Update all resources to admin-verified status
      await db
        .update(foodBanks)
        .set({
          verificationStatus: "official",
          adminVerifiedBy: userId,
          adminVerifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(inArray(foodBanks.id, resourceIds));

      return NextResponse.json({
        success: true,
        verified: resourceIds.length,
        message: `Successfully verified ${resourceIds.length} resources`,
      });
    } catch (error) {
      console.error("Bulk verify error:", error);
      return NextResponse.json(
        { error: "Failed to verify resources" },
        { status: 500 }
      );
    }
  });
};
