---
title: "Part 4: Event Hosting - Enabling Community Potlucks"
series: "TheFeed Development Journey"
part: 4
date: 2025-11-08
updated: 2025-12-27
tags: ["events", "phase-3", "hosting", "coordination"]
reading_time: "10 min"
commits_covered: "5a0cbe4..2dc7f6d"
---

## Where We Are

One day after launching community posts, the team realized something: users were already trying to organize food events in the comments. "Potluck next Saturday?" "Can anyone host?" "I have extra garden produce."

So on November 8, 2025, the team shipped **Phase 3A & 3B: Event Hosting** in a single compressed push (`5a0cbe4` through `2dc7f6d`). This was the first time they skipped phases (Phase 2 being the more incremental social feature additions) to address immediate user intent.

## The Phase 3 Vision

Events weren't just a feature—they were the cornerstone of the community strategy:

1. **Potlucks**: Neighbors share meals together
2. **Volunteer Shifts**: Food bank donation drives, community cooking
3. **Distribution Events**: "Free produce exchange Sat 2pm at Oak Park"
4. **Social Trust**: Hosting an event is the ultimate trust signal

The architecture needed to handle:
- Event creation (multi-step wizard)
- RSVP management (capacity limits)
- Signup sheets (volunteer slot coordination)
- Calendar discovery ("what's happening near me?")
- Attendance tracking (proving the event happened)

## The Database Schema: Events as First-Class Objects

Phase 3A introduced 6 new tables:

### Events (The Core)
```typescript
export const events = pgTable("events", {
    id: text("id").primaryKey(),
    postId: text("post_id").references(() => posts.id),  // Creates feed post
    hostId: text("host_id").references(() => user.id),   // Who's running it
    title: text("title").notNull(),
    description: text("description").notNull(),
    eventType: text("event_type"),  // "potluck" | "volunteer"
    startTime: timestamp("start_time"),
    endTime: timestamp("end_time"),
    locationName: text("location_name"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    capacity: integer("capacity"),
    recurrencePattern: text("recurrence_pattern"),  // For recurring events
    // ... verification, attendance, etc.
});
```

**Key Design Decisions:**
- **`postId` Link**: Every event automatically creates a `kind="event"` post in the feed
- **Capacity Management**: Events can be full; RSVPs can be waitlisted
- **Recurrence Support**: Built-in from day one (for weekly community kitchens, etc.)

### RSVP & Signup Sheets
```typescript
export const eventRsvps = pgTable("event_rsvps", {
    id: text("id").primaryKey(),
    eventId: text("event_id").references(() => events.id),
    userId: text("user_id").references(() => user.id),
    status: text("status"),  // "confirmed" | "waitlist" | "declined"
    rsvpedAt: timestamp(),
});

export const signUpSlots = pgTable("signup_slots", {
    id: text("id").primaryKey(),
    eventId: text("event_id").references(() => events.id),
    title: text("title"),  // "Bring dessert", "Setup crew", "Cooking"
    description: text(),
    limit: integer(),  // How many can claim this slot
    claimCount: integer().default(0),  // How many have claimed it
});

export const signUpClaims = pgTable("signup_claims", {
    id: text("id").primaryKey(),
    slotId: text("slot_id").references(() => signup_slots.id),
    userId: text("user_id").references(() => user.id),
    claimedAt: timestamp(),
});
```

**Why the Complexity?**
- Simple events: RSVP is enough
- Potlucks: You need to know who's bringing what
- Volunteer drives: You need signup sheet coordination
- This schema handles all three without overcomplication

## The Event Creation Wizard

Phase 3B shipped the creation experience (`93cc136`). The **multi-step wizard** guided users through:

1. **Basic Info**: Title, description, event type
2. **Date & Time**: Start, end, timezone
3. **Location**: Map picker or address input
4. **Capacity**: How many RSVPs? Waitlist?
5. **Signup Sheets**: Optional volunteer roles
6. **Review**: Confirm before publishing

Each step was independent, allowing:
- Saving as draft
- Coming back to finish later
- User education (tooltips, examples)

## The Query Layer: Event Queries

The team built `src/lib/event-queries.ts` with sophisticated operations:

```typescript
// Create event (includes creating the feed post)
export async function createEvent(hostId: string, input: EventInput) {
    return await db.transaction(async (tx) => {
        // 1. Create event
        const event = await tx.insert(events).values({...});

        // 2. Create accompanying feed post
        const post = await tx.insert(posts).values({
            kind: "event",
            content: `[Event: ${title}]`,
            locationCoords: {lat, lng},
        });

        // 3. Link them
        await tx.update(events).set({ postId: post.id });

        // 4. Create default signup slots if any

        return event;
    });
}

// RSVP with capacity checking
export async function rsvpEvent(userId: string, eventId: string) {
    const event = await getEventById(eventId);

    if (event.rsvpCount >= event.capacity) {
        // Add to waitlist
        return createRsvp(userId, eventId, "waitlist");
    } else {
        return createRsvp(userId, eventId, "confirmed");
    }
}

// Get calendar view (multiple filters)
export async function getEventsForCalendar(month: string, type?: string) {
    // Filter by month, event type, radius
    // Order by date
    // Include host and RSVP count
}
```

