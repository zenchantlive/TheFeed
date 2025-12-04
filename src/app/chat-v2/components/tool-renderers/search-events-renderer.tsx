"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { EventCard } from "../event-card";
import { ChevronDown } from "lucide-react";
import type { CopilotRenderProps, SearchEventResult } from "./types";

export function SearchEventsRenderer() {
  useCopilotAction({
    name: "search_events",
    available: "disabled",
    render: ({ status, result }: CopilotRenderProps<SearchEventResult[]>) => {
      if (status === "inProgress") {
        return (
          <div className="text-sm text-muted-foreground">
            📅 Searching for community events...
          </div>
        );
      }

      if (status === "executing") {
        return (
          <div className="text-sm text-muted-foreground">
            ⏳ Checking event schedules...
          </div>
        );
      }

      if (status === "complete" && result && Array.isArray(result)) {
        return <EventGrid events={result} />;
      }

      return <></>;
    },
  });

  return null;
}

function EventGrid({
  events,
}: {
  events: SearchEventResult[];
}) {
  const now = new Date();
  const upcomingEvents = events
    .map((event) => ({ ...event, startDate: new Date(event.startsAt) }))
    .filter((event) => !isNaN(event.startDate.getTime()) && event.startDate >= now)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  const pastCount = events.length - upcomingEvents.length;

  if (upcomingEvents.length === 0) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/60 p-4 text-sm text-muted-foreground">
        No upcoming events found. Try widening your search radius or asking about another day.
      </div>
    );
  }

  const visibleEvents = upcomingEvents.slice(0, 2);
  const hiddenEvents = upcomingEvents.slice(2);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <p className="text-sm font-medium text-foreground">
        Found {upcomingEvents.length} upcoming event{upcomingEvents.length !== 1 ? "s" : ""}
        {pastCount > 0 ? ` (filtered ${pastCount} past event${pastCount !== 1 ? "s" : ""})` : ""}:
      </p>

      <div className="space-y-3">
        {visibleEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
          />
        ))}
      </div>

      {hiddenEvents.length > 0 && (
        <details className="group rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm">
          <summary className="flex cursor-pointer items-center justify-between px-4 py-2 text-sm font-medium text-foreground">
            <span>
              Show {hiddenEvents.length} more upcoming event{hiddenEvents.length !== 1 ? "s" : ""}
            </span>
            <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="space-y-3 px-4 pb-4 pt-2">
            {hiddenEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
