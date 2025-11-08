import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getEventById, updateEvent, deleteEvent } from "@/lib/event-queries";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/events/[id]
 * Fetch a single event by ID with full details (host, RSVPs, sign-up slots)
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const event = await getEventById(id);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event, { status: 200 });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/events/[id]
 * Update an event (only by the host)
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Check if event exists and user is the host
    const existingEvent = await getEventById(id);

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (existingEvent.hostId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the event host can edit this event" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      startTime,
      endTime,
      location,
      locationCoords,
      isPublicLocation,
      capacity,
      status,
      isVerified,
    } = body;

    // Validate fields if provided
    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0) {
        return NextResponse.json(
          { error: "Title cannot be empty" },
          { status: 400 }
        );
      }
      if (title.length > 200) {
        return NextResponse.json(
          { error: "Title exceeds maximum length of 200 characters" },
          { status: 400 }
        );
      }
    }

    if (description !== undefined) {
      if (typeof description !== "string" || description.trim().length === 0) {
        return NextResponse.json(
          { error: "Description cannot be empty" },
          { status: 400 }
        );
      }
      if (description.length > 5000) {
        return NextResponse.json(
          { error: "Description exceeds maximum length of 5000 characters" },
          { status: 400 }
        );
      }
    }

    if (location !== undefined) {
      if (typeof location !== "string" || location.trim().length === 0) {
        return NextResponse.json(
          { error: "Location cannot be empty" },
          { status: 400 }
        );
      }
    }

    // Validate date logic if both provided
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (isNaN(start.getTime())) {
        return NextResponse.json(
          { error: "Invalid start time" },
          { status: 400 }
        );
      }

      if (isNaN(end.getTime())) {
        return NextResponse.json(
          { error: "Invalid end time" },
          { status: 400 }
        );
      }

      if (start >= end) {
        return NextResponse.json(
          { error: "End time must be after start time" },
          { status: 400 }
        );
      }
    }

    // Validate capacity if provided
    if (capacity !== null && capacity !== undefined) {
      const capacityNum = parseInt(capacity, 10);
      if (isNaN(capacityNum) || capacityNum < 1) {
        return NextResponse.json(
          { error: "Capacity must be a positive number" },
          { status: 400 }
        );
      }
    }

    // Validate status if provided
    if (
      status &&
      !["upcoming", "in_progress", "completed", "cancelled"].includes(status)
    ) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Validate location coordinates if provided
    if (locationCoords) {
      if (
        typeof locationCoords.lat !== "number" ||
        typeof locationCoords.lng !== "number"
      ) {
        return NextResponse.json(
          { error: "Invalid location coordinates" },
          { status: 400 }
        );
      }

      if (
        locationCoords.lat < -90 ||
        locationCoords.lat > 90 ||
        locationCoords.lng < -180 ||
        locationCoords.lng > 180
      ) {
        return NextResponse.json(
          { error: "Location coordinates out of valid range" },
          { status: 400 }
        );
      }
    }

    // Update the event
    const updated = await updateEvent(id, {
      title: title ? title.trim() : undefined,
      description: description ? description.trim() : undefined,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      location: location ? location.trim() : undefined,
      locationCoords: locationCoords || undefined,
      isPublicLocation:
        isPublicLocation !== undefined ? isPublicLocation : undefined,
      capacity:
        capacity !== null && capacity !== undefined
          ? parseInt(capacity, 10)
          : undefined,
      status: status || undefined,
      isVerified: isVerified !== undefined ? isVerified : undefined,
    });

    return NextResponse.json(
      { success: true, event: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[id]
 * Cancel an event (only by the host)
 * This will cascade delete all RSVPs, slots, and claims
 * Note: The associated post remains (for history) but event is marked as cancelled
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Check if event exists and user is the host
    const existingEvent = await getEventById(id);

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (existingEvent.hostId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the event host can delete this event" },
        { status: 403 }
      );
    }

    // Delete the event (cascade deletes RSVPs, slots, claims, etc.)
    await deleteEvent(id);

    // Note: Associated post is NOT deleted, allowing event history to remain
    // TODO: Send notifications to all RSVPed users that event was cancelled

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
