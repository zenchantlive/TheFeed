import { db } from "./db";
import {
  events,
  eventRsvps,
  signUpSlots,
  signUpClaims,
  eventRecurrence,
  eventAttendance,
  user,
  userProfiles,
} from "./schema";
import { eq, desc, and, lt, or, gte, lte, sql, isNotNull, inArray } from "drizzle-orm";

// Type definitions - inferred from schema
export type EventRecord = typeof events.$inferSelect;
export type EventRsvpRecord = typeof eventRsvps.$inferSelect;
export type SignUpSlotRecord = typeof signUpSlots.$inferSelect;
export type SignUpClaimRecord = typeof signUpClaims.$inferSelect;
export type EventRecurrenceRecord = typeof eventRecurrence.$inferSelect;
export type EventAttendanceRecord = typeof eventAttendance.$inferSelect;

/**
 * Event with host details (name, image, karma, role)
 */
export type EventWithHost = EventRecord & {
  host: {
    id: string;
    name: string;
    image: string | null;
    karma: number;
    role: string;
  };
};

/**
 * RSVP with user details
 */
export type RsvpWithUser = EventRsvpRecord & {
  user: {
    id: string;
    name: string;
    image: string | null;
  };
};

/**
 * Sign-up slot with all claims and user details
 */
export type SlotWithClaims = SignUpSlotRecord & {
  claims: Array<
    SignUpClaimRecord & {
      user: {
        id: string;
        name: string;
        image: string | null;
      };
    }
  >;
};

/**
 * Complete event details with host, RSVPs, and sign-up slots
 */
export type EventDetails = EventWithHost & {
  rsvps: RsvpWithUser[];
  signUpSlots: SlotWithClaims[];
  attendance: EventAttendanceRecord[];
};

/**
 * Cursor for pagination (createdAt, id)
 */
export type EventCursor = {
  createdAt: string;
  id: string;
};

/**
 * Parameters for getEvents query
 */
export type GetEventsParams = {
  cursor?: EventCursor | null;
  limit?: number;
  eventType?: "potluck" | "volunteer"; // Filter by event type
  status?: "upcoming" | "in_progress" | "completed" | "cancelled"; // Filter by status
  hostId?: string; // Filter by specific host
  onlyUpcoming?: boolean; // Only show events that haven't started yet
  startAfter?: Date; // Start time is on/after this date
  startBefore?: Date; // Start time is on/before this date
  onlyWithCoords?: boolean; // Only events with map coordinates
};

/**
 * Result from getEvents query
 */
export type GetEventsResult = {
  items: EventWithHost[];
  nextCursor: EventCursor | null;
};

/**
 * Get events with cursor-based pagination and filters
 * Default: shows upcoming events ordered by start time (soonest first)
 */
