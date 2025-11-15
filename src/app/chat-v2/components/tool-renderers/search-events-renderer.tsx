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
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground mb-3">
              Found {result.length} event{result.length !== 1 ? "s" : ""}:
            </p>
            {result.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                userLocation={userLocation}
              />
            ))}
          </div>
        );
      }

      return <></>;
    },
  });

  return null;
}
