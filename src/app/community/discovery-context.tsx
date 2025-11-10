"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type EventTypeFilter = "all" | "potluck" | "volunteer";
export type DateRangeFilter = "week" | "month";

type DiscoveryFiltersContextValue = {
  eventTypeFilter: EventTypeFilter;
  dateRangeFilter: DateRangeFilter;
  setEventTypeFilter: (value: EventTypeFilter) => void;
  setDateRangeFilter: (value: DateRangeFilter) => void;
};

const DiscoveryFiltersContext = createContext<DiscoveryFiltersContextValue | null>(null);

const STORAGE_KEYS = {
  eventType: "discovery:eventType",
  dateRange: "discovery:dateRange",
};

export function DiscoveryFiltersProvider({ children }: { children: ReactNode }) {
  const [eventTypeFilter, setEventTypeFilter] = useState<EventTypeFilter>("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>("week");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedType = window.localStorage.getItem(STORAGE_KEYS.eventType);
    const storedRange = window.localStorage.getItem(STORAGE_KEYS.dateRange);

    if (storedType === "all" || storedType === "potluck" || storedType === "volunteer") {
      setEventTypeFilter(storedType);
    }
    if (storedRange === "week" || storedRange === "month") {
      setDateRangeFilter(storedRange);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.eventType, eventTypeFilter);
  }, [eventTypeFilter]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.dateRange, dateRangeFilter);
  }, [dateRangeFilter]);

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
