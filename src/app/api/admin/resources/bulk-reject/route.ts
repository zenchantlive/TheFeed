/**
 * Bulk Reject Resources API Endpoint
 *
 * Marks multiple resources as rejected in a single operation.
 * Rejected resources are hidden from public view but kept for audit trail.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { foodBanks } from "@/lib/schema";
import { inArray } from "drizzle-orm";
import { withAdminAuth } from "@/lib/auth/admin";

// Request body schema
interface BulkRejectRequest {
  resourceIds: string[];
  reason?: string;
}

export const POST = async (req: NextRequest) => {
  return withAdminAuth(req, async (req, { userId }) => {
    try {
      // Parse request body
      const body = (await req.json()) as BulkRejectRequest;
      const { resourceIds, reason } = body;

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
          { error: "Cannot reject more than 100 resources at once" },
          { status: 400 }
        );
      }

      // Update all resources to rejected status
      await db
        .update(foodBanks)
        .set({
          verificationStatus: "rejected",
          aiSummary: reason ? `Rejected: ${reason}` : "Rejected by admin",
          updatedAt: new Date(),
        })
        .where(inArray(foodBanks.id, resourceIds));

      return NextResponse.json({
        success: true,
        rejected: resourceIds.length,
        message: `Successfully rejected ${resourceIds.length} resources`,
      });
    } catch (error) {
      console.error("Bulk reject error:", error);
      return NextResponse.json(
        { error: "Failed to reject resources" },
        { status: 500 }
      );
    }
  });
};
