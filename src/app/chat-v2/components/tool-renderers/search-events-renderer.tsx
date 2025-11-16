"use client";

import { useState } from "react";
import { useCopilotAction } from "@copilotkit/react-core";
import { EventCard } from "../event-card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { CopilotRenderProps, SearchEventResult } from "./types";

type SearchEventsRendererProps = {
  userLocation: { lat: number; lng: number } | null;
};

export function SearchEventsRenderer({
  userLocation,
}: SearchEventsRendererProps) {
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
        return <EventGrid events={result} userLocation={userLocation} />;
      }

      return <></>;
    },
  });

  return null;
}

function EventGrid({
  events,
  userLocation,
}: {
  events: SearchEventResult[];
  userLocation: { lat: number; lng: number } | null;
}) {
  // This component can be replaced by a generic PaginatedGrid.
  // The implementation would be moved to a shared component file,
  // and this file would use it like:
  /*
  return (
    <PaginatedGrid
      items={events}
      itemNoun="event"
      renderItem={(event) => (
        <EventCard
          key={event.id}
          event={event}
          userLocation={userLocation}
        />
      )}
    />
  );
  */
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMore = events.length > 2;
  const displayedEvents = isExpanded ? events : events.slice(0, 2);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">
        Found {events.length} event{events.length !== 1 ? "s" : ""}:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {displayedEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            userLocation={userLocation}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show {events.length - 2} more
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
