# Community Event Hosting System - Technical Plan

**Status**: Planning Phase
**Target**: Phase 3 of Community Social Features
**Priority**: High (requested after Phase 1 completion)

## Vision

Enable neighbors to organize and coordinate community potlucks, volunteer opportunities, and other food-sharing events. Events appear in the feed, on the map, and in a calendar view for maximum discoverability.

## Event Types (MVP)

1. **Community Potlucks** - Shared meals where everyone brings something
2. **Volunteer Opportunities** - Shifts at food banks, community kitchens, etc.

Additional types can be added later: food swaps, cooking workshops, gleaning events, etc.

## Core Features

### For Event Hosts
- Create events with date, time, location, description
- Set capacity limits and manage waitlist
- Create sign-up sheets for potluck coordination
- Set up recurring events (weekly, monthly)
- Check in attendees
- Mark events as public location vs private
- Cancel or reschedule events

### For Event Attendees
- Discover events in feed, map, and calendar
- RSVP with guest count
- Join waitlist when event is full
- Claim sign-up slots (what to bring)
- Get notifications for event updates
- See who else is attending

### For Guides
- Verify events for safety/legitimacy
- Events show "Guide Verified" badge

## Database Schema

### New Tables (6)

#### `events`
Main event details and metadata.

```typescript
{
  id: string (UUID, PK)
  postId: string (FK -> posts.id, CASCADE) // The feed post about this event
  hostId: string (FK -> user.id, CASCADE)
  title: string
  description: string
  eventType: "potluck" | "volunteer"

  // Time
  startTime: timestamp
  endTime: timestamp

  // Location
  location: string // "15th & P St Park"
  locationCoords: { lat: number, lng: number } | null
  isPublicLocation: boolean // Encouraged via UI

  // Capacity
  capacity: number | null // Max attendees (null = unlimited)
  rsvpCount: number // Denormalized for performance
  waitlistCount: number // Denormalized

  // Status
  status: "upcoming" | "in_progress" | "completed" | "cancelled"
  isVerified: boolean // Guide verification

  // Recurrence
  recurrenceId: string | null // Links to eventRecurrence
  parentEventId: string | null // For recurring instances

  createdAt: timestamp
  updatedAt: timestamp
}
```

#### `eventRsvps`
Tracks who's attending, waitlisted, or declined.

```typescript
{
  id: string (UUID, PK)
  eventId: string (FK -> events.id, CASCADE)
  userId: string (FK -> user.id, CASCADE)
  status: "attending" | "waitlisted" | "declined"
  guestCount: number // 1 = just them, 2 = +1 guest, etc.
  notes: string | null // "Vegetarian, no nuts"
  createdAt: timestamp
  updatedAt: timestamp

  UNIQUE(eventId, userId) // One RSVP per user per event
}
```

#### `signUpSlots`
Sign-up sheet categories (for potlucks).

```typescript
{
  id: string (UUID, PK)
  eventId: string (FK -> events.id, CASCADE)
  slotName: string // "Main dish", "Salad", "Dessert", "Drinks"
  maxClaims: number // How many people can sign up for this
  claimCount: number // Denormalized count
  description: string | null // "Serves 8-10 people"
  sortOrder: number // Display order
  createdAt: timestamp
}
```

#### `signUpClaims`
Who signed up for what slot.

```typescript
{
  id: string (UUID, PK)
  slotId: string (FK -> signUpSlots.id, CASCADE)
  userId: string (FK -> user.id, CASCADE)
  details: string // "Bringing veggie lasagna"
  createdAt: timestamp

  UNIQUE(slotId, userId) // One claim per user per slot
}
```

#### `eventRecurrence`
Recurring event patterns (optional feature).

```typescript
{
  id: string (UUID, PK)
  parentEventId: string (FK -> events.id, CASCADE)
  frequency: "daily" | "weekly" | "biweekly" | "monthly"
  dayOfWeek: number | null // 0-6 for weekly/biweekly
  dayOfMonth: number | null // 1-31 for monthly
  interval: number // Every N days/weeks/months
  endsAt: timestamp | null // When recurrence stops
  createdAt: timestamp
}
```

