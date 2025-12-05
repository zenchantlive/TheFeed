"use server";

import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth, AdminSession } from "@/lib/auth/admin";
import { enhanceResource, EnhancementError } from "@/lib/admin-enhancer";

type RouteContext = {
  params: Promise<{
    id?: string;
  }>;
};

export const POST = withAdminAuth<NextRequest, RouteContext>(
  async (req: NextRequest, context: AdminSession & RouteContext) => {
    const params = await context.params;
    const resourceId = params?.id;
    if (!resourceId) {
      return NextResponse.json({ error: "Resource id required" }, { status: 400 });
    }
    const focusField = req.nextUrl.searchParams.get("field");

    try {
      console.log(
        `[API] Starting enhancement for resource ${resourceId}, field: ${focusField || "all"
        }`
      );
      const proposal = await enhanceResource(resourceId, focusField);
      console.log(
        `[API] Enhancement successful, confidence: ${proposal.confidence}`
      );
      return NextResponse.json(proposal);
    } catch (error) {
      if (error instanceof EnhancementError) {
        console.error(
          `[API] EnhancementError: ${error.message} (${error.status})`
        );
        return NextResponse.json(
          { error: error.message },
          { status: error.status }
        );
      }

      console.error("[API] Enhance resource failed:", error);
      console.error("[API] Error details:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return NextResponse.json(
        { error: "Enhancement request failed. Please try again later." },
        { status: 500 }
      );
    }
  }
);
