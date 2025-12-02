/**
 * Resource Card Component
 *
 * Collapsed card view shown in queue columns. Displays essential info:
 * - Confidence badge
 * - Resource name and location
 * - Field status indicators
 * - Primary action button
 *
 * Click to expand for detailed view.
 */

"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, MoreVertical, Sparkles, CheckCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ConfidenceBadge } from "./confidence-badge";
import { FieldStatusRow } from "./field-status-indicator";
import { calculateConfidenceBreakdown, getFieldCompleteness } from "../lib/queue-logic";
import type { VerificationResource } from "../types";

interface ResourceCardProps {
  /** Resource data */
  resource: VerificationResource;

  /** Card selection state */
  isSelected?: boolean;

  /** Selection callback */
  onSelect?: (selected: boolean) => void;

  /** Click handler for expanding card */
  onClick?: () => void;

  /** Quick action handlers */
  onVerify?: () => void;
  onEnhance?: () => void;
  onReject?: () => void;
  onFlagDuplicate?: () => void;
}

export function ResourceCard({
  resource,
  isSelected = false,
  onSelect,
  onClick,
  onVerify,
  onEnhance,
  onReject,
  onFlagDuplicate,
}: ResourceCardProps) {
  // Track hover state for showing actions
  const [isHovered, setIsHovered] = useState(false);

  // Calculate confidence breakdown for badge tooltip
  const confidenceBreakdown = calculateConfidenceBreakdown(resource);

  // Get field completeness status
  const fieldStatus = getFieldCompleteness(resource);

  // Determine primary action based on queue
  const queue = resource.queue || "needs_work";
  const primaryAction = getPrimaryAction(queue);

  // Format location string
  const location = `${resource.city}, ${resource.state} ${resource.zipCode}`;

  return (
    <Card
      className={`
        group relative p-4 transition-all cursor-pointer
        hover:shadow-md hover:border-primary/50
        ${isSelected ? "ring-2 ring-primary border-primary" : ""}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Selection checkbox (appears on hover) */}
      {onSelect && (
        <div
          className={`
            absolute top-3 left-3 transition-opacity
            ${isHovered || isSelected ? "opacity-100" : "opacity-0"}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            aria-label="Select resource"
          />
        </div>
      )}

      {/* Card content */}
      <div className={`space-y-3 ${onSelect ? "ml-6" : ""}`}>
        {/* Header: Confidence + Name */}
        <div className="flex items-start gap-2">
          <ConfidenceBadge
            score={resource.confidenceScore}
            breakdown={confidenceBreakdown}
            size="sm"
          />

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm line-clamp-2 leading-tight">
              {resource.name}
            </h3>
          </div>

          {/* More actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onClick?.()}>
                View Details
              </DropdownMenuItem>
              {onEnhance && (
                <DropdownMenuItem onClick={onEnhance}>
                  <Sparkles size={14} className="mr-2" />
                  Enhance with AI
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onFlagDuplicate && (
                <DropdownMenuItem onClick={onFlagDuplicate}>
                  Flag as Duplicate
                </DropdownMenuItem>
              )}
              {onReject && (
                <DropdownMenuItem
                  onClick={onReject}
                  className="text-destructive"
                >
                  Reject
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin size={12} className="shrink-0" />
          <span className="line-clamp-1">{location}</span>
        </div>

        {/* Field status indicators */}
        <FieldStatusRow
          fields={[
            { label: "Hours", status: fieldStatus.hours },
            { label: "Phone", status: fieldStatus.phone },
            { label: "Website", status: fieldStatus.website },
          ]}
          size="sm"
        />

        {/* Primary action button */}
        <div className="flex items-center gap-2 pt-2">
          {primaryAction === "verify" && onVerify && (
            <Button
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onVerify();
              }}
            >
              <CheckCircle size={14} className="mr-2" />
              Verify
            </Button>
          )}

          {primaryAction === "enhance" && onEnhance && (
            <Button
              size="sm"
              variant="secondary"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onEnhance();
              }}
            >
              <Sparkles size={14} className="mr-2" />
              Enhance
            </Button>
          )}

          {primaryAction === "review" && (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
            >
              Review
            </Button>
          )}
        </div>
      </div>

      {/* Potential duplicate badge */}
      {resource.potentialDuplicates && resource.potentialDuplicates.length > 0 && (
        <div className="absolute top-3 right-3">
          <div className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-xs font-medium px-2 py-1 rounded-md">
            ⚠️ Duplicate?
          </div>
        </div>
      )}
    </Card>
  );
}

/**
 * Determine primary action based on queue
 */
function getPrimaryAction(
  queue: string
): "verify" | "enhance" | "review" {
  switch (queue) {
    case "quick_wins":
      return "enhance"; // Complete missing fields
    case "high_impact":
      return "verify"; // Just verify and publish
    case "flagged":
      return "review"; // Manual review needed
    default:
      return "enhance"; // Needs enhancement
  }
}

/**
 * Loading skeleton for resource card
 */
export function ResourceCardSkeleton() {
  return (
    <Card className="p-4 space-y-3">
      {/* Header skeleton */}
      <div className="flex items-start gap-2">
        <div className="h-6 w-12 bg-muted rounded animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
        </div>
      </div>

      {/* Location skeleton */}
      <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />

      {/* Field status skeleton */}
      <div className="flex gap-2">
        <div className="h-6 w-16 bg-muted rounded animate-pulse" />
        <div className="h-6 w-16 bg-muted rounded animate-pulse" />
        <div className="h-6 w-16 bg-muted rounded animate-pulse" />
      </div>

      {/* Button skeleton */}
      <div className="h-8 w-full bg-muted rounded animate-pulse" />
    </Card>
  );
}
