"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type EventTypeFilter = "all" | "potluck" | "volunteer";
export type DateRangeFilter = "week" | "month";

type DiscoveryFiltersContextValue = {
  eventTypeFilter: EventTypeFilter;
  dateRangeFilter: DateRangeFilter;
  setEventTypeFilter: (value: EventTypeFilter) => void;
  setDateRangeFilter: (value: DateRangeFilter) => void;
};

const DiscoveryFiltersContext = createContext<DiscoveryFiltersContextValue | null>(null);

export function DiscoveryFiltersProvider({ children }: { children: ReactNode }) {
  const [eventTypeFilter, setEventTypeFilter] = useState<EventTypeFilter>("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>("week");

  const value = useMemo(
    () => ({
      eventTypeFilter,
      dateRangeFilter,
      setEventTypeFilter,
      setDateRangeFilter,
    }),
    [eventTypeFilter, dateRangeFilter]
  );

  return (
    <DiscoveryFiltersContext.Provider value={value}>
      {children}
    </DiscoveryFiltersContext.Provider>
  );
}

export function useDiscoveryFilters() {
  const ctx = useContext(DiscoveryFiltersContext);
  if (!ctx) {
    throw new Error("useDiscoveryFilters must be used within a DiscoveryFiltersProvider");
  }
  return ctx;
}
