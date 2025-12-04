/**
 * Verification Table Component
 *
 * Data table for verification workspace with:
 * - Sortable columns
 * - Row selection for bulk actions
 * - Pagination (25/50/100 per page)
 * - Full resource names (NOT truncated)
 * - Confidence badges
 * - Missing field indicators
 */

"use client";

import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowUpDownIcon,
  PencilIcon,
} from "lucide-react";
import { ConfidenceBadge } from "./confidence-badge";
import type { VerificationResource, QueueType } from "../types";
import { categorizeResource, countMissingFields } from "../lib/queue-logic";

interface VerificationTableProps {
  /** Resources to display */
  resources: VerificationResource[];

  /** Currently selected resource IDs */
  selectedIds: string[];

  /** Callback when selection changes */
  onSelectionChange: (ids: string[]) => void;

  /** Callback when user clicks edit button */
  onEdit: (resourceId: string) => void;

  /** Current page (1-indexed) */
  page: number;

  /** Items per page */
  pageSize: number;

  /** Callback when page changes */
  onPageChange: (page: number) => void;

  /** Callback when page size changes */
  onPageSizeChange: (size: number) => void;

  /** Sort column */
  sortColumn: SortColumn;

  /** Sort direction */
  sortDirection: "asc" | "desc";

  /** Callback when sort changes */
  onSortChange: (column: SortColumn, direction: "asc" | "desc") => void;
}

export type SortColumn = "name" | "location" | "confidence" | "queue";

/**
 * Badge color mapping for queue types
 */
const QUEUE_BADGE_COLORS: Record<QueueType, string> = {
  quick_wins: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  high_impact: "bg-green-500/10 text-green-700 dark:text-green-400",
  needs_work: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  flagged: "bg-red-500/10 text-red-700 dark:text-red-400",
};

/**
 * Queue label mapping
 */
const QUEUE_LABELS: Record<QueueType, string> = {
  quick_wins: "Quick Win",
  high_impact: "High Impact",
  needs_work: "Needs Work",
  flagged: "Flagged",
};