## The Discovery Experience

The team recognized events need different discovery surfaces:

### 1. **Community Feed Integration**
Posts with `kind="event"` appear in the main feed with special styling:
- "🎉 Potluck at Oak Park" card
- Quick "RSVP" button
- Shows RSVPs count
- Location badge

### 2. **Calendar View** (`src/app/community/events/calendar`)
A dedicated calendar page with:
- Month navigation
- Filter by event type (potluck, volunteer, etc.)
- Nearby location filter
- "Add Event" button for hosts

### 3. **Event Detail Page**
Deep view with:
- Full description and map
- Host profile (karma, posts)
- RSVPs count and waitlist
- Signup sheet details
- "RSVP" and "Claim Slot" buttons

## The Coordination Problem Solved

Here's a real scenario Phase 3 solved:

**Before**:
- "Potluck tomorrow, bring something?"
- Comments: "I'll bring chips" "I have salad" "What time?" "2pm" "Where?" "My house"
- Day-of chaos: People show up at wrong time/place

**After**:
- Event created with time, place, capacity
- Signup sheet: "Bring main", "Bring side", "Help set up"
- Users RSVP and claim roles
- Calendar reminder sent automatically
- Location linked to Google Maps

## API Routes

The team implemented the full CRUD:
- `POST /api/events` — Create event (requires auth)
- `GET /api/events` — List events (with filters)
- `GET /api/events/calendar` — Calendar view
- `GET /api/events/[id]` — Get single event
- `PUT /api/events/[id]` — Update event (host only)
- `DELETE /api/events/[id]` — Cancel event (host only)
- `POST /api/events/[id]/rsvp` — RSVP to event
- `DELETE /api/events/[id]/rsvp` — Cancel RSVP
- `POST /api/events/[id]/slots/[slotId]/claim` — Claim signup slot
- `DELETE /api/events/[id]/slots/[slotId]/claim` — Unclaim slot

## The Design Tradeoffs

### Decision 1: Events Create Posts
**Pro**: Automatic feed discovery, comments, karma
**Con**: More complex transactions, more data consistency to manage
**Outcome**: Worth it. Unified community experience.

### Decision 2: Signup Slots as Separate Table
**Pro**: Flexible coordination, reusable for different event types
**Con**: More queries needed, more complexity
**Outcome**: Pays off when hosting volunteer drives

### Decision 3: No Mandatory Photos/Stories
**Pro**: Lower barrier to event creation
**Con**: Less visually compelling
**Outcome**: Add photos later as optional enhancement

## The Community Impact

By November 8, the platform had evolved dramatically:
- **Resource Discovery**: "Where can I find food?"
- **Peer Sharing**: "Who has food to share near me?"
- **Community Building**: "Who wants to organize a potluck?"

Three different interaction modes, one platform.

## Challenges & Learnings

### Challenge 1: Wizard Complexity
The multi-step wizard was confusing on mobile.
- Solution: Later redesigned as a modal with better UX (see Part 10)

### Challenge 2: Timezone Handling
Users in different time zones tried to join events.
- Solution: Store timestamps in UTC, convert on display
- Lesson: Timezone problems are universal; design for them from the start

### Challenge 3: No-Show Problem
People RSVPed but didn't show up.
- Solution: Added attendance tracking and reputation penalties (later)
- Lesson: You can't solve social problems with schema alone

## What We Learned

1. **Events are the strongest community lever.** A shared meal builds more trust than 100 helpful comments. This phase proved it. Events became the centerpiece of everything.

2. **Transactions matter.** Creating an event requires atomicity: if the post creation fails, the event fails. The `tx.transaction()` pattern became essential.

3. **Calendar discovery is powerful.** By building calendar view first (not last), the team unlocked a whole discovery surface. "What's happening?" is as important as "Where's the food?"

## Up Next

With community posts and events live, the system needed intelligence. Users wanted answers to "What should I cook with this?" and "How do I get there?" Phase 5 would bring AI capabilities through the chat system.

---

**Key Commits**: `5a0cbe4` (Phase 3A backend), `93cc136` (Phase 3B UI), `2dc7f6d` (event-focused redesign)

**Related Code**: `src/lib/event-queries.ts`, `src/lib/schema.ts` (events, eventRsvps, signUpSlots), `src/app/community/events/`
