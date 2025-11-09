import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import {
  getEventSignUpSlots,
  createSignUpSlot,
  getEventById,
} from "@/lib/event-queries";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/events/[id]/slots
 * Get all sign-up slots for an event with claims
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

    const slots = await getEventSignUpSlots(eventId);

    return NextResponse.json({ slots }, { status: 200 });
  } catch (error) {
    console.error("Error fetching sign-up slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch sign-up slots" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events/[id]/slots
 * Create a sign-up slot for an event (host only)
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

    // Check if user is the event host
    const event = await getEventById(eventId);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.hostId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the event host can create sign-up slots" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { slotName, maxClaims, description, sortOrder } = body;

    // Validate required fields
    if (
      !slotName ||
      typeof slotName !== "string" ||
      slotName.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Slot name is required" },
        { status: 400 }
      );
    }

    if (slotName.length > 100) {
      return NextResponse.json(
        { error: "Slot name exceeds maximum length of 100 characters" },
        { status: 400 }
      );
    }

    if (!maxClaims || typeof maxClaims !== "number" || maxClaims < 1) {
      return NextResponse.json(
        { error: "Max claims must be at least 1" },
        { status: 400 }
      );
    }

    if (maxClaims > 50) {
      return NextResponse.json(
        { error: "Max claims cannot exceed 50" },
        { status: 400 }
      );
    }

    // Validate description if provided
    if (description && typeof description !== "string") {
      return NextResponse.json(
        { error: "Description must be a string" },
        { status: 400 }
      );
    }

    if (description && description.length > 500) {
      return NextResponse.json(
        { error: "Description exceeds maximum length of 500 characters" },
        { status: 400 }
      );
    }

    // Validate sortOrder if provided
    if (sortOrder !== undefined && typeof sortOrder !== "number") {
      return NextResponse.json(
        { error: "Sort order must be a number" },
        { status: 400 }
      );
    }

    // Create the sign-up slot
    const slot = await createSignUpSlot({
      eventId,
      slotName: slotName.trim(),
      maxClaims,
      description: description ? description.trim() : undefined,
      sortOrder: sortOrder || 0,
    });

    return NextResponse.json({ success: true, slot }, { status: 201 });
  } catch (error) {
    console.error("Error creating sign-up slot:", error);
    return NextResponse.json(
      { error: "Failed to create sign-up slot" },
      { status: 500 }
    );
  }
}