export async function getEvents({
  cursor = null,
  limit = 20,
  eventType,
  status,
  hostId,
  onlyUpcoming = true,
  startAfter,
  startBefore,
  onlyWithCoords = false,
}: GetEventsParams = {}): Promise<GetEventsResult> {
  // Build WHERE conditions
  const conditions = [];

  // Cursor pagination (based on startTime, then id)
  if (cursor) {
    conditions.push(
      or(
        lt(events.startTime, new Date(cursor.createdAt)),
        and(
          eq(events.startTime, new Date(cursor.createdAt)),
          lt(events.id, cursor.id)
        )
      )
    );
  }

  // Filter by event type
  if (eventType) {
    conditions.push(eq(events.eventType, eventType));
  }

  // Filter by status
  if (status) {
    conditions.push(eq(events.status, status));
  }

  // Filter by host
  if (hostId) {
    conditions.push(eq(events.hostId, hostId));
  }

  // Only show upcoming events (startTime >= now)
  if (onlyUpcoming) {
    conditions.push(gte(events.startTime, new Date()));
  }

  if (startAfter) {
    conditions.push(gte(events.startTime, startAfter));
  }

  if (startBefore) {
    conditions.push(lte(events.startTime, startBefore));
  }

  if (onlyWithCoords) {
    conditions.push(isNotNull(events.locationCoords));
  }

  // Execute query with joins to get host details
  const rows = await db
    .select({
      event: events,
      hostName: user.name,
      hostImage: user.image,
      hostId: user.id,
      hostKarma: userProfiles.karma,
      hostRole: userProfiles.role,
    })
    .from(events)
    .leftJoin(user, eq(events.hostId, user.id))
    .leftJoin(userProfiles, eq(user.id, userProfiles.userId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(events.startTime), desc(events.id))
    .limit(limit + 1); // Fetch one extra to determine if there's a next page

  // Separate results and next cursor
  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).map((row) => ({
    ...row.event,
    host: {
      id: row.hostId || "",
      name: row.hostName || "Unknown Host",
      image: row.hostImage,
      karma: row.hostKarma || 0,
      role: row.hostRole || "neighbor",
    },
  }));

  const nextCursor = hasMore
    ? {
        createdAt: rows[limit - 1].event.startTime!.toISOString(),
        id: rows[limit - 1].event.id,
      }
    : null;

  return { items, nextCursor };
}

export type GetEventsWithinRangeParams = {
  start: Date;
  end: Date;
  eventType?: "potluck" | "volunteer";
  onlyWithCoords?: boolean;
};

export async function getEventsWithinRange({
  start,
  end,
  eventType,
  onlyWithCoords = false,
}: GetEventsWithinRangeParams): Promise<EventWithHost[]> {
  const conditions = [gte(events.startTime, start), lt(events.startTime, end)];

  if (eventType) {
    conditions.push(eq(events.eventType, eventType));
  }

  if (onlyWithCoords) {
    conditions.push(isNotNull(events.locationCoords));
  }

  const rows = await db
    .select({
      event: events,
      hostName: user.name,
      hostImage: user.image,
      hostId: user.id,
      hostKarma: userProfiles.karma,
      hostRole: userProfiles.role,
    })
    .from(events)
    .leftJoin(user, eq(events.hostId, user.id))
    .leftJoin(userProfiles, eq(user.id, userProfiles.userId))
    .where(and(...conditions))
    .orderBy(events.startTime, events.id);

  return rows.map((row) => ({
    ...row.event,
    host: {
      id: row.hostId || "",
      name: row.hostName || "Unknown Host",
      image: row.hostImage,
      karma: row.hostKarma || 0,
      role: row.hostRole || "neighbor",
    },
  }));
}

/**
 * Get a single event by ID with full details (host, RSVPs, sign-up slots)
 */
