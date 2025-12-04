/**
 * Verification Search Bar Component
 *
 * Top-level search and filter interface for finding specific resources.
 * Features:
 * - Text search (name, address, city)
 * - Confidence range filter
 * - Location filter
 * - Missing fields filter
 * - Queue filter
 */

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Search, Filter, X, MapPin } from "lucide-react";
import type { VerificationFilters } from "../types";

interface VerificationSearchBarProps {
  /** Current filter state */
  filters: VerificationFilters;

  /** Filter change callback */
  onFiltersChange: (filters: VerificationFilters) => void;

  /** Optional: Scan dialog component to render */
  scanDialogSlot?: React.ReactNode;

  /** Number of results matching current filters */
  resultCount?: number;
}

export function VerificationSearchBar({
  filters,
  onFiltersChange,
  scanDialogSlot,
  resultCount,
}: VerificationSearchBarProps) {
  // Track if filter popover is open
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Handle search query change
  const handleSearchChange = (query: string) => {
    onFiltersChange({ ...filters, searchQuery: query });
  };

  // Handle confidence range change
  const handleConfidenceChange = (values: number[]) => {
    onFiltersChange({
      ...filters,
      confidenceMin: values[0],
      confidenceMax: values[1],
    });
  };

  // Handle location filter change
  const handleLocationChange = (location: string) => {
    onFiltersChange({
      ...filters,
      location: location || null,
    });
  };

  // Toggle missing field filter
  const toggleMissingField = (
    field: "phone" | "website" | "hours" | "description" | "services"
  ) => {
    const current = filters.missingFields;
    const updated = current.includes(field)
      ? current.filter((f) => f !== field)
      : [...current, field];

    onFiltersChange({ ...filters, missingFields: updated });
  };

  // Clear all filters
  const handleClearFilters = () => {
    onFiltersChange({
      searchQuery: "",
      activeQueues: ["quick_wins", "high_impact", "needs_work", "flagged"],
      confidenceMin: 0,
      confidenceMax: 100,
      location: null,
      missingFields: [],
      sources: [],
    });
  };

  // Count active filters (excluding search)
  const activeFilterCount =
    (filters.location ? 1 : 0) +
    filters.missingFields.length +
    (filters.confidenceMin > 0 || filters.confidenceMax < 100 ? 1 : 0);

  return (
    <div className="space-y-3">
      {/* Search bar and actions */}
      <div className="flex items-center gap-2">
        {/* Search input */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search resources by name, address, or city..."
            value={filters.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {filters.searchQuery && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter popover */}
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter size={16} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-4">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Filters</h3>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-auto p-1 text-xs"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              {/* Location filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Location</Label>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-muted-foreground" />
                  <Input
                    placeholder="City, State, or Zip"
                    value={filters.location || ""}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* Confidence range */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">
                    Confidence Range
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {filters.confidenceMin}% - {filters.confidenceMax}%
                  </span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={5}
                  value={[filters.confidenceMin, filters.confidenceMax]}
                  onValueChange={handleConfidenceChange}
                  className="w-full"
                />
              </div>

              {/* Missing fields */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Missing Fields</Label>
                <div className="space-y-2">
                  {["hours", "phone", "website", "description", "services"].map(
                    (field) => (
                      <div key={field} className="flex items-center gap-2">
                        <Checkbox
                          id={`missing-${field}`}
                          checked={filters.missingFields.includes(
                            field as "phone" | "website" | "hours" | "description" | "services"
                          )}
                          onCheckedChange={() =>
                            toggleMissingField(field as "phone" | "website" | "hours" | "description" | "services")
                          }
                        />
                        <label
                          htmlFor={`missing-${field}`}
                          className="text-sm capitalize cursor-pointer"
                        >
                          {field}
                        </label>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Scan area dialog */}
        {scanDialogSlot}
      </div>

      {/* Active filters display */}
      {(activeFilterCount > 0 || filters.searchQuery) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">
            Active filters:
          </span>

          {/* Search query badge */}
          {filters.searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: &quot;{filters.searchQuery}&quot;
              <button
                onClick={() => handleSearchChange("")}
                className="ml-1 hover:text-foreground"
              >
                <X size={12} />
              </button>
            </Badge>
          )}

          {/* Location badge */}
          {filters.location && (
            <Badge variant="secondary" className="gap-1">
              <MapPin size={12} />
              {filters.location}
              <button
                onClick={() => handleLocationChange("")}
                className="ml-1 hover:text-foreground"
              >
                <X size={12} />
              </button>
            </Badge>
          )}

          {/* Confidence range badge */}
          {(filters.confidenceMin > 0 || filters.confidenceMax < 100) && (
            <Badge variant="secondary" className="gap-1">
              Confidence: {filters.confidenceMin}%-{filters.confidenceMax}%
              <button
                onClick={() => handleConfidenceChange([0, 100])}
                className="ml-1 hover:text-foreground"
              >
                <X size={12} />
              </button>
            </Badge>
          )}

          {/* Missing field badges */}
          {filters.missingFields.map((field) => (
            <Badge key={field} variant="secondary" className="gap-1">
              Missing: {field}
              <button
                onClick={() => toggleMissingField(field)}
                className="ml-1 hover:text-foreground"
              >
                <X size={12} />
              </button>
            </Badge>
          ))}

          {/* Clear all button */}
          {(activeFilterCount > 0 || filters.searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-6 text-xs"
            >
              Clear all
            </Button>
          )}
        </div>
      )}

      {/* Result count */}
      {resultCount !== undefined && (
        <div className="text-sm text-muted-foreground">
          {resultCount} {resultCount === 1 ? "resource" : "resources"} found
        </div>
      )}
    </div>
  );
}
