/**
 * Bulk Flag Resources API Endpoint
 *
 * Flags multiple resources for manual review (e.g., potential duplicates).
 * Flagged resources remain visible but are marked for admin attention.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { foodBanks } from "@/lib/schema";
import { inArray } from "drizzle-orm";
import { withAdminAuth } from "@/lib/auth/admin";

// Request body schema
interface BulkFlagRequest {
  resourceIds: string[];
  flag: "potential_duplicate" | "suspicious_data" | "needs_review";
  note?: string;
}

export const POST = async (req: NextRequest) => {
  return withAdminAuth(req, async (req, { userId }) => {
    try {
      // Parse request body
      const body = (await req.json()) as BulkFlagRequest;
      const { resourceIds, flag, note } = body;

      // Validate input
      if (!resourceIds || !Array.isArray(resourceIds) || resourceIds.length === 0) {
        return NextResponse.json(
          { error: "resourceIds array is required" },
          { status: 400 }
        );
      }

      if (!flag) {
        return NextResponse.json(
          { error: "flag type is required" },
          { status: 400 }
        );
      }

      // Limit bulk operations to prevent timeouts
      if (resourceIds.length > 100) {
        return NextResponse.json(
          { error: "Cannot flag more than 100 resources at once" },
          { status: 400 }
        );
      }

      // Build flag message
      const flagMessage = `Flagged as ${flag.replace(/_/g, " ")}${
        note ? `: ${note}` : ""
      }`;

      // Update all resources with flag
      await db
        .update(foodBanks)
        .set({
          verificationStatus: "flagged",
          aiSummary: flagMessage,
          updatedAt: new Date(),
        })
        .where(inArray(foodBanks.id, resourceIds));

      return NextResponse.json({
        success: true,
        flagged: resourceIds.length,
        message: `Successfully flagged ${resourceIds.length} resources`,
      });
    } catch (error) {
      console.error("Bulk flag error:", error);
      return NextResponse.json(
        { error: "Failed to flag resources" },
        { status: 500 }
      );
    }
  });
};
