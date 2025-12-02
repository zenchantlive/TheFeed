/**
 * Archive Filter Component
 *
 * Radio button group for filtering resources by archive status:
 * - Active: Show only non-archived resources (default)
 * - Archived: Show only archived resources
 * - All: Show all resources
 */

"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ArchiveMode } from "../types";

interface ArchiveFilterProps {
  /** Current archive mode */
  value: ArchiveMode;

  /** Callback when mode changes */
  onChange: (mode: ArchiveMode) => void;

  /** Optional count of resources in each mode */
  counts?: {
    active: number;
    archived: number;
    all: number;
  };
}

export function ArchiveFilter({ value, onChange, counts }: ArchiveFilterProps) {
  return (
    <div className="flex items-center gap-6">
      <span className="text-sm font-medium text-muted-foreground">Show:</span>

      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as ArchiveMode)}
        className="flex items-center gap-4"
      >
        {/* Active */}
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="active" id="archive-active" />
          <Label htmlFor="archive-active" className="cursor-pointer font-normal">
            Active
            {counts && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                ({counts.active})
              </span>
            )}
          </Label>
        </div>

        {/* Archived */}
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="archived" id="archive-archived" />
          <Label htmlFor="archive-archived" className="cursor-pointer font-normal">
            Archived
            {counts && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                ({counts.archived})
              </span>
            )}
          </Label>
        </div>

        {/* All */}
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="all" id="archive-all" />
          <Label htmlFor="archive-all" className="cursor-pointer font-normal">
            All
            {counts && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                ({counts.all})
              </span>
            )}
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
