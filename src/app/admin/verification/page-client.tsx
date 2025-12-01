/**
 * Admin Verification Page - Client Component
 *
 * Main orchestrator for the redesigned verification workspace.
 * Responsibilities:
 * - Manage filter state
 * - Apply filters to resources
 * - Handle resource actions (verify, enhance, reject)
 * - Show resource detail panel
 *
 * This is a CLEAN orchestrator - all complex logic is delegated to child components.
 */

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

import { VerificationSearchBar } from "./components/verification-search-bar";
import { QueueBoard } from "./components/queue-board";
import type { VerificationResource, VerificationFilters } from "./types";

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

  // Loading states for async actions
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Apply filters to resources
  const filteredResources = useMemo(() => {
    return applyFilters(initialResources, filters);
  }, [initialResources, filters]);

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

      // Refresh page data
      router.refresh();
    } catch (error) {
      console.error("Flagging error:", error);
      alert("Failed to flag resources. Please try again.");
    }
  };

  /**
   * Handle clicking on a resource card (show detail panel)
   */
  const handleResourceClick = (resourceId: string) => {
    // For now, just log - we'll implement detail panel next
    console.log("Resource clicked:", resourceId);
    // TODO: Open detail panel with resource details
  };

  /**
   * Handle scanning for new resources in an area
   */
  const handleScanArea = () => {
    // Navigate to existing scan dialog
    // We can trigger the scan dialog here or navigate to a dedicated page
    console.log("Opening scan dialog...");
    // For now, just show a message
    // TODO: Integrate with existing ScanDialog component
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Page header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Verification Workspace</h1>
        <p className="text-sm text-muted-foreground">
          Review and verify discovered food bank resources. Resources are
          organized by priority—start with Quick Wins for easy completions.
        </p>
      </div>

      {/* Search and filters */}
      <VerificationSearchBar
        filters={filters}
        onFiltersChange={setFilters}
        onScanArea={handleScanArea}
        resultCount={filteredResources.length}
      />

      {/* Queue board */}
      <div className="flex-1 min-h-0">
        <QueueBoard
          resources={filteredResources}
          isLoading={isEnhancing || isVerifying}
          onResourceClick={handleResourceClick}
          onVerify={handleVerify}
          onEnhance={handleEnhance}
          onReject={handleReject}
          onFlagDuplicate={handleFlagDuplicate}
        />
      </div>
    </div>
  );
}

/**
 * Apply filters to resources
 * Filters by search query, location, confidence range, and missing fields
 */
function applyFilters(
  resources: VerificationResource[],
  filters: VerificationFilters
): VerificationResource[] {
  return resources.filter((resource) => {
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