#### `eventAttendance`
Check-in tracking for completed events.

```typescript
{
  id: string (UUID, PK)
  eventId: string (FK -> events.id, CASCADE)
  userId: string (FK -> user.id, CASCADE)
  checkedInAt: timestamp
  notes: string | null

  UNIQUE(eventId, userId) // Can only check in once
}
```

## API Routes

### Events
- `GET /api/events` - List events with filters (upcoming, past, type, location)
- `POST /api/events` - Create new event
- `GET /api/events/[id]` - Get event details with RSVPs and sign-ups
- `PATCH /api/events/[id]` - Update event (host only)
- `DELETE /api/events/[id]` - Cancel event (host only)

### RSVPs
- `POST /api/events/[id]/rsvp` - RSVP to event
- `DELETE /api/events/[id]/rsvp` - Cancel RSVP
- `GET /api/events/[id]/attendees` - List attendees (public)

### Sign-Up Sheets
- `POST /api/events/[id]/slots` - Create sign-up slot (host only)
- `POST /api/events/[id]/slots/[slotId]/claim` - Claim a slot
- `DELETE /api/events/[id]/slots/[slotId]/claim` - Unclaim a slot
- `GET /api/events/[id]/slots` - List all slots and claims

### Attendance
- `POST /api/events/[id]/checkin` - Check in attendee (host only)
- `GET /api/events/[id]/attendance` - List who attended

### Calendar
- `GET /api/events/calendar?month=2025-11` - Get events for calendar view

## UI Components & Pages

### Feed Integration
- **Event Post Card** - Special styling in feed with:
  - Event badge (🎉 Potluck or 🤝 Volunteer)
  - Date/time prominently displayed
  - RSVP count ("12 neighbors coming")
  - "See details & RSVP" button
  - Guide verified badge if applicable

### Event Detail Page (`/community/events/[id]`)
- Hero section with title, date, location, host info
- Event description
- Map showing location
- RSVP section:
  - RSVP button (changes to "You're in!" when RSVPed)
  - Guest count selector
  - Notes field (dietary restrictions)
  - Attendee list (avatars + names)
  - Waitlist indicator if at capacity
- Sign-up sheet (potlucks only):
  - Collapsible sections per slot
  - "Claim this slot" button
  - See what others are bringing
- Action buttons (for host):
  - Edit event
  - Cancel event
  - Check in attendees
  - Send update to attendees

### Event Creation Flow (`/community/events/new`)
- Step 1: Basic info (title, type, description)
- Step 2: Date & time (with recurrence option)
- Step 3: Location (text input + map picker, public location toggle)
- Step 4: Capacity & settings
- Step 5: Sign-up sheet (potlucks only)
- Preview & publish

### Calendar View (`/community/events/calendar`)
- Monthly calendar grid
- Events shown on their dates
- Click date to filter events
- Click event to go to detail page
- Filter by event type

### Map Integration
- Event pins on existing map
- Click pin to see event preview
- "See details" button to full page

## User Flows

### Creating a Potluck Event
1. User clicks "Host an Event" button (new FAB option or header button)
2. Fills out event form (5 steps)
3. Creates sign-up sheet with slots
4. Publishes event
5. System creates:
   - Event record in `events` table
   - Feed post in `posts` table (kind="event", links to event)
   - Sign-up slots in `signUpSlots` table
6. Event appears in feed, map, and calendar
7. Other users can RSVP and claim slots

### RSVPing to an Event
1. User sees event in feed/map/calendar
2. Clicks "See details & RSVP"
3. Views event detail page
4. Clicks "RSVP" button
5. Selects guest count (+0, +1, +2, etc.)
6. Adds notes (optional)
7. Submits
8. If event is full, goes to waitlist
9. If event has sign-up sheet, prompted to claim slot
10. User now sees "You're going!" on event card