export async function getEventById(
  id: string
): Promise<EventDetails | undefined> {
  // Fetch event with host details
  const eventRows = await db
    .select({
      event: events,
      hostName: user.name,
      hostImage: user.image,
      hostId: user.id,
      hostKarma: userProfiles.karma,
      hostRole: userProfiles.role,
    })
    .from(events)
    .leftJoin(user, eq(events.hostId, user.id))
    .leftJoin(userProfiles, eq(user.id, userProfiles.userId))
    .where(eq(events.id, id))
    .limit(1);

  if (eventRows.length === 0) {
    return undefined;
  }

  const eventRow = eventRows[0];

  // Fetch RSVPs with user details
  const rsvpRows = await db
    .select({
      rsvp: eventRsvps,
      userName: user.name,
      userImage: user.image,
      userId: user.id,
    })
    .from(eventRsvps)
    .leftJoin(user, eq(eventRsvps.userId, user.id))
    .where(eq(eventRsvps.eventId, id))
    .orderBy(desc(eventRsvps.createdAt));

  const rsvps: RsvpWithUser[] = rsvpRows.map((row) => ({
    ...row.rsvp,
    user: {
      id: row.userId || "",
      name: row.userName || "Unknown User",
      image: row.userImage,
    },
  }));

  // Fetch sign-up slots with claims
  const slotRows = await db
    .select({
      slot: signUpSlots,
    })
    .from(signUpSlots)
    .where(eq(signUpSlots.eventId, id))
    .orderBy(signUpSlots.sortOrder);

  const slotIds = slotRows.map((row) => row.slot.id);

  let claimRowsBySlot: Record<string, SlotWithClaims["claims"]> = {};
  if (slotIds.length > 0) {
    const claimRows = await db
      .select({
        claim: signUpClaims,
        userName: user.name,
        userImage: user.image,
        userId: user.id,
      })
      .from(signUpClaims)
      .leftJoin(user, eq(signUpClaims.userId, user.id))
      .where(inArray(signUpClaims.slotId, slotIds))
      .orderBy(desc(signUpClaims.createdAt));

    claimRowsBySlot = claimRows.reduce<Record<string, SlotWithClaims["claims"]>>(
      (acc, row) => {
        const slotId = row.claim.slotId;
        if (!acc[slotId]) {
          acc[slotId] = [];
        }
        acc[slotId].push({
          ...row.claim,
          user: {
            id: row.userId || "",
            name: row.userName || "Unknown User",
            image: row.userImage,
          },
        });
        return acc;
      },
      {}
    );
  }

  const signUpSlotsWithClaims: SlotWithClaims[] = slotRows.map((slotRow) => ({
    ...slotRow.slot,
    claims: claimRowsBySlot[slotRow.slot.id] ?? [],
  }));

  const attendanceRows = await db
    .select({
      attendance: eventAttendance,
    })
    .from(eventAttendance)
    .where(eq(eventAttendance.eventId, id));

  return {
    ...eventRow.event,
    host: {
      id: eventRow.hostId || "",
      name: eventRow.hostName || "Unknown Host",
      image: eventRow.hostImage,
      karma: eventRow.hostKarma || 0,
      role: eventRow.hostRole || "neighbor",
    },
    rsvps,
    signUpSlots: signUpSlotsWithClaims,
    attendance: attendanceRows.map((row) => row.attendance),
  };
}

/**
 * Create a new event
 * Note: You must also create a corresponding post with kind="event"
 */
export async function createEvent(data: {
  postId: string;
  hostId: string;
  title: string;
  description: string;
  eventType: "potluck" | "volunteer";
  startTime: Date;
  endTime: Date;
  location: string;
  locationCoords?: { lat: number; lng: number };
  isPublicLocation?: boolean;
  capacity?: number | null;
}): Promise<EventRecord> {
  const [event] = await db
    .insert(events)
    .values({
      ...data,
      isPublicLocation: data.isPublicLocation ?? true,
      capacity: data.capacity ?? null,
    })
    .returning();

  return event;
}

/**
 * Update an event (host only - authorization should be checked in API route)
 */
export async function updateEvent(
  id: string,
  data: {
    title?: string;
    description?: string;
    startTime?: Date;
    endTime?: Date;
    location?: string;
    locationCoords?: { lat: number; lng: number };
    isPublicLocation?: boolean;
    capacity?: number | null;
    status?: "upcoming" | "in_progress" | "completed" | "cancelled";
    isVerified?: boolean;
  }
): Promise<EventRecord | undefined> {
  const [updated] = await db
    .update(events)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(events.id, id))
    .returning();

  return updated;
}

/**
 * Delete (cancel) an event
 * Note: This will cascade delete all RSVPs, slots, and claims
 */
export async function deleteEvent(id: string): Promise<boolean> {
  const [deleted] = await db.delete(events).where(eq(events.id, id)).returning();
  return !!deleted;
}

// =============================================================================
// RSVP Management Functions
// =============================================================================

/**
 * Create or update an RSVP for an event
 * Handles capacity limits and waitlist logic
 */
