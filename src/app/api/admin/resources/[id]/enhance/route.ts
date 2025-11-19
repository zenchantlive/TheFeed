"use server";

import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { enhanceResource, EnhancementError } from "@/lib/admin-enhancer";

type RouteContext = {
  params: Promise<{
    id?: string;
  }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  return withAdminAuth(req, async (request) => {
    const params = await context.params;
    const resourceId = params?.id;
    if (!resourceId) {
      return NextResponse.json({ error: "Resource id required" }, { status: 400 });
    }
    const focusField = request.nextUrl.searchParams.get("field");

    try {
      const proposal = await enhanceResource(resourceId, focusField);
      return NextResponse.json(proposal);
    } catch (error) {
      if (error instanceof EnhancementError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }

      console.error("Enhance resource failed:", error);
      return NextResponse.json(
        { error: "Enhancement request failed. Please try again later." },
        { status: 500 }
      );
    }
  });
}
