import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import {
  createOrUpdateRsvp,
  cancelRsvp,
  getEventRsvps,
} from "@/lib/event-queries";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/schema";
import { eq } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/events/[id]/rsvp
 * Get all RSVPs for an event
 * Query params: ?status=attending|waitlisted|declined (optional)
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await context.params;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as
      | "attending"
      | "waitlisted"
      | "declined"
      | null;

    // Validate status if provided
    if (status && !["attending", "waitlisted", "declined"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const rsvps = await getEventRsvps(
      eventId,
      status || undefined
    );

    return NextResponse.json({ rsvps }, { status: 200 });
  } catch (error) {
    console.error("Error fetching RSVPs:", error);
    return NextResponse.json(
      { error: "Failed to fetch RSVPs" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events/[id]/rsvp
 * Create or update an RSVP for an event
 * Handles capacity limits and waitlist logic automatically
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await context.params;
    const body = await req.json();
    const { guestCount, notes } = body;

    // Validate guest count
    if (!guestCount || typeof guestCount !== "number" || guestCount < 1) {
      return NextResponse.json(
        { error: "Guest count must be at least 1" },
        { status: 400 }
      );
    }

    if (guestCount > 10) {
      return NextResponse.json(
        { error: "Guest count cannot exceed 10" },
        { status: 400 }
      );
    }

    // Validate notes if provided
    if (notes && typeof notes !== "string") {
      return NextResponse.json(
        { error: "Notes must be a string" },
        { status: 400 }
      );
    }

    if (notes && notes.length > 500) {
      return NextResponse.json(
        { error: "Notes exceed maximum length of 500 characters" },
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

    // Create or update RSVP (handles capacity/waitlist logic)
    const result = await createOrUpdateRsvp({
      eventId,
      userId: session.user.id,
      guestCount,
      notes: notes || undefined,
    });

    return NextResponse.json(
      {
        success: true,
        rsvp: result.rsvp,
        status: result.status,
        message:
          result.status === "waitlisted"
            ? "Event is at capacity. You have been added to the waitlist."
            : "RSVP confirmed!",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating RSVP:", error);
    return NextResponse.json(
      { error: "Failed to create RSVP" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[id]/rsvp
 * Cancel an RSVP for an event
 * If user was attending and event is full, promotes first waitlisted user
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await context.params;

    const success = await cancelRsvp(eventId, session.user.id);

    if (!success) {
      return NextResponse.json(
        { error: "No RSVP found to cancel" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error cancelling RSVP:", error);
    return NextResponse.json(
      { error: "Failed to cancel RSVP" },
      { status: 500 }
    );
  }
}
