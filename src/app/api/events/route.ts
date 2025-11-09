import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import {
  getEvents,
  createEvent,
  type EventCursor,
} from "@/lib/event-queries";
import { createPost } from "@/lib/post-queries";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/events
 * Fetch events with cursor-based pagination and filters
 * Default: shows upcoming events ordered by start time (soonest first)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    // Parse cursor
    const cursorParam = searchParams.get("cursor");
    const cursor: EventCursor | null = cursorParam
      ? JSON.parse(cursorParam)
      : null;

    // Parse filters
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const eventType = searchParams.get("eventType") as
      | "potluck"
      | "volunteer"
      | null;
    const status = searchParams.get("status") as
      | "upcoming"
      | "in_progress"
      | "completed"
      | "cancelled"
      | null;
    const hostId = searchParams.get("hostId");
    const onlyUpcoming = searchParams.get("onlyUpcoming") !== "false"; // Default true

    // Fetch events
    const result = await getEvents({
      cursor,
      limit,
      eventType: eventType || undefined,
      status: status || undefined,
      hostId: hostId || undefined,
      onlyUpcoming,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events
 * Create a new event
 * Automatically creates a corresponding feed post with kind="event"
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      eventType,
      startTime,
      endTime,
      location,
      locationCoords,
      isPublicLocation,
      capacity,
    } = body;

    // Validate required fields
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        { error: "Title exceeds maximum length of 200 characters" },
        { status: 400 }
      );
    }

    if (
      !description ||
      typeof description !== "string" ||
      description.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    if (description.length > 5000) {
      return NextResponse.json(
        { error: "Description exceeds maximum length of 5000 characters" },
        { status: 400 }
      );
    }

    if (!eventType || !["potluck", "volunteer"].includes(eventType)) {
      return NextResponse.json(
        { error: "Valid event type is required (potluck or volunteer)" },
        { status: 400 }
      );
    }

    if (!startTime) {
      return NextResponse.json(
        { error: "Start time is required" },
        { status: 400 }
      );
    }

    if (!endTime) {
      return NextResponse.json(
        { error: "End time is required" },
        { status: 400 }
      );
    }

    if (
      !location ||
      typeof location !== "string" ||
      location.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Location is required" },
        { status: 400 }
      );
    }

    // Validate date logic
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime())) {
      return NextResponse.json(
        { error: "Invalid start time" },
        { status: 400 }
      );
    }

    if (isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid end time" }, { status: 400 });
    }

    if (start >= end) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    if (start < new Date()) {
      return NextResponse.json(
        { error: "Start time must be in the future" },
        { status: 400 }
      );
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

    // Ensure user profile exists (create if needed)
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

    // Create the feed post first (events link to posts)
    const eventIcon = eventType === "potluck" ? "🎉" : "🤝";
    const postContent = `${eventIcon} ${title}\n\n${description}`;

    const post = await createPost({
      userId: session.user.id,
      content: postContent,
      kind: "event",
      location: location.trim(),
      locationCoords: locationCoords || undefined,
      expiresAt: start, // Event post expires when event starts
      metadata: {
        tags: [eventType],
      },
    });

    // Create the event
    const event = await createEvent({
      postId: post.id,
      hostId: session.user.id,
      title: title.trim(),
      description: description.trim(),
      eventType,
      startTime: start,
      endTime: end,
      location: location.trim(),
      locationCoords: locationCoords || undefined,
      isPublicLocation: isPublicLocation ?? true,
      capacity: capacity ? parseInt(capacity, 10) : null,
    });

    return NextResponse.json(
      { success: true, event, post },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
