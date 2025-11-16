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

const INITIAL_DISPLAY_COUNT = 2;

function EventsList({
  events,
  userLocation,
}: {
  events: SearchEventResult[];
  userLocation: { lat: number; lng: number } | null;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const showExpandButton = events.length > INITIAL_DISPLAY_COUNT;
  const displayedEvents = isExpanded
    ? events
    : events.slice(0, INITIAL_DISPLAY_COUNT);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground mb-3">
        Found {events.length} event{events.length !== 1 ? "s" : ""}:
      </p>
      {displayedEvents.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          userLocation={userLocation}
        />
      ))}
      {showExpandButton && (
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
                Show {events.length - INITIAL_DISPLAY_COUNT} more
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

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
        return <EventsList events={result} userLocation={userLocation} />;
      }

      return <></>;
    },
  });

  return null;
}
