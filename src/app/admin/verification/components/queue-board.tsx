/**
 * Queue Board Component
 *
 * Kanban-style board showing all verification queues side-by-side.
 * Handles:
 * - Layout of queue columns (4 columns on desktop, stacked on mobile)
 * - Resource selection across queues
 * - Bulk actions on selected resources
 */

"use client";

import { useState } from "react";
import { QueueColumn, CompactQueueColumn } from "./queue-column";
import { BulkActionsBar } from "./bulk-actions-bar";
import { categorizeResource } from "../lib/queue-logic";
import type { VerificationResource, QueueType } from "../types";

interface QueueBoardProps {
  /** All resources to display (will be categorized into queues) */
  resources: VerificationResource[];

  /** Loading state */
  isLoading?: boolean;

  /** Callbacks for resource actions */
  onResourceClick?: (resourceId: string) => void;
  onVerify?: (resourceIds: string[]) => void;
  onEnhance?: (resourceIds: string[]) => void;
  onReject?: (resourceIds: string[]) => void;
  onFlagDuplicate?: (resourceIds: string[]) => void;
}

export function QueueBoard({
  resources,
  isLoading = false,
  onResourceClick,
  onVerify,
  onEnhance,
  onReject,
  onFlagDuplicate,
}: QueueBoardProps) {
  // Track selected resource IDs across all queues
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Categorize resources into queues
  const categorized = categorizeResources(resources);

  // Handle selection of a single resource
  const handleSelect = (resourceId: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(resourceId);
      } else {
        next.delete(resourceId);
      }
      return next;
    });
  };

  // Clear all selections
  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Get selected resource IDs as array
  const selectedArray = Array.from(selectedIds);

  // Handle bulk actions
  const handleBulkVerify = () => {
    if (onVerify && selectedArray.length > 0) {
      onVerify(selectedArray);
      handleClearSelection();
    }
  };

  const handleBulkEnhance = () => {
    if (onEnhance && selectedArray.length > 0) {
      onEnhance(selectedArray);
      handleClearSelection();
    }
  };

  const handleBulkReject = () => {
    if (onReject && selectedArray.length > 0) {
      onReject(selectedArray);
      handleClearSelection();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Bulk actions bar (shown when resources selected) */}
      {selectedIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          onVerify={onVerify ? handleBulkVerify : undefined}
          onEnhance={onEnhance ? handleBulkEnhance : undefined}
          onReject={onReject ? handleBulkReject : undefined}
          onClear={handleClearSelection}
        />
      )}

      {/* Desktop: 4-column grid */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-4 flex-1 min-h-0">
        <QueueColumn
          queue="quick_wins"
          resources={categorized.quick_wins}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onResourceClick={onResourceClick}
          onVerify={onVerify ? (id) => onVerify([id]) : undefined}
          onEnhance={onEnhance ? (id) => onEnhance([id]) : undefined}
          onReject={onReject ? (id) => onReject([id]) : undefined}
          onFlagDuplicate={onFlagDuplicate ? (id) => onFlagDuplicate([id]) : undefined}
          isLoading={isLoading}
        />

        <QueueColumn
          queue="high_impact"
          resources={categorized.high_impact}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onResourceClick={onResourceClick}
          onVerify={onVerify ? (id) => onVerify([id]) : undefined}
          onEnhance={onEnhance ? (id) => onEnhance([id]) : undefined}
          onReject={onReject ? (id) => onReject([id]) : undefined}
          onFlagDuplicate={onFlagDuplicate ? (id) => onFlagDuplicate([id]) : undefined}
          isLoading={isLoading}
        />

        <QueueColumn
          queue="needs_work"
          resources={categorized.needs_work}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onResourceClick={onResourceClick}
          onVerify={onVerify ? (id) => onVerify([id]) : undefined}
          onEnhance={onEnhance ? (id) => onEnhance([id]) : undefined}
          onReject={onReject ? (id) => onReject([id]) : undefined}
          onFlagDuplicate={onFlagDuplicate ? (id) => onFlagDuplicate([id]) : undefined}
          isLoading={isLoading}
        />

        <QueueColumn
          queue="flagged"
          resources={categorized.flagged}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onResourceClick={onResourceClick}
          onVerify={onVerify ? (id) => onVerify([id]) : undefined}
          onEnhance={onEnhance ? (id) => onEnhance([id]) : undefined}
          onReject={onReject ? (id) => onReject([id]) : undefined}
          onFlagDuplicate={onFlagDuplicate ? (id) => onFlagDuplicate([id]) : undefined}
          isLoading={isLoading}
        />
      </div>

      {/* Mobile: Accordion-style collapsible columns */}
      <MobileQueueBoard
        categorized={categorized}
        selectedIds={selectedIds}
        onSelect={handleSelect}
        onResourceClick={onResourceClick}
        onVerify={onVerify}
        onEnhance={onEnhance}
        onReject={onReject}
        onFlagDuplicate={onFlagDuplicate}
        isLoading={isLoading}
      />
    </div>
  );
}

/**
 * Categorize resources into queues
 */
function categorizeResources(resources: VerificationResource[]): Record<
  QueueType,
  VerificationResource[]
> {
  const categorized: Record<QueueType, VerificationResource[]> = {
    quick_wins: [],
    high_impact: [],
    needs_work: [],
    flagged: [],
  };

  // Assign each resource to appropriate queue
  for (const resource of resources) {
    const queue = categorizeResource(resource);
    // Store queue assignment on resource for later use
    resource.queue = queue;
    categorized[queue].push(resource);
  }

  return categorized;
}

/**
 * Mobile version with collapsible columns
 */
interface MobileQueueBoardProps {
  categorized: Record<QueueType, VerificationResource[]>;
  selectedIds: Set<string>;
  onSelect: (resourceId: string, selected: boolean) => void;
  onResourceClick?: (resourceId: string) => void;
  onVerify?: (resourceIds: string[]) => void;
  onEnhance?: (resourceIds: string[]) => void;
  onReject?: (resourceIds: string[]) => void;
  onFlagDuplicate?: (resourceIds: string[]) => void;
  isLoading?: boolean;
}

function MobileQueueBoard({
  categorized,
  selectedIds,
  onSelect,
  onResourceClick,
  onVerify,
  onEnhance,
  onReject,
  onFlagDuplicate,
  isLoading,
}: MobileQueueBoardProps) {
  // Track which column is expanded (only one at a time)
  const [expandedQueue, setExpandedQueue] = useState<QueueType | null>(null);

  const queues: QueueType[] = ["quick_wins", "high_impact", "needs_work", "flagged"];

  return (
    <div className="lg:hidden space-y-3">
      {queues.map((queue) => (
        <CompactQueueColumn
          key={queue}
          queue={queue}
          resources={categorized[queue]}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onResourceClick={onResourceClick}
          onVerify={onVerify ? (id) => onVerify([id]) : undefined}
          onEnhance={onEnhance ? (id) => onEnhance([id]) : undefined}
          onReject={onReject ? (id) => onReject([id]) : undefined}
          onFlagDuplicate={onFlagDuplicate ? (id) => onFlagDuplicate([id]) : undefined}
          isLoading={isLoading}
          isExpanded={expandedQueue === queue}
          onToggle={() => setExpandedQueue(expandedQueue === queue ? null : queue)}
        />
      ))}
    </div>
  );
}