export async function createOrUpdateRsvp(data: {
  eventId: string;
  userId: string;
  guestCount: number;
  notes?: string;
}): Promise<{
  rsvp: EventRsvpRecord;
  status: "attending" | "waitlisted";
}> {
  // Get current event to check capacity
  const event = await db.query.events.findFirst({
    where: eq(events.id, data.eventId),
  });

  if (!event) {
    throw new Error("Event not found");
  }

  // Determine status based on capacity
  let status: "attending" | "waitlisted" = "attending";

  if (event.capacity !== null) {
    // Calculate total guests including this RSVP
    const totalGuests = event.rsvpCount + data.guestCount;

    if (totalGuests > event.capacity) {
      status = "waitlisted";
    }
  }

  // Check if RSVP already exists
  const existingRsvp = await db.query.eventRsvps.findFirst({
    where: and(
      eq(eventRsvps.eventId, data.eventId),
      eq(eventRsvps.userId, data.userId)
    ),
  });

  let rsvp: EventRsvpRecord;

  if (existingRsvp) {
    // Update existing RSVP
    const [updated] = await db
      .update(eventRsvps)
      .set({
        status,
        guestCount: data.guestCount,
        notes: data.notes,
        updatedAt: new Date(),
      })
      .where(eq(eventRsvps.id, existingRsvp.id))
      .returning();
    rsvp = updated;

    // Update counts (recalculate to handle guest count changes)
    await recalculateEventCounts(data.eventId);
  } else {
    // Create new RSVP
    const [created] = await db
      .insert(eventRsvps)
      .values({
        ...data,
        status,
      })
      .returning();
    rsvp = created;

    // Increment counts
    if (status === "attending") {
      await db
        .update(events)
        .set({ rsvpCount: sql`${events.rsvpCount} + ${data.guestCount}` })
        .where(eq(events.id, data.eventId));
    } else {
      await db
        .update(events)
        .set({
          waitlistCount: sql`${events.waitlistCount} + ${data.guestCount}`,
        })
        .where(eq(events.id, data.eventId));
    }
  }

  return { rsvp, status };
}

/**
 * Cancel an RSVP
 * If user was attending and event is full, promote first waitlisted user
 */
export async function cancelRsvp(
  eventId: string,
  userId: string
): Promise<boolean> {
  const rsvp = await db.query.eventRsvps.findFirst({
    where: and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)),
  });

  if (!rsvp) {
    return false;
  }

  // Delete the RSVP
  await db
    .delete(eventRsvps)
    .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)));

  // Decrement counts
  if (rsvp.status === "attending") {
    await db
      .update(events)
      .set({ rsvpCount: sql`${events.rsvpCount} - ${rsvp.guestCount}` })
      .where(eq(events.id, eventId));

    // Promote waitlisted users if space available
    await promoteFromWaitlist(eventId);
  } else if (rsvp.status === "waitlisted") {
    await db
      .update(events)
      .set({
        waitlistCount: sql`${events.waitlistCount} - ${rsvp.guestCount}`,
      })
      .where(eq(events.id, eventId));
  }

  return true;
}

/**
 * Get RSVPs for an event, optionally filtered by status
 */
export async function getEventRsvps(
  eventId: string,
  status?: "attending" | "waitlisted" | "declined"
): Promise<RsvpWithUser[]> {
  const conditions = [eq(eventRsvps.eventId, eventId)];
  if (status) {
    conditions.push(eq(eventRsvps.status, status));
  }

  const rows = await db
    .select({
      rsvp: eventRsvps,
      userName: user.name,
      userImage: user.image,
      userId: user.id,
    })
    .from(eventRsvps)
    .leftJoin(user, eq(eventRsvps.userId, user.id))
    .where(and(...conditions))
    .orderBy(desc(eventRsvps.createdAt));

  return rows.map((row) => ({
    ...row.rsvp,
    user: {
      id: row.userId || "",
      name: row.userName || "Unknown User",
      image: row.userImage,
    },
  }));
}

