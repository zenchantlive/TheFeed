"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EventTypeFilter = "all" | "potluck" | "volunteer";
type DateRangeFilter = "week" | "month";

type EventFiltersProps = {
  eventTypeFilter: EventTypeFilter;
  dateRangeFilter: DateRangeFilter;
  onEventTypeChange: (filter: EventTypeFilter) => void;
  onDateRangeChange: (filter: DateRangeFilter) => void;
  error?: string | null;
};

const EVENT_TYPE_FILTERS = [
  { value: "all" as const, label: "All events" },
  { value: "potluck" as const, label: "Potlucks" },
  { value: "volunteer" as const, label: "Volunteer shifts" },
];

const DATE_RANGE_FILTERS = [
  { value: "week" as const, label: "This week" },
  { value: "month" as const, label: "This month" },
];

/**
 * Event Filters
 *
 * Filter controls for events section.
 */
export function EventFilters({
  eventTypeFilter,
  dateRangeFilter,
  onEventTypeChange,
  onDateRangeChange,
  error,
}: EventFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Event type filters */}
      <div className="flex flex-wrap items-center gap-2">
        {EVENT_TYPE_FILTERS.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={eventTypeFilter === option.value ? "default" : "secondary"}
            className={cn(
              "rounded-full font-semibold",
              eventTypeFilter === option.value
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-white/80 text-slate-700 hover:bg-white dark:bg-slate-700/60 dark:text-slate-300 dark:hover:bg-slate-700"
            )}
            onClick={() => onEventTypeChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Date range filters */}
      <div className="flex flex-wrap items-center gap-2">
        {DATE_RANGE_FILTERS.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={dateRangeFilter === option.value ? "default" : "secondary"}
            className={cn(
              "rounded-full font-semibold",
              dateRangeFilter === option.value
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-white/80 text-slate-700 hover:bg-white dark:bg-slate-700/60 dark:text-slate-300 dark:hover:bg-slate-700"
            )}
            onClick={() => onDateRangeChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    </div>
  );
}
