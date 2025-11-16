"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { EventCard } from "../event-card";
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
        return (
          <div className="space-y-2 w-full max-w-full">
            <p className="text-xs sm:text-sm font-medium text-foreground mb-2 sm:mb-3">
              Found {result.length} event{result.length !== 1 ? "s" : ""}:
            </p>
            <div className="grid grid-cols-1 gap-2 sm:gap-3">
              {result.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  userLocation={userLocation}
                />
              ))}
            </div>
          </div>
        );
      }

      return <></>;
    },
  });

  return null;
}
