import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { claimSignUpSlot, unclaimSignUpSlot } from "@/lib/event-queries";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/schema";
import { eq } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string; slotId: string }>;
};

/**
 * POST /api/events/[id]/slots/[slotId]/claim
 * Claim a sign-up slot (user signs up to bring something)
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slotId } = await context.params;
    const body = await req.json();
    const { details } = body;

    // Validate details
    if (
      !details ||
      typeof details !== "string" ||
      details.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Details are required (what you're bringing)" },
        { status: 400 }
      );
    }

    if (details.length > 200) {
      return NextResponse.json(
        { error: "Details exceed maximum length of 200 characters" },
        { status: 400 }
      );
    }

    // Ensure user profile exists
    let profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, session.user.id),
    });

    if (!profile) {
      [profile] = await db
        .insert(userProfiles)
        .values({
          userId: session.user.id,
        })
        .returning();
    }

    // Claim the slot
    const claim = await claimSignUpSlot({
      slotId,
      userId: session.user.id,
      details: details.trim(),
    });

    if (!claim) {
      return NextResponse.json(
        { error: "This slot is full. Please choose another slot." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        claim,
        message: "Successfully claimed slot!",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific error messages from claimSignUpSlot
      if (error.message === "You have already claimed this slot") {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      if (error.message === "Sign-up slot not found") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }

    console.error("Error claiming slot:", error);
    return NextResponse.json(
      { error: "Failed to claim slot" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[id]/slots/[slotId]/claim
 * Unclaim a sign-up slot (user cancels their sign-up)
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slotId } = await context.params;

    const success = await unclaimSignUpSlot(slotId, session.user.id);

    if (!success) {
      return NextResponse.json(
        { error: "No claim found to remove" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error unclaiming slot:", error);
    return NextResponse.json(
      { error: "Failed to unclaim slot" },
      { status: 500 }
    );
  }
}
