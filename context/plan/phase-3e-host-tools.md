# Phase 3E Plan — Host Tools & Safety
Last updated: 2025-11-09  
Branch: `phase-3e-plan`  
Source reference: [events-plan.md](../events-plan.md#L346)

## Goals
- Give event hosts the controls they need to run safe, organized gatherings.
- Track real attendance to support karma, insights, and follow-up messaging.
- Build trust signals (guide verification) so neighbors feel confident attending.
- Manage waitlists and reminders so spots never go unused.

## Success Metrics
- ≥80% of RSVP’d attendees checked in via the new UI.
- Waitlisted guests automatically promoted within 1 minute of a cancellation.
- Verified events receive 20% higher RSVP-to-attendance conversion.
- Hosts can edit/cancel events without database edits or manual support.

## Scope & Deliverables

### 1. Host Dashboard Controls
1. Host-only section on `event-detail-content.tsx` (or separate manage page) showing:
   - RSVP roster (attending + waitlist + declined) with guest counts and notes.
   - Quick actions: promote from waitlist, remove attendee, edit capacity.
2. Add “Edit Event” and “Cancel Event” flows:
   - Reuse event creation wizard steps for edits (prefilled data).
   - Cancellation modal capturing reason + optional message to attendees.

### 2. Check-in Flow (Attendance Tracking)
1. UI: host sees “Check in attendee” buttons beside RSVP list.
2. API: add `/api/events/[id]/checkin` (POST) to record `eventAttendance` entry.
3. Display check-in status on host panel + attendee list (badge or icon).
4. Future-proof: allow notes for check-in (dietary notes, show-up info).

### 3. Waitlist & Notification Management
1. Surface waitlist order + statuses to host.
2. Provide “Promote to attending” action (or auto when spot opens).
3. Notification hooks (MVP = system logs + TODO, optional email later).
4. Expose waitlist count & status on event detail for transparency.

### 4. Guide Verification Workflow
1. Add verification request flow (host toggles “Request verification”).
2. Guide admin UI (later) – for now, stub or manual toggle with status display.
3. Enhance badges (verified badge + tooltip explaining verification).

### 5. Notification Infrastructure (MVP)
1. System-level events (RSVP confirm, waitlist promotion, cancellation).
2. For MVP, log + future-proof interface (`notifications` table optional, or use existing metadata).
3. Provide host preview of outgoing messages (copy for email/SMS later).

## Dependencies & Prep
- `eventAttendance` table exists (Drizzle schema) – confirm helper functions required.
- `userProfiles.role` indicates guide/admin; confirm permission checks for verification toggles.
- Need host-auth middleware for edit/cancel/check-in endpoints.

## Testing Plan
- Unit: event-queries helpers for check-in, waitlist promotion, cancellation.
- API: integration tests for `/api/events/[id]/checkin`, `/api/events/[id]/promote`, `/api/events/[id]/cancel`.
- UI: manual test matrix
  1. Host edits event, saves changes, detail view updates.
  2. Host cancels event → see banner + attendees notified (log/outcome).
  3. Waitlist promotion reassigns spot + sends message.
  4. Check-in button toggles state + increments attendance table.

## Risks & Mitigations
- **Permissions bugs**: ensure API checks host vs. guide roles before allowing edits/verification.
- **Notification debt**: keep MVP messaging simple (just log + placeholder) to avoid blocking release.
- **Mobile complexity**: host panels may be dense; consider collapsible sections or separate “Manage event” page.
- **State drift**: editing event while RSVPs change; rely on `router.refresh` + optimistic UI.

## Open Questions
1. Do check-ins award karma immediately or after guide review?
2. Should hosts be able to message attendees inside the app?
3. How do we handle “co-hosts” (not in scope yet, but impacts permissions)?
4. Do we auto-cancel events when host deletes associated post?

## Deliverables Checklist
- [ ] Host dashboard (manage roster, edit/cancel buttons).
- [ ] Check-in UI + API wiring to `eventAttendance`.
- [ ] Waitlist controls (promote/demote) with basic notifications.
- [ ] Guide verification request + badge updates.
- [ ] Documentation updates (`context/state.md`, `CLAUDE.md`, etc.).
