---
title: "Part 6: Event Hosting - Enabling Community Potlucks"
series: "TheFeed Development Journey"
part: 6
date: 2025-11-08
updated: 2025-12-27
tags: [events, rsvp, database-design, community-organizing]
reading_time: "15 min"
commits_covered: "5a0cbe4..2dc7f6d"
---

## From Async to Real-Time

Posts let neighbors share food asynchronously - "I have leftovers, pickup anytime." But real community happens **in person**, at **specific times**.

Community potlucks. Volunteer shifts at food banks. Cooking classes. These require:
- Date/time coordination
- RSVP tracking with capacity limits
- Sign-up sheets (who's bringing what?)
- Location management
- Reminders and updates

On November 8th, I started building Phase 3: the event hosting system.

## The Event Data Model

Events are complex. Here's the full schema:

```typescript
// src/lib/schema.ts - Event tables
export const events = pgTable("events", {
  id: text("id").primaryKey(),
  postId: text("post_id").references(() => posts.id, { onDelete: 'cascade' }),
  hostId: text("host_id").notNull().references(() => user.id),

  title: text("title").notNull(),
  description: text("description").notNull(),
  eventType: text("event_type").notNull(), // 'potluck' | 'volunteer' | 'cooking_class'

  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),

  location: text("location").notNull(),
  locationCoords: json("location_coords").$type<{ lat: number; lng: number }>(),
  isPublicLocation: boolean("is_public_location").default(true),

  capacity: integer("capacity"),
  rsvpCount: integer("rsvp_count").default(0),
  waitlistCount: integer("waitlist_count").default(0),

  recurrenceId: text("recurrence_id").references(() => eventRecurrence.id),
  status: text("status").default("active"), // 'active' | 'cancelled' | 'completed'

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const eventRsvps = pgTable("event_rsvps", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: text("user_id").notNull().references(() => user.id),

  status: text("status").notNull(), // 'attending' | 'waitlisted' | 'declined'
  guestCount: integer("guest_count").default(1),
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique().on(table.eventId, table.userId),
]);

export const signUpSlots = pgTable("sign_up_slots", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }),

  slotName: text("slot_name").notNull(), // "Salad", "Main Dish", "Dessert"
  description: text("description"),
  maxClaims: integer("max_claims").default(1),
  claimCount: integer("claim_count").default(0),
  sortOrder: integer("sort_order").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const signUpClaims = pgTable("sign_up_claims", {
  id: text("id").primaryKey(),
  slotId: text("slot_id").notNull().references(() => signUpSlots.id, { onDelete: 'cascade' }),
  userId: text("user_id").notNull().references(() => user.id),

  details: text("details"), // "Caesar salad with homemade dressing"

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique().on(table.slotId, table.userId),
]);

export const eventRecurrence = pgTable("event_recurrence", {
  id: text("id").primaryKey(),
  frequency: text("frequency").notNull(), // 'daily' | 'weekly' | 'monthly'
  dayOfWeek: integer("day_of_week"), // 0-6 for weekly
  dayOfMonth: integer("day_of_month"), // 1-31 for monthly
  interval: integer("interval").default(1),
  endsAt: timestamp("ends_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const eventAttendance = pgTable("event_attendance", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: text("user_id").notNull().references(() => user.id),

  checkedInAt: timestamp("checked_in_at").notNull(),
  notes: text("notes"),
}, (table) => [
  unique().on(table.eventId, table.userId),
]);
```

This is **comprehensive** - supporting everything from simple potlucks to complex recurring volunteer shifts.

### Key Design Decisions

**1. Link to Posts**

Every event creates a post (`kind="event"`). This:
- Shows events in the community feed
- Enables commenting on events
- Reuses karma/helpful marks
- Maintains feed chronology

**2. Capacity + Waitlist**

Events can have limited capacity. When full, additional RSVPs go to waitlist. This prevents over-crowding while maintaining interest.

**3. Sign-Up Sheets**

Potlucks need coordination: who's bringing salad, dessert, drinks? Sign-up slots solve this with:
- Named slots ("Salad", "Main Dish")
- Max claims per slot (2 people can bring salad)
- Optional details ("Caesar salad with croutons")

**4. Recurring Events**

Weekly volunteer shifts or monthly community dinners need recurrence patterns. The `eventRecurrence` table handles this separately, allowing one-off edits without breaking the series.

## The Event Creation Flow

Creating events required a multi-step wizard:

```tsx
// src/components/events/event-creation-wizard.tsx
export function EventCreationWizard({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<EventFormData>>({});

  const steps = [
    { id: 1, label: "Basic Info", component: EventBasicInfoStep },
    { id: 2, label: "Date & Time", component: EventDateTimeStep },
    { id: 3, label: "Location", component: EventLocationStep },
    { id: 4, label: "Capacity", component: EventCapacityStep },
    { id: 5, label: "Sign-Up Sheet", component: EventSignUpSheetStep },
  ];

  const handleNext = (stepData: Partial<EventFormData>) => {
    setFormData((prev) => ({ ...prev, ...stepData }));
    if (step < steps.length) {
      setStep(step + 1);
    } else {
      handleSubmit({ ...formData, ...stepData });
    }
  };

  const handleSubmit = async (data: EventFormData) => {
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      toast.error('Failed to create event');
      return;
    }

    const { id } = await response.json();
    onComplete(id);
  };

  const CurrentStepComponent = steps[step - 1].component;

  return (
    <div className="space-y-6">
      <ProgressIndicator currentStep={step} totalSteps={steps.length} />
      <CurrentStepComponent
        initialData={formData}
        onNext={handleNext}
        onBack={() => setStep(step - 1)}
      />
    </div>
  );
}
```

Each step collected specific information:

**Step 1: Basic Info**
- Event title
- Description
- Event type (potluck, volunteer, cooking class)

**Step 2: Date & Time**
- Start date/time
- End time
- Recurrence pattern (optional)

**Step 3: Location**
- Address or description
- Public vs private location toggle
- Map picker for coordinates

**Step 4: Capacity**
- Max attendees
- Enable waitlist?
- RSVP deadline

**Step 5: Sign-Up Sheet**
- Add slots (Salad, Main, Dessert)
- Set max claims per slot
- Reorder slots

This wizard UX was later **replaced with a modal** (Part 11), but the multi-step concept validated well.

## The RSVP System

RSVPs required careful capacity management:

```typescript
// src/lib/event-queries.ts
export async function createRsvp(params: {
  eventId: string;
  userId: string;
  guestCount: number;
  notes?: string;
}) {
  const { eventId, userId, guestCount, notes } = params;

  // Get event with current RSVP count
  const event = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event[0]) {
    throw new Error('Event not found');
  }

  // Check capacity
  const availableSpots = event[0].capacity
    ? event[0].capacity - event[0].rsvpCount
    : Infinity;

  const status = guestCount <= availableSpots ? 'attending' : 'waitlisted';

  // Create RSVP
  const rsvpId = crypto.randomUUID();
  await db.insert(eventRsvps).values({
    id: rsvpId,
    eventId,
    userId,
    status,
    guestCount,
    notes,
  });

  // Update event counters
  await db
    .update(events)
    .set({
      rsvpCount: status === 'attending'
        ? sql`${events.rsvpCount} + ${guestCount}`
        : events.rsvpCount,
      waitlistCount: status === 'waitlisted'
        ? sql`${events.waitlistCount} + ${guestCount}`
        : events.waitlistCount,
    })
    .where(eq(events.id, eventId));

  return { id: rsvpId, status };
}
```

This handled:
- Capacity checks
- Automatic waitlisting when full
- Guest count tracking
- Optimistic counter updates

## The Sign-Up Sheet UI

Potlucks needed a visual sign-up interface:

```tsx
// src/components/events/signup-sheet.tsx
export function SignUpSheet({ eventId }: Props) {
  const [slots, setSlots] = useState<SignUpSlot[]>([]);

  useEffect(() => {
    fetch(`/api/events/${eventId}/slots`)
      .then((res) => res.json())
      .then((data) => setSlots(data.slots));
  }, [eventId]);

  const handleClaimSlot = async (slotId: string, details: string) => {
    const response = await fetch(`/api/events/${eventId}/slots/${slotId}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ details }),
    });

    if (!response.ok) {
      toast.error('Failed to claim slot');
      return;
    }

    // Refresh slots
    const updated = await fetch(`/api/events/${eventId}/slots`).then((r) => r.json());
    setSlots(updated.slots);
    toast.success('Slot claimed!');
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">What to Bring</h3>

      {slots.map((slot) => (
        <Card key={slot.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{slot.slotName}</CardTitle>
              <Badge variant="outline">
                {slot.claimCount} / {slot.maxClaims} claimed
              </Badge>
            </div>
            {slot.description && (
              <CardDescription>{slot.description}</CardDescription>
            )}
          </CardHeader>

          <CardContent>
            {slot.claims.map((claim) => (
              <div key={claim.id} className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={claim.user.image} />
                  <AvatarFallback>{claim.user.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{claim.user.name}</span>
                {claim.details && (
                  <span className="text-sm text-muted-foreground">- {claim.details}</span>
                )}
              </div>
            ))}

            {slot.claimCount < slot.maxClaims && (
              <ClaimSlotDialog
                slotName={slot.slotName}
                onClaim={(details) => handleClaimSlot(slot.id, details)}
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

This UI made coordination **visual** - you could see who was bringing what, avoiding duplicate salads.

## The Calendar View

Events needed discoverable beyond the feed. Enter the calendar:

```tsx
// src/app/community/events/calendar/page.tsx
export default async function EventsCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; type?: string }>;
}) {
  const params = await searchParams;
  const month = params.month || format(new Date(), 'yyyy-MM');
  const eventType = params.type;

  const [year, monthNum] = month.split('-').map(Number);
  const startDate = new Date(year, monthNum - 1, 1);
  const endDate = new Date(year, monthNum, 0, 23, 59, 59);

  let query = db
    .select()
    .from(events)
    .where(
      and(
        gte(events.startTime, startDate),
        lte(events.startTime, endDate),
        eq(events.status, 'active')
      )
    )
    .orderBy(events.startTime);

  if (eventType) {
    query = query.where(eq(events.eventType, eventType));
  }

  const eventsData = await query;

  return <EventsCalendarClient events={eventsData} currentMonth={month} />;
}
```

The client component rendered a traditional month grid with event markers.

## The Map Integration

Events with coordinates appeared on the map:

```tsx
// src/app/map/pageClient.tsx
{events.map((event) => (
  <Marker
    key={event.id}
    longitude={event.locationCoords.lng}
    latitude={event.locationCoords.lat}
    onClick={() => setSelectedEvent(event.id)}
  >
    <Calendar className="text-blue-500 h-8 w-8" />
  </Marker>
))}
```

Clicking an event marker showed a popup with:
- Event title and time
- RSVP count / capacity
- Quick RSVP button
- Link to full details

This **unified discovery** - food banks, events, and posts all on one map.

## What Went Right

1. **Comprehensive Schema**: Planning tables upfront avoided painful migrations later

2. **Capacity Management**: Waitlist system prevented over-booking elegantly

3. **Sign-Up Sheets**: Solved potluck coordination without external tools

4. **Map Integration**: Events felt integrated, not bolted-on

5. **Post Linkage**: Showing events in feed increased visibility

## What I'd Do Differently

**Mistake 1: No Edit Flow**

Once created, events couldn't be edited. This required creating a duplicate or manual database fixes.

**Mistake 2: No Cancellation Notifications**

Hosts could cancel events, but attendees weren't notified. Email/push notifications were deferred too long.

**Mistake 3: Complex Wizard**

The 5-step wizard tested well but felt heavy. A single-page form with sections would have been faster.

## What I Learned

1. **Events Are Complex**: RSVPs, capacity, sign-ups, recurrence - each adds multiplicative complexity

2. **Denormalization Matters More**: `rsvpCount` and `claimCount` were essential for performance

3. **UX Iteration Is Key**: The wizard worked but needed refinement based on usage

4. **Integration Beats Silos**: Events on the map and in the feed felt cohesive

## Up Next

In Part 7, I'll cover the CopilotKit migration - upgrading the AI chat system with better streaming, tool renderers, and generative UI.

---
**Key Commits**:
- `5a0cbe4` - Implement Phase 3A event hosting backend (MVP foundation)
- `93cc136` - Implement Phase 3B event hosting UI (creation wizard + detail pages)
- `2dc7f6d` - Complete Phase 3B - event-focused community page redesign

**Related Files**:
- `src/lib/schema.ts` - Event tables
- `src/lib/event-queries.ts` - Event data layer
- `src/app/api/events/route.ts` - Events CRUD API
- `src/components/events/event-creation-wizard.tsx` - Creation wizard
