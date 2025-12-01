"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { EventCard } from "@/components/events/event-card";
import { useDiscoveryEvents } from "../../use-discovery-events";
import type { EventCardData } from "../../types";

type EventsSectionProps = {
  initialEvents: EventCardData[];
  mode?: "hungry" | "full";
};

/**
 * Events Section
 *
 * Displays events with quick actions based on mode:
 * - Hungry mode: Food/resource events with RSVP + map
 * - Full mode: Volunteer opportunities with RSVP + map
 * - Full width, primary focus of the page
 */
export function EventsSection({ initialEvents, mode }: EventsSectionProps) {
  const { events, isLoading } = useDiscoveryEvents(initialEvents);

  // Filter events by mode
  const filteredEvents = mode
    ? events.filter((e) =>
        mode === "hungry" ? e.eventType === "potluck" : e.eventType === "volunteer"
      )
    : events;

  return (
    <section className="space-y-4">
      {/* Loading state */}
      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading events…</p>
      )}

      {/* Events grid - FULL WIDTH */}
      {filteredEvents.length === 0 && !isLoading ? (
        <div className="rounded-xl border-2 border-dashed border-border/70 bg-muted/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {mode === "hungry" && "No food events available right now. Check back soon!"}
            {mode === "full" && (
              <>
                No volunteer opportunities right now.{" "}
                <Link href="/community/events/new" className="font-semibold text-primary underline">
                  Create one
                </Link>
                !
              </>
            )}
            {!mode && "No events yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredEvents.map((event) => (
            <EventCardWithActions key={event.id} event={event} mode={mode} />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Event Card with Quick Actions
 *
 * Adds RSVP and map pin buttons to each event
 */
function EventCardWithActions({
  event
}: {
  event: EventCardData;
}) {
  return (
    <div className="relative">
      <EventCard {...event} />

      {/* Quick action overlay */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        <Button
          asChild
          size="sm"
          variant="secondary"
          className="rounded-full bg-background/95 shadow-md backdrop-blur hover:bg-background"
        >
          <Link href={`/map?eventId=${event.id}`}>
            <MapPin className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          asChild
          size="sm"
          className="rounded-full shadow-md"
        >
          <Link href={`/community/events/${event.id}`}>
            RSVP
          </Link>
        </Button>
      </div>
    </div>
  );
}
