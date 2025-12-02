/**
 * Admin Verification Page - Client Component
 *
 * Main orchestrator for the redesigned verification workspace with DATA TABLE.
 * Responsibilities:
 * - Manage filter state and table state (pagination, sorting, selection)
 * - Apply filters to resources
 * - Handle resource actions (verify, enhance, reject)
 * - Show resource detail panel (side sheet)
 *
 * This is a CLEAN orchestrator - all complex logic is delegated to child components.
 */

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

import { VerificationSearchBar } from "./components/verification-search-bar";
import { VerificationTable } from "./components/verification-table";
import { ArchiveFilter } from "./components/archive-filter";
import { ScanDialog } from "./components/scan-dialog";
import { ResourceEditor } from "./components/resource-editor";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type {
  VerificationResource,
  VerificationFilters,
  SortColumn,
  SortDirection,
  ArchiveMode,
} from "./types";

interface VerificationPageClientProps {
  /** Initial resources from server */
  initialResources: VerificationResource[];
}

export function VerificationPageClient({
  initialResources,
}: VerificationPageClientProps) {
  const router = useRouter();

  // Filter state
  const [filters, setFilters] = useState<VerificationFilters>({
    searchQuery: "",
    activeQueues: ["quick_wins", "high_impact", "needs_work", "flagged"],
    confidenceMin: 0,
    confidenceMax: 100,
    location: null,
    missingFields: [],
    sources: [],
  });

  // Archive filter state
  const [archiveMode, setArchiveMode] = useState<ArchiveMode>("active");

  // Table state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortColumn, setSortColumn] = useState<SortColumn>("confidence");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Loading states for async actions
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Side panel state
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

  // Apply filters to resources
  const filteredResources = useMemo(() => {
    return applyFilters(initialResources, filters, archiveMode);
  }, [initialResources, filters, archiveMode]);

  // Reset page when filters change
  useMemo(() => {
    setPage(1);
  }, [filters, archiveMode]);

  /**
   * Handle verifying one or more resources
   */
  const handleVerify = async (resourceIds: string[]) => {
    setIsVerifying(true);

    try {
      // Call API to mark resources as verified
      const response = await fetch("/api/admin/resources/bulk-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceIds }),
      });

      if (!response.ok) throw new Error("Verification failed");

      // Show success message
      alert(
        `✅ ${resourceIds.length} ${
          resourceIds.length === 1 ? "resource" : "resources"
        } verified`
      );

      // Clear selection
      setSelectedIds([]);

      // Refresh page data
      router.refresh();
    } catch (error) {
      console.error("Verification error:", error);
      alert("Failed to verify resources. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * Handle enhancing resources with AI
   */
  const handleEnhance = async (resourceIds: string[]) => {
    setIsEnhancing(true);

    try {
      // Show processing message
      console.log(`🔄 Enhancing ${resourceIds.length} resources with AI...`);

      // Call API to enhance resources
      const response = await fetch("/api/admin/resources/bulk-enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceIds }),
      });

      if (!response.ok) throw new Error("Enhancement failed");

      const data = await response.json();

      // Show success message
      alert(
        `✨ ${data.enhanced} ${
          data.enhanced === 1 ? "resource" : "resources"
        } enhanced`
      );

      // Clear selection
      setSelectedIds([]);

      // Refresh page data
      router.refresh();
    } catch (error) {
      console.error("Enhancement error:", error);
      alert("Failed to enhance resources. Please try again.");
    } finally {
      setIsEnhancing(false);
    }
  };

  /**
   * Handle rejecting resources
   */
  const handleReject = async (resourceIds: string[]) => {
    // Confirm rejection
    const confirmed = confirm(
      `Are you sure you want to reject ${resourceIds.length} ${
        resourceIds.length === 1 ? "resource" : "resources"
      }?`
    );

    if (!confirmed) return;

    try {
      // Call API to reject resources
      const response = await fetch("/api/admin/resources/bulk-reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceIds }),
      });

      if (!response.ok) throw new Error("Rejection failed");

      // Show success message
      alert(
        `❌ ${resourceIds.length} ${
          resourceIds.length === 1 ? "resource" : "resources"
        } rejected`
      );

      // Clear selection
      setSelectedIds([]);

      // Refresh page data
      router.refresh();
    } catch (error) {
      console.error("Rejection error:", error);
      alert("Failed to reject resources. Please try again.");
    }
  };

  /**
   * Handle flagging resources as duplicates
   */
  const handleFlagDuplicate = async (resourceIds: string[]) => {
    try {
      // Call API to flag resources
      const response = await fetch("/api/admin/resources/bulk-flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceIds,
          flag: "potential_duplicate",
        }),
      });

      if (!response.ok) throw new Error("Flagging failed");

      // Show success message
      alert(
        `⚠️ ${resourceIds.length} ${
          resourceIds.length === 1 ? "resource" : "resources"
        } flagged for review`
      );

      // Clear selection
      setSelectedIds([]);

      // Refresh page data
      router.refresh();
    } catch (error) {
      console.error("Flagging error:", error);
      alert("Failed to flag resources. Please try again.");
    }
  };

  /**
   * Handle clicking edit button (show detail panel)
   */
  const handleEdit = (resourceId: string) => {
    setSelectedResourceId(resourceId);
  };

  /**
   * Handle scan complete - refresh data
   */
  const handleScanComplete = () => {
    router.refresh();
  };

  /**
   * Handle sort change
   */
  const handleSortChange = (column: SortColumn, direction: SortDirection) => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  /**
   * Handle page size change
   */
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1); // Reset to first page
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Page header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Verification Workspace</h1>
        <p className="text-sm text-muted-foreground">
          Review and verify discovered food bank resources. Default sort: lowest
          confidence first (easiest to improve).
        </p>
      </div>

      {/* Archive filter */}
      <ArchiveFilter
        value={archiveMode}
        onChange={setArchiveMode}
        counts={{
          active: initialResources.filter((r) => r.verificationStatus !== "archived")
            .length,
          archived: initialResources.filter((r) => r.verificationStatus === "archived")
            .length,
          all: initialResources.length,
        }}
      />

      {/* Search and filters */}
      <VerificationSearchBar
        filters={filters}
        onFiltersChange={setFilters}
        resultCount={filteredResources.length}
        scanDialogSlot={<ScanDialog onScanComplete={handleScanComplete} />}
      />

      {/* Bulk actions bar (shown when items selected) */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
          <span className="text-sm font-medium">
            {selectedIds.length} selected
          </span>
          <div className="flex-1" />
          <button
            onClick={() => handleVerify(selectedIds)}
            disabled={isVerifying}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Verify
          </button>
          <button
            onClick={() => handleEnhance(selectedIds)}
            disabled={isEnhancing}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Enhance
          </button>
          <button
            onClick={() => handleReject(selectedIds)}
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reject
          </button>
          <button
            onClick={() => handleFlagDuplicate(selectedIds)}
            className="px-3 py-1.5 text-sm border rounded hover:bg-muted"
          >
            Flag
          </button>
        </div>
      )}

      {/* Verification table */}
      <div className="flex-1 min-h-0">
        <VerificationTable
          resources={filteredResources}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onEdit={handleEdit}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
        />
      </div>

      {/* Edit Side Panel */}
      <Sheet
        open={selectedResourceId !== null}
        onOpenChange={(open) => !open && setSelectedResourceId(null)}
      >
        <SheetContent side="right" className="w-[40%] sm:max-w-none overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Resource</SheetTitle>
            <SheetDescription>
              Make changes to the resource details. AI can help fill missing information.
            </SheetDescription>
          </SheetHeader>

          {selectedResourceId && (() => {
            const resource = initialResources.find((r) => r.id === selectedResourceId);
            if (!resource) return null;

            return (
              <ResourceEditor
                resourceId={selectedResourceId}
                initialResource={resource}
                onSave={() => {
                  setSelectedResourceId(null);
                  router.refresh();
                }}
                onClose={() => setSelectedResourceId(null)}
              />
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/**
 * Apply filters to resources
 * Filters by search query, location, confidence range, missing fields, and archive status
 */
function applyFilters(
  resources: VerificationResource[],
  filters: VerificationFilters,
  archiveMode: ArchiveMode
): VerificationResource[] {
  return resources.filter((resource) => {
    // Archive filter
    if (archiveMode === "active" && resource.verificationStatus === "archived") {
      return false;
    }
    if (archiveMode === "archived" && resource.verificationStatus !== "archived") {
      return false;
    }
    // "all" shows everything

    // Search query filter (name, address, city)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const searchable = [
        resource.name,
        resource.address,
        resource.city,
        resource.state,
      ]
        .join(" ")
        .toLowerCase();

      if (!searchable.includes(query)) {
        return false;
      }
    }

    // Location filter (city, state, or zip)
    if (filters.location) {
      const location = filters.location.toLowerCase();
      const resourceLocation = [
        resource.city,
        resource.state,
        resource.zipCode,
      ]
        .join(" ")
        .toLowerCase();

      if (!resourceLocation.includes(location)) {
        return false;
      }
    }

    // Confidence range filter
    const confidencePercent = (resource.confidenceScore || 0) * 100;
    if (
      confidencePercent < filters.confidenceMin ||
      confidencePercent > filters.confidenceMax
    ) {
      return false;
    }

    // Missing fields filter
    if (filters.missingFields.length > 0) {
      const hasMissingField = filters.missingFields.some((field) => {
        switch (field) {
          case "phone":
            return !resource.phone;
          case "website":
            return !resource.website;
          case "hours":
            return !resource.hours;
          case "description":
            return !resource.description;
          case "services":
            return !resource.services || resource.services.length === 0;
          default:
            return false;
        }
      });

      // Only show resources that have at least one of the selected missing fields
      if (!hasMissingField) {
        return false;
      }
    }

    return true;
  });
}
