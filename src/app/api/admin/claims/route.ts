/**
 * Admin Provider Claims API
 * Lists and filters provider claims for admin review
 */

import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { providerClaims } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

type ClaimStatus = "pending" | "approved" | "rejected" | "withdrawn" | "all";



export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const status = (searchParams.get("status") || "pending") as ClaimStatus;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || "";

    // Validate pagination params
    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit)); // Max 100 per page
    const offset = (validPage - 1) * validLimit;

    // Build where condition for status filter
    const whereCondition =
      status !== "all" ? eq(providerClaims.status, status) : undefined;

    // Fetch claims using Drizzle query API for type safety
    const claims = await db.query.providerClaims.findMany({
      where: whereCondition,
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
      limit: validLimit,
      offset,
    });

    // Filter by search term on client side if provided
    let filteredClaims = claims;
    if (search.trim()) {
      const searchLower = search.trim().toLowerCase();
      filteredClaims = claims.filter(
        (claim) =>
          claim.resource.name.toLowerCase().includes(searchLower) ||
          claim.claimer.name.toLowerCase().includes(searchLower)
      );
    }

    // Get total count for pagination
    const allClaims = await db.query.providerClaims.findMany({
      where: whereCondition,
      columns: { id: true },
    });
    const count = allClaims.length;

    return NextResponse.json({
      claims: filteredClaims,
      pagination: {
        page: validPage,
        limit: validLimit,
        total: count,
        totalPages: Math.ceil(count / validLimit),
      },
    });
  } catch (error) {
    console.error("Error fetching claims:", error);
    return NextResponse.json(
      { error: "Failed to fetch claims" },
      { status: 500 }
    );
  }
});
