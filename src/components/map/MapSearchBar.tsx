"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SlidersHorizontal, LocateFixed } from "lucide-react";

type MapSearchBarProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  openNow: boolean;
  onToggleOpenNow: () => void;
  maxDistance: number | null;
  onDistanceChange: (value: number | null) => void;
  availableDistances?: number[];
  services: string[];
  selectedService: string | null;
  onServiceChange: (value: string | null) => void;
  onUseLocation?: () => void;
  isLocating?: boolean;
  locationError?: string | null;
};

const DEFAULT_DISTANCES = [5, 10, 20, 30];

export function MapSearchBar({
  searchTerm,
  onSearchTermChange,
  openNow,
  onToggleOpenNow,
  maxDistance,
  onDistanceChange,
  availableDistances = DEFAULT_DISTANCES,
  services,
  selectedService,
  onServiceChange,
  onUseLocation,
  isLocating,
  locationError,
  className,
}: MapSearchBarProps & { className?: string }) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className={cn("rounded-3xl bg-white/95 p-4 shadow-lg shadow-black/10 ring-1 ring-black/5 backdrop-blur-md dark:bg-slate-900/80 dark:ring-white/10", className)}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Search by name, neighborhood, or service"
            className="flex-1 rounded-2xl border border-border/60 bg-background px-4 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            aria-label="Search food banks"
          />
          <Button
            type="button"
            variant={showFilters ? "default" : "outline"}
            size="icon"
            onClick={() => setShowFilters((prev) => !prev)}
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {showFilters ? (
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <button
              type="button"
              onClick={onToggleOpenNow}
              className={cn(
                "rounded-full border px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                openNow
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border bg-muted/60 text-muted-foreground hover:bg-muted/80"
              )}
            >
              Open now
            </button>

            <select
              value={maxDistance ?? ""}
              onChange={(event) =>
                onDistanceChange(
                  event.target.value === "" ? null : Number(event.target.value)
                )
              }
              className="rounded-full border border-border bg-background px-3 py-2 text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label="Filter by distance"
            >
              <option value="">Any distance</option>
              {availableDistances.map((distance) => (
                <option key={distance} value={distance}>
                  Within {distance} miles
                </option>
              ))}
            </select>

            <select
              value={selectedService ?? ""}
              onChange={(event) =>
                onServiceChange(event.target.value || null)
              }
              className="rounded-full border border-border bg-background px-3 py-2 text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label="Filter by services"
            >
              <option value="">All services</option>
              {services.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onUseLocation}
              disabled={!onUseLocation || isLocating}
              className={cn(
                "flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60",
                isLocating
                  ? "border-border bg-muted/70"
                  : "border-border bg-muted/40 hover:bg-muted/70"
              )}
            >
              <LocateFixed className="h-4 w-4" />
              {isLocating ? "Locating…" : "Use my location"}
            </button>
          </div>
        ) : null}

        {locationError ? (
          <p className="text-xs text-destructive">{locationError}</p>
        ) : null}
      </div>
    </div>
  );
}
