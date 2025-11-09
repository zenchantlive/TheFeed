"use client";

import { useEffect, useMemo, useState } from "react";
import { useDiscoveryFilters } from "./discovery-context";
import type { EventCardData } from "./page-client";
import { addDays } from "date-fns";

type EventApiItem = {
  id: string;
  title: string;
  eventType: "potluck" | "volunteer";
  host?: { name?: string | null } | null;
  startTime: string;
  location: string;
  rsvpCount: number;
  capacity: number | null;
  isVerified: boolean;
};

type UseDiscoveryEventsResult = {
  events: EventCardData[];
  isLoading: boolean;
  error: string | null;
};

export function useDiscoveryEvents(initialEvents: EventCardData[]): UseDiscoveryEventsResult {
  const { eventTypeFilter, dateRangeFilter } = useDiscoveryFilters();
  const [events, setEvents] = useState<EventCardData[]>(initialEvents);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtersKey = useMemo(
    () => `${eventTypeFilter}-${dateRangeFilter}`,
    [eventTypeFilter, dateRangeFilter]
  );

  useEffect(() => {
    let isSubscribed = true;
    const controller = new AbortController();
    async function fetchEvents() {
      setIsLoading(true);
      setError(null);
      const now = new Date();
      const rangeEnd = addDays(now, dateRangeFilter === "week" ? 7 : 30);

      const searchParams = new URLSearchParams({
        limit: "12",
        status: "upcoming",
        onlyUpcoming: "true",
        startAfter: now.toISOString(),
        startBefore: rangeEnd.toISOString(),
      });

      if (eventTypeFilter !== "all") {
        searchParams.set("eventType", eventTypeFilter);
      }

      try {
        const response = await fetch(`/api/events?${searchParams.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load events");
        }

        const data = await response.json();
        if (isSubscribed && Array.isArray(data?.items)) {
          setEvents(
            data.items.map((event: EventApiItem) => ({
              id: event.id,
              title: event.title,
              eventType: event.eventType,
              hostName: event.host?.name ?? "Unknown Host",
              startTime: new Date(event.startTime),
              location: event.location,
              rsvpCount: event.rsvpCount,
              capacity: event.capacity,
              isVerified: event.isVerified,
            }))
          );
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Event fetch error:", err);
        if (isSubscribed) {
          setError(err instanceof Error ? err.message : "Failed to load events");
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    }

    fetchEvents();

    return () => {
      isSubscribed = false;
      controller.abort();
    };
  }, [filtersKey, eventTypeFilter, dateRangeFilter]);

  return { events, isLoading, error };
}
