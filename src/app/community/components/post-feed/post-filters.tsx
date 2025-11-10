"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FeedFilter, CommunityMode } from "../../types";
import { FILTERS } from "../../types";

type PostFiltersProps = {
  currentFilter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
  mode: CommunityMode;
};

/**
 * Post Filters
 *
 * Filter pills for post feed.
 * Provides visual feedback on current mode's effect.
 */
export function PostFilters({ currentFilter, onFilterChange, mode }: PostFiltersProps) {
  // Mode description
  const modeDescription = {
    hungry: "Prioritizing available shares and resources near you",
    helper: "Prioritizing neighbor requests so you can help faster",
    browse: "Neutral ordering of all activity",
  }[mode];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Left: Description */}
      <div className="flex flex-col">
        <span className="text-[0.6rem] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          Community Feed
        </span>
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {modeDescription}
        </span>
      </div>

      {/* Right: Filter pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        {FILTERS.map((filterOption) => (
          <Button
            key={filterOption.value}
            type="button"
            variant={currentFilter === filterOption.value ? "default" : "secondary"}
            size="sm"
            className={cn(
              "rounded-full px-4 font-semibold",
              currentFilter === filterOption.value
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-white/80 text-slate-700 hover:bg-white dark:bg-slate-700/60 dark:text-slate-300 dark:hover:bg-slate-700"
            )}
            onClick={() => onFilterChange(filterOption.value)}
          >
            {filterOption.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