// =============================================================================
// Sign-Up Slot Management Functions
// =============================================================================

/**
 * Create a sign-up slot for an event (host only)
 */
export async function createSignUpSlot(data: {
  eventId: string;
  slotName: string;
  maxClaims: number;
  description?: string;
  sortOrder?: number;
}): Promise<SignUpSlotRecord> {
  const [slot] = await db
    .insert(signUpSlots)
    .values({
      ...data,
      sortOrder: data.sortOrder ?? 0,
    })
    .returning();

  return slot;
}

/**
 * Claim a sign-up slot (user signs up to bring something)
 */
export async function claimSignUpSlot(data: {
  slotId: string;
  userId: string;
  details: string;
}): Promise<SignUpClaimRecord | null> {
  // Get slot to check maxClaims
  const slot = await db.query.signUpSlots.findFirst({
    where: eq(signUpSlots.id, data.slotId),
  });

  if (!slot) {
    throw new Error("Sign-up slot not found");
  }

  // Check if slot is full
  if (slot.claimCount >= slot.maxClaims) {
    return null; // Slot is full
  }

  // Check if user already claimed this slot
  const existingClaim = await db.query.signUpClaims.findFirst({
    where: and(
      eq(signUpClaims.slotId, data.slotId),
      eq(signUpClaims.userId, data.userId)
    ),
  });

  if (existingClaim) {
    throw new Error("You have already claimed this slot");
  }

  // Create claim
  const [claim] = await db.insert(signUpClaims).values(data).returning();

  // Increment slot claim count
  await db
    .update(signUpSlots)
    .set({ claimCount: sql`${signUpSlots.claimCount} + 1` })
    .where(eq(signUpSlots.id, data.slotId));

  return claim;
}

/**
 * Unclaim a sign-up slot (user cancels their sign-up)
 */
export async function unclaimSignUpSlot(
  slotId: string,
  userId: string
): Promise<boolean> {
  const claim = await db.query.signUpClaims.findFirst({
    where: and(
      eq(signUpClaims.slotId, slotId),
      eq(signUpClaims.userId, userId)
    ),
  });

  if (!claim) {
    return false;
  }

  // Delete claim
  await db
    .delete(signUpClaims)
    .where(
      and(eq(signUpClaims.slotId, slotId), eq(signUpClaims.userId, userId))
    );

  // Decrement slot claim count
  await db
    .update(signUpSlots)
    .set({ claimCount: sql`${signUpSlots.claimCount} - 1` })
    .where(eq(signUpSlots.id, slotId));

  return true;
}

/**
 * Get all sign-up slots for an event with claims
 */
export async function getEventSignUpSlots(
  eventId: string
): Promise<SlotWithClaims[]> {
  const slotRows = await db
    .select({
      slot: signUpSlots,
    })
    .from(signUpSlots)
    .where(eq(signUpSlots.eventId, eventId))
    .orderBy(signUpSlots.sortOrder);

  const slotIds = slotRows.map((row) => row.slot.id);

  let claimsBySlot: Record<string, SlotWithClaims["claims"]> = {};
  if (slotIds.length > 0) {
    const claimRows = await db
      .select({
        claim: signUpClaims,
        userName: user.name,
        userImage: user.image,
        userId: user.id,
      })
      .from(signUpClaims)
      .leftJoin(user, eq(signUpClaims.userId, user.id))
      .where(inArray(signUpClaims.slotId, slotIds))
      .orderBy(desc(signUpClaims.createdAt));

    claimsBySlot = claimRows.reduce<Record<string, SlotWithClaims["claims"]>>(
      (acc, row) => {
        const slotId = row.claim.slotId;
        if (!acc[slotId]) {
          acc[slotId] = [];
        }
        acc[slotId].push({
          ...row.claim,
          user: {
            id: row.userId || "",
            name: row.userName || "Unknown User",
            image: row.userImage,
          },
        });
        return acc;
      },
      {}
    );
  }

  return slotRows.map((slotRow) => ({
    ...slotRow.slot,
    claims: claimsBySlot[slotRow.slot.id] ?? [],
  }));
}

