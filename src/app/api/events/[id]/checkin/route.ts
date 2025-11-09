import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import {
  checkInAttendee,
  undoCheckInAttendee,
} from "@/lib/event-queries";
import { db } from "@/lib/db";
import { events } from "@/lib/schema";
import { eq } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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
    const { userId, checkedIn, notes } = body ?? {};

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (typeof checkedIn !== "boolean") {
      return NextResponse.json(
        { error: "checkedIn flag is required" },
        { status: 400 }
      );
    }

    const eventRecord = await db.query.events.findFirst({
      columns: {
        id: events.id,
        hostId: events.hostId,
      },
      where: eq(events.id, eventId),
    });

    if (!eventRecord) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    if (eventRecord.hostId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the host can manage check-ins" },
        { status: 403 }
      );
    }

    if (checkedIn) {
      const attendance = await checkInAttendee({
        eventId,
        attendeeId: userId,
        notes: typeof notes === "string" ? notes : undefined,
      });
      return NextResponse.json(
        { success: true, attendance },
        { status: 200 }
      );
    }

    await undoCheckInAttendee(eventId, userId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { error: "Failed to update attendance" },
      { status: 500 }
    );
  }
}