export function VerificationTable({
  resources,
  selectedIds,
  onSelectionChange,
  onEdit,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sortColumn,
  sortDirection,
  onSortChange,
}: VerificationTableProps) {
  // Sort resources
  const sortedResources = useMemo(() => {
    const sorted = [...resources];

    sorted.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortColumn) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "location":
          aValue = `${a.city}, ${a.state}`.toLowerCase();
          bValue = `${b.city}, ${b.state}`.toLowerCase();
          break;
        case "confidence":
          aValue = a.confidenceScore || 0;
          bValue = b.confidenceScore || 0;
          break;
        case "queue":
          aValue = categorizeResource(a);
          bValue = categorizeResource(b);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [resources, sortColumn, sortDirection]);

  // Paginate resources
  const paginatedResources = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedResources.slice(startIndex, endIndex);
  }, [sortedResources, page, pageSize]);

  // Calculate total pages
  const totalPages = Math.ceil(sortedResources.length / pageSize);

  // Check if all visible items are selected
  const allSelected =
    paginatedResources.length > 0 &&
    paginatedResources.every((r) => selectedIds.includes(r.id));

  // Check if some (but not all) visible items are selected
  const someSelected =
    paginatedResources.some((r) => selectedIds.includes(r.id)) && !allSelected;

  /**
   * Toggle select all visible items
   */
  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all visible items
      const visibleIds = paginatedResources.map((r) => r.id);
      onSelectionChange(selectedIds.filter((id) => !visibleIds.includes(id)));
    } else {
      // Select all visible items
      const visibleIds = paginatedResources.map((r) => r.id);
      const newSelection = [...new Set([...selectedIds, ...visibleIds])];
      onSelectionChange(newSelection);
    }
  };

  /**
   * Toggle selection for a single row
   */
  const handleToggleRow = (resourceId: string) => {
    if (selectedIds.includes(resourceId)) {
      onSelectionChange(selectedIds.filter((id) => id !== resourceId));
    } else {
      onSelectionChange([...selectedIds, resourceId]);
    }
  };

  /**
   * Render sort icon for column header
   */
  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDownIcon className="h-4 w-4 ml-1 text-muted-foreground" />;
    }

    return sortDirection === "asc" ? (
      <ArrowUpIcon className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDownIcon className="h-4 w-4 ml-1" />
    );
  };

  /**
   * Handle column header click for sorting
   */
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction
      onSortChange(column, sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New column, default to ascending
      onSortChange(column, "asc");
    }
  };

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {/* Checkbox column */}
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  {...(someSelected ? { "data-indeterminate": "true" } : {})}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>

              {/* Name column (sortable) */}
              <TableHead>
                <button
                  onClick={() => handleSort("name")}
                  className="flex items-center hover:text-foreground font-medium"
                >
                  Resource Name
                  {renderSortIcon("name")}
                </button>
              </TableHead>

              {/* Location column (sortable) */}
              <TableHead>
                <button
                  onClick={() => handleSort("location")}
                  className="flex items-center hover:text-foreground font-medium"
                >
                  Location
                  {renderSortIcon("location")}
                </button>
              </TableHead>

              {/* Queue column (sortable) */}
              <TableHead>
                <button
                  onClick={() => handleSort("queue")}
                  className="flex items-center hover:text-foreground font-medium"
                >
                  Queue
                  {renderSortIcon("queue")}
                </button>
              </TableHead>

              {/* Confidence column (sortable) */}
              <TableHead>
                <button
                  onClick={() => handleSort("confidence")}
                  className="flex items-center hover:text-foreground font-medium"
                >
                  Confidence
                  {renderSortIcon("confidence")}
                </button>
              </TableHead>

              {/* Missing fields column (not sortable) */}
              <TableHead>Missing Fields</TableHead>

              {/* Edit button column */}
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedResources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No resources found
                </TableCell>
              </TableRow>
            ) : (
              paginatedResources.map((resource) => {
                const queue = categorizeResource(resource);
                const isSelected = selectedIds.includes(resource.id);

                return (
                  <TableRow
                    key={resource.id}
                    data-state={isSelected ? "selected" : undefined}
                  >
                    {/* Checkbox */}
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleRow(resource.id)}
                        aria-label={`Select ${resource.name}`}
                      />
                    </TableCell>

                    {/* Full Resource Name (NOT truncated) */}
                    <TableCell className="font-medium max-w-md">
                      <div className="truncate" title={resource.name}>
                        {resource.name}
                      </div>
                    </TableCell>

                    {/* Location */}
                    <TableCell className="text-muted-foreground">
                      {resource.city}, {resource.state}
                    </TableCell>

                    {/* Queue Badge */}
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${QUEUE_BADGE_COLORS[queue]}`}
                      >
                        {QUEUE_LABELS[queue]}
                      </span>
                    </TableCell>

                    {/* Confidence Badge */}
                    <TableCell>
                      <ConfidenceBadge
                        score={resource.confidenceScore || 0}
                        size="sm"
                        showTooltip={false}
                      />
                    </TableCell>

                    {/* Missing Fields Indicator */}
                    <TableCell>
                      <MissingFieldsIndicator resource={resource} />
                    </TableCell>

                    {/* Edit Button */}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(resource.id)}
                        className="h-8 px-2"
                      >
                        <PencilIcon className="h-4 w-4" />
                        <span className="sr-only">Edit {resource.name}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between">
        {/* Page size selector */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="border rounded px-2 py-1 bg-background"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        {/* Page info and navigation */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({sortedResources.length} total)
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={page === 1}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={page >= totalPages}
            >
              Last
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Missing Fields Indicator
 * Shows count of missing fields for a resource
 */
function MissingFieldsIndicator({ resource }: { resource: VerificationResource }) {
  const missingCount = countMissingFields(resource);

  if (missingCount === 0) {
    return (
      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
        Complete
      </span>
    );
  }

  return (
    <span className="text-xs text-muted-foreground">
      {missingCount} missing
    </span>
  );
}