type CheckInParams = {
  eventId: string;
  attendeeId: string;
  notes?: string | null;
};

export async function checkInAttendee({
  eventId,
  attendeeId,
  notes,
}: CheckInParams): Promise<EventAttendanceRecord> {
  const existingRsvp = await db.query.eventRsvps.findFirst({
    where: and(
      eq(eventRsvps.eventId, eventId),
      eq(eventRsvps.userId, attendeeId)
    ),
  });

  if (!existingRsvp || existingRsvp.status !== "attendee") {
    throw new Error("Attendee must RSVP before check-in");
  }

  const existingAttendance = await db.query.eventAttendance.findFirst({
    where: and(
      eq(eventAttendance.eventId, eventId),
      eq(eventAttendance.userId, attendeeId)
    ),
  });

  if (existingAttendance) {
    const [updated] = await db
      .update(eventAttendance)
      .set({
        notes: typeof notes === "string" ? notes : existingAttendance.notes,
        checkedInAt: new Date(),
      })
      .where(eq(eventAttendance.id, existingAttendance.id))
      .returning();
    return updated;
  }

  const [attendanceRecord] = await db
    .insert(eventAttendance)
    .values({
      eventId,
      userId: attendeeId,
      notes: typeof notes === "string" ? notes : null,
    })
    .returning();

  return attendanceRecord;
}

export async function undoCheckInAttendee(
  eventId: string,
  attendeeId: string
): Promise<boolean> {
  const existingAttendance = await db.query.eventAttendance.findFirst({
    where: and(
      eq(eventAttendance.eventId, eventId),
      eq(eventAttendance.userId, attendeeId)
    ),
  });

  if (!existingAttendance) {
    return false;
  }

  await db.delete(eventAttendance).where(eq(eventAttendance.id, existingAttendance.id));
  return true;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Recalculate event RSVP and waitlist counts
 * Used when updating RSVPs with different guest counts
 */
async function recalculateEventCounts(eventId: string): Promise<void> {
  const rsvps = await db
    .select()
    .from(eventRsvps)
    .where(eq(eventRsvps.eventId, eventId));

  const rsvpCount = rsvps
    .filter((r) => r.status === "attending")
    .reduce((sum, r) => sum + r.guestCount, 0);

  const waitlistCount = rsvps
    .filter((r) => r.status === "waitlisted")
    .reduce((sum, r) => sum + r.guestCount, 0);

  await db
    .update(events)
    .set({ rsvpCount, waitlistCount })
    .where(eq(events.id, eventId));
}

/**
 * Promote waitlisted users to attending when space becomes available
 * Called after an RSVP is cancelled
 */
async function promoteFromWaitlist(eventId: string): Promise<void> {
  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event || event.capacity === null) {
    return; // No capacity limit or event not found
  }

  // Get waitlisted RSVPs in order
  const waitlisted = await db
    .select()
    .from(eventRsvps)
    .where(
      and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.status, "waitlisted"))
    )
    .orderBy(eventRsvps.createdAt);

  // Promote as many as capacity allows
  for (const rsvp of waitlisted) {
    if (event.rsvpCount + rsvp.guestCount <= event.capacity) {
      // Promote to attending
      await db
        .update(eventRsvps)
        .set({ status: "attending", updatedAt: new Date() })
        .where(eq(eventRsvps.id, rsvp.id));

      // Update counts
      await db
        .update(events)
        .set({
          rsvpCount: sql`${events.rsvpCount} + ${rsvp.guestCount}`,
          waitlistCount: sql`${events.waitlistCount} - ${rsvp.guestCount}`,
        })
        .where(eq(events.id, eventId));

      // TODO: Send notification to user that they've been promoted
    } else {
      break; // No more space
    }
  }
}