### Checking In Attendees
1. Host goes to event detail page
2. Clicks "Check in attendees"
3. Sees list of RSVPs
4. Taps each person as they arrive
5. Checked-in count shown on page
6. (Future: Attendees get karma for attending)

## Safety Features

### Public Location Encouragement
- UI shows tip when creating event: "We recommend public spaces like parks and community centers"
- isPublicLocation field tracked but not enforced
- Private events allowed but UI discourages

### Guide Verification
- Guides see "Verify this event" button on event pages
- Sets isVerified=true
- Event shows "Guide Verified ✓" badge
- Increases trust

### Capacity Limits & Waitlist
- Host sets max capacity when creating event
- When full, new RSVPs go to waitlist automatically
- If someone cancels, first waitlisted person promoted
- Notifications sent when moved off waitlist

### Host Controls
- Only host can edit/cancel event
- Only host can check in attendees
- Cancelling event notifies all RSVPs

## Integration with Existing Features

### Posts System
- Every event has a corresponding post (postId field)
- Post has kind="event"
- Post content is event description snippet
- Commenting on event post works like any post
- Helpful marks can be given to event post

### Map System
- Events with locationCoords shown as pins
- Different icon than food banks (calendar icon)
- Click pin shows event preview popup
- "See details" button to event page

### User Profiles
- User profile shows:
  - Events hosted (count + list)
  - Events attended (count + list)
  - Upcoming RSVPs

## Implementation Phases

### Phase 3A: Event Foundation (Week 1)
- [ ] Add 6 new tables to schema
- [ ] Create event-queries.ts data layer
- [ ] Build /api/events routes
- [ ] Build /api/events/[id]/rsvp routes
- [ ] Update posts to support kind="event"

### Phase 3B: Event Creation & Detail Page (Week 2)
- [ ] Build /community/events/new flow
- [ ] Build /community/events/[id] detail page
- [ ] Add "Host Event" button to community page
- [ ] RSVP functionality working end-to-end

### Phase 3C: Sign-Up Sheets (Week 3)
- [ ] Build sign-up slot management API
- [ ] Add sign-up UI to event detail page
- [ ] Test potluck coordination flow

### Phase 3D: Discovery (Feed, Map, Calendar) (Week 4)
- [ ] Add event cards to community feed
- [ ] Add event pins to map
- [ ] Build calendar view page
- [ ] Add event filters

### Phase 3E: Host Tools & Safety (Week 5)
- [ ] Check-in attendee flow
- [ ] Guide verification system
- [ ] Event editing/cancellation
- [ ] Waitlist management
- [ ] Notification system

### Phase 3F: Recurring Events (Week 6)
- [ ] Recurrence pattern UI in event creation
- [ ] Recurring event instance generation
- [ ] Calendar shows recurring events

## Future Enhancements (Post-MVP)

- **Karma for events** - Hosts and attendees earn karma
- **Event photos** - Upload photos after event happens
- **Event reminders** - Email/SMS reminders before event
- **Weather integration** - Show forecast on event page
- **Event templates** - Save common event formats
- **Co-hosting** - Multiple hosts for an event
- **Event series** - Link related events (cooking class series)
- **Private events** - Invite-only events
- **Event chat** - Group chat for attendees

## Open Questions

1. Should recurring event instances be separate event records or generated dynamically?
2. How do we handle timezone differences (if app expands beyond Sacramento)?
3. Should we limit number of events a user can host simultaneously?
4. What happens to past events - archive or keep visible?
5. Should we allow anonymous RSVPs or require authentication?

## Success Metrics

- Number of events created per week
- RSVP rate (% of viewers who RSVP)
- Show-up rate (% of RSVPs who check in)
- Events that reach capacity
- Recurring event retention (how many repeat)

---

**Next Steps**: Review this plan, then implement Phase 3A (database schema and API routes).
