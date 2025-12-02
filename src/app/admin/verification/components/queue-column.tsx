/**
 * Queue Column Component
 *
 * Single column in the Kanban-style board showing resources in a specific queue.
 * Each column has:
 * - Header with queue name, count, and description
 * - Scrollable list of resource cards
 * - Empty state when no resources
 */

"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ResourceCard, ResourceCardSkeleton } from "./resource-card";
import { getQueueLabel, getQueueDescription } from "../lib/queue-logic";
import type { VerificationResource, QueueType } from "../types";

interface QueueColumnProps {
  /** Queue type (determines header and styling) */
  queue: QueueType;

  /** Resources to display in this column */
  resources: VerificationResource[];

  /** Selected resource IDs */
  selectedIds?: Set<string>;

  /** Selection handler */
  onSelect?: (resourceId: string, selected: boolean) => void;

  /** Click handler for expanding resource detail */
  onResourceClick?: (resourceId: string) => void;

  /** Action handlers */
  onVerify?: (resourceId: string) => void;
  onEnhance?: (resourceId: string) => void;
  onReject?: (resourceId: string) => void;
  onFlagDuplicate?: (resourceId: string) => void;

  /** Loading state */
  isLoading?: boolean;
}

export function QueueColumn({
  queue,
  resources,
  selectedIds = new Set(),
  onSelect,
  onResourceClick,
  onVerify,
  onEnhance,
  onReject,
  onFlagDuplicate,
  isLoading = false,
}: QueueColumnProps) {
  // Get queue display info
  const label = getQueueLabel(queue);
  const description = getQueueDescription(queue);
  const count = resources.length;

  // Get color scheme for queue type
  const colors = getQueueColors(queue);

  return (
    <div className="flex flex-col h-full">
      {/* Column Header */}
      <div
        className={`
          flex items-center justify-between px-4 py-3 rounded-t-lg
          ${colors.header}
        `}
      >
        {/* Queue label and count */}
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{label}</h3>
          <span
            className={`
              text-xs font-medium px-2 py-0.5 rounded-full
              ${colors.badge}
            `}
          >
            {count}
          </span>
        </div>

        {/* Info tooltip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Info size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">{description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Column Body - Scrollable list of cards */}
      <div
        className={`
          flex-1 overflow-y-auto p-3 space-y-3
          bg-muted/20 rounded-b-lg
          ${colors.body}
        `}
      >
        {/* Loading state */}
        {isLoading && (
          <>
            <ResourceCardSkeleton />
            <ResourceCardSkeleton />
            <ResourceCardSkeleton />
          </>
        )}

        {/* Resources */}
        {!isLoading &&
          resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              isSelected={selectedIds.has(resource.id)}
              onSelect={
                onSelect
                  ? (selected) => onSelect(resource.id, selected)
                  : undefined
              }
              onClick={() => onResourceClick?.(resource.id)}
              onVerify={onVerify ? () => onVerify(resource.id) : undefined}
              onEnhance={onEnhance ? () => onEnhance(resource.id) : undefined}
              onReject={onReject ? () => onReject(resource.id) : undefined}
              onFlagDuplicate={
                onFlagDuplicate
                  ? () => onFlagDuplicate(resource.id)
                  : undefined
              }
            />
          ))}

        {/* Empty state */}
        {!isLoading && count === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-4xl mb-3">{getEmptyStateEmoji(queue)}</div>
            <h4 className="font-medium text-sm mb-1">
              {getEmptyStateTitle(queue)}
            </h4>
            <p className="text-xs text-muted-foreground max-w-[200px]">
              {getEmptyStateMessage(queue)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Get color scheme for queue type
 */
function getQueueColors(queue: QueueType): {
  header: string;
  badge: string;
  body: string;
} {
  switch (queue) {
    case "quick_wins":
      return {
        header: "bg-purple-500/10 border-b border-purple-500/20",
        badge: "bg-purple-500/20 text-purple-700 dark:text-purple-400",
        body: "bg-purple-500/5",
      };
    case "high_impact":
      return {
        header: "bg-blue-500/10 border-b border-blue-500/20",
        badge: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
        body: "bg-blue-500/5",
      };
    case "needs_work":
      return {
        header: "bg-orange-500/10 border-b border-orange-500/20",
        badge: "bg-orange-500/20 text-orange-700 dark:text-orange-400",
        body: "bg-orange-500/5",
      };
    case "flagged":
      return {
        header: "bg-red-500/10 border-b border-red-500/20",
        badge: "bg-red-500/20 text-red-700 dark:text-red-400",
        body: "bg-red-500/5",
      };
  }
}

/**
 * Get empty state emoji for queue
 */
function getEmptyStateEmoji(queue: QueueType): string {
  switch (queue) {
    case "quick_wins":
      return "🎉";
    case "high_impact":
      return "✨";
    case "needs_work":
      return "🎯";
    case "flagged":
      return "👍";
  }
}

/**
 * Get empty state title
 */
function getEmptyStateTitle(queue: QueueType): string {
  switch (queue) {
    case "quick_wins":
      return "All Quick Wins Done!";
    case "high_impact":
      return "No Resources Ready";
    case "needs_work":
      return "Nothing to Fix";
    case "flagged":
      return "No Issues Flagged";
  }
}

/**
 * Get empty state message
 */
function getEmptyStateMessage(queue: QueueType): string {
  switch (queue) {
    case "quick_wins":
      return "Great job! Check other queues for more work.";
    case "high_impact":
      return "Resources will appear here when they're complete.";
    case "needs_work":
      return "All resources are in good shape!";
    case "flagged":
      return "No duplicates or issues detected.";
  }
}

/**
 * Compact queue column for mobile/small screens
 */
interface CompactQueueColumnProps extends QueueColumnProps {
  /** Whether this column is currently expanded */
  isExpanded: boolean;
  /** Toggle expansion */
  onToggle: () => void;
}

export function CompactQueueColumn({
  queue,
  resources,
  isExpanded,
  onToggle,
  ...props
}: CompactQueueColumnProps) {
  const label = getQueueLabel(queue);
  const count = resources.length;
  const colors = getQueueColors(queue);

  if (!isExpanded) {
    // Collapsed state - just show header
    return (
      <button
        onClick={onToggle}
        className={`
          w-full flex items-center justify-between px-4 py-3 rounded-lg
          ${colors.header} hover:opacity-80 transition-opacity
        `}
      >
        <span className="font-semibold text-sm">{label}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>
          {count}
        </span>
      </button>
    );
  }

  // Expanded state - show full column
  return (
    <div className="space-y-2">
      <button
        onClick={onToggle}
        className={`
          w-full flex items-center justify-between px-4 py-3 rounded-t-lg
          ${colors.header}
        `}
      >
        <span className="font-semibold text-sm">{label}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>
          {count}
        </span>
      </button>

      <div className="space-y-3">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            {...props}
            onSelect={props.onSelect ? (selected) => props.onSelect?.(resource.id, selected) : undefined}
            onVerify={props.onVerify ? () => props.onVerify?.(resource.id) : undefined}
            onEnhance={props.onEnhance ? () => props.onEnhance?.(resource.id) : undefined}
            onReject={props.onReject ? () => props.onReject?.(resource.id) : undefined}
            onFlagDuplicate={props.onFlagDuplicate ? () => props.onFlagDuplicate?.(resource.id) : undefined}
            onClick={() => props.onResourceClick?.(resource.id)}
            isSelected={props.selectedIds?.has(resource.id)}
          />
        ))}
      </div>
    </div>
  );
}
