"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import type {
  MissingFieldFilter,
  ResourceStats,
} from "@/lib/admin-queries";
import { ScanDialog } from "./components/scan-dialog";

export type SerializedAdminResource = {
  resource: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    latitude: number;
    longitude: number;
    phone: string | null;
    website: string | null;
    description: string | null;
    services: string[] | null;
    hours: Record<
      string,
      { open: string; close: string; closed?: boolean } | null
    > | null;
    verificationStatus: string;
    importSource: string | null;
    autoDiscoveredAt: string | null;
    communityVerifiedAt: string | null;
    adminVerifiedBy: string | null;
    // Pipeline Fields
    confidenceScore: number | null;
    sourceUrl: string | null;
    rawHours: string | null;
    aiSummary: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  };
  missingHours: boolean;
  missingPhone: boolean;
  missingWebsite: boolean;
  missingDescription: boolean;
  missingAddress: boolean;
  potentialDuplicate: boolean;
};

type FiltersState = {
  sort: "newest" | "oldest";
  requireMissingInfo: boolean;
  requireCompleteInfo?: boolean;
  onlyPotentialDuplicates: boolean;
  missingFields?: MissingFieldFilter[];
  showArchived?: boolean;
  confidenceBucket?: "high" | "medium" | "low" | "all";
};

export type VerificationPageData = {
  items: SerializedAdminResource[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
  filters: FiltersState;
  stats: ResourceStats;
};

type VerificationPageClientProps = {
  initialData: VerificationPageData;
};

type EnhancementProposal = {
  summary: string;
  confidence: number;
  sources: string[];
  proposed: {
    phone?: string | null;
    website?: string | null;
    description?: string | null;
    services?: string[] | null;
    hours?: SerializedAdminResource["resource"]["hours"];
  };
  focusField?: string | null;
};

const missingOptions: { label: string; value: MissingFieldFilter }[] = [
  { label: "Address", value: "address" },
  { label: "Hours", value: "hours" },
  { label: "Phone", value: "phone" },
  { label: "Website", value: "website" },
  { label: "Description", value: "description" },
];

const batchActions = [
  { label: "Mark Verified", status: "official" },
  { label: "Community Verified", status: "community_verified" },
  { label: "Mark Duplicate", status: "duplicate" },
  { label: "Reject", status: "rejected" },
  { label: "Move to Inbox", status: "unverified" },
];

export default function VerificationPageClient({
  initialData,
}: VerificationPageClientProps) {
  const [data, setData] = useState<VerificationPageData>(initialData);
  const [filters, setFilters] = useState<FiltersState>(initialData.filters);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeResourceId, setActiveResourceId] = useState<string | null>(
    initialData.items[0]?.resource.id ?? null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enhancement, setEnhancement] = useState<EnhancementProposal | null>(
    null
  );
  const [enhancementError, setEnhancementError] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementQueue, setEnhancementQueue] = useState<
    Record<string, EnhancementProposal | "loading" | "error">
  >({});
  const [isQueueProcessing, setIsQueueProcessing] = useState(false);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);

  const activeResource = useMemo(
    () =>
      data.items.find((item) => item.resource.id === activeResourceId) ?? null,
    [activeResourceId, data.items]
  );

  // Refresh list helper for child components
  const refreshList = () => fetchResources(filters, data.pagination.offset);

  const currentPage = Math.floor(
    data.pagination.offset / Math.max(1, data.pagination.limit)
  );
  const totalPages = Math.max(
    1,
    Math.ceil(data.pagination.total / Math.max(1, data.pagination.limit))
  );

  const missingFieldSet = useMemo(
    () => new Set(filters.missingFields ?? []),
    [filters.missingFields]
  );

  useEffect(() => {
    setEnhancement(null);
    setEnhancementError(null);
    setIsEnhancing(false);
  }, [activeResourceId]);

  const fetchResources = useCallback(
    async (nextFilters: FiltersState, offset = 0) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          limit: String(data.pagination.limit),
          offset: String(offset),
          sort: nextFilters.sort,
        });

        if (nextFilters.requireMissingInfo) {
          params.set("missingOnly", "true");
        } else if (nextFilters.requireCompleteInfo) {
          params.set("completeOnly", "true");
        }
        if (nextFilters.onlyPotentialDuplicates) {
          params.set("duplicates", "only");
        }
        if (nextFilters.missingFields?.length) {
          params.set("missing", nextFilters.missingFields.join(","));
        }
        if (nextFilters.showArchived) {
          params.set("archived", "true");
        }
        if (nextFilters.confidenceBucket) {
          // This requires backend support for filtering by confidence bucket.
          // For now, we can sort client-side or filter client-side if the list is small,
          // but ideally backend should filter.
          // I will filter client-side for simplicity in this iteration since pagination is small.
          // Or I can add it to params if I update backend query.
          // Let's filter client-side for now as "Triage Mode".
        }

        const response = await fetch(`/api/admin/resources?${params}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load admin resources.");
        }

        const payload = (await response.json()) as VerificationPageData;
        setData(payload);
        setFilters(payload.filters);
        setSelectedIds((prev) =>
          prev.filter((id) =>
            payload.items.some((item) => item.resource.id === id)
          )
        );
        if (payload.items.length > 0) {
          setActiveResourceId(payload.items[0].resource.id);
        } else {
          setActiveResourceId(null);
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        setIsLoading(false);
      }
    },
    [data.pagination.limit]
  );

  const handleFilterChange = (changes: Partial<FiltersState>) => {
    const nextFilters = { ...filters, ...changes };
    setFilters(nextFilters);
    fetchResources(nextFilters, 0);
  };

  const handleMissingFieldToggle = (field: MissingFieldFilter) => {
    const current = filters.missingFields ?? [];
    const exists = current.includes(field);
    const updated = exists
      ? current.filter((value) => value !== field)
      : [...current, field];
    handleFilterChange({ missingFields: updated });
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 0 || nextPage >= totalPages) return;
    const offset = nextPage * data.pagination.limit;
    fetchResources(filters, offset);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === data.items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.items.map((item) => item.resource.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  };

  const handleRunPipeline = async () => {
    setIsPipelineRunning(true);
    try {
      const res = await fetch("/api/admin/pipeline/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchSize: 5 }),
      });
      if (!res.ok) throw new Error("Pipeline failed");
      const result = await res.json();
      setStatusMessage(`Pipeline processed ${result.processed} items.`);
      refreshList();
    } catch (err) {
      console.error(err);
      setError("Failed to run pipeline");
    } finally {
      setIsPipelineRunning(false);
    }
  };

  const handleBatchEnhance = async () => {
    if (selectedIds.length === 0) return;
    setIsQueueProcessing(true);
    
    // Mark all selected as loading
    setEnhancementQueue((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        if (!next[id]) next[id] = "loading";
      });
      return next;
    });

    const CONCURRENCY = 1;
    const idsToProcess = selectedIds.filter(
      (id) => enhancementQueue[id] !== "loading" && typeof enhancementQueue[id] !== "object"
    );

    for (let i = 0; i < idsToProcess.length; i += CONCURRENCY) {
      const chunk = idsToProcess.slice(i, i + CONCURRENCY);
      await Promise.all(
        chunk.map(async (id) => {
          try {
            const response = await fetch(
              `/api/admin/resources/${id}/enhance`,
              { method: "POST" }
            );
            if (!response.ok) throw new Error("Failed");
            const proposal = (await response.json()) as EnhancementProposal;
            setEnhancementQueue((prev) => ({ ...prev, [id]: proposal }));
          } catch {
            setEnhancementQueue((prev) => ({ ...prev, [id]: "error" }));
          }
        })
      );
    }
    setIsQueueProcessing(false);
  };

  const handleBatchUpdate = async (
    status: string,
    targetIds?: string[]
  ): Promise<void> => {
    const idsToUpdate = targetIds ?? selectedIds;
    if (idsToUpdate.length === 0) return;

    setIsUpdating(true);
    setStatusMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: idsToUpdate, status }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update resources.");
      }

      const body = (await response.json()) as { updatedIds: string[] };
      setStatusMessage(
        `Updated ${body.updatedIds.length} resource${
          body.updatedIds.length === 1 ? "" : "s"
        }.`
      );
      setSelectedIds((prev) =>
        prev.filter((id) => !body.updatedIds.includes(id))
      );
      // Refresh current page
      fetchResources(filters, data.pagination.offset);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEnhance = async (resourceId: string, field?: string) => {
    setIsEnhancing(true);
    setEnhancementError(null);
    setEnhancement(null);
    try {
      const search = field ? `?field=${encodeURIComponent(field)}` : "";
      const response = await fetch(
        `/api/admin/resources/${resourceId}/enhance${search}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Enhancement failed");
      }
      const proposal = (await response.json()) as EnhancementProposal;
      setEnhancement(proposal);
    } catch (err) {
      console.error(err);
      setEnhancementError(
        err instanceof Error ? err.message : "Failed to enhance resource."
      );
    } finally {
      setIsEnhancing(false);
    }
  };

  // Check queue for active resource enhancement
  useEffect(() => {
    if (activeResourceId && enhancementQueue[activeResourceId] && typeof enhancementQueue[activeResourceId] === 'object') {
       setEnhancement(enhancementQueue[activeResourceId] as EnhancementProposal);
    }
  }, [activeResourceId, enhancementQueue]);

  const handleNext = () => {
    if (!activeResourceId) return;
    const currentIndex = data.items.findIndex(item => item.resource.id === activeResourceId);
    if (currentIndex >= 0 && currentIndex < data.items.length - 1) {
      setActiveResourceId(data.items[currentIndex + 1].resource.id);
    }
  };

  const statusBadge = (resource: SerializedAdminResource) => {
    const status = resource.resource.verificationStatus;
    if (status === "official") {
      return <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-500/20">Verified</Badge>;
    }
    if (status === "community_verified") {
      return <Badge className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border-blue-500/20">Community</Badge>;
    }
    if (status === "rejected") {
      return <Badge variant="destructive">Rejected</Badge>;
    }
    if (status === "duplicate") {
      return <Badge variant="secondary">Duplicate</Badge>;
    }

    if (resource.potentialDuplicate) {
      return <Badge variant="outline">Possible Duplicate</Badge>;
    }
    if (resource.missingAddress || resource.missingHours || resource.missingPhone) {
      return <Badge variant="outline">Needs Info</Badge>;
    }
    return <Badge variant="outline">Review</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Verification Workspace
            </h1>
            <p className="text-sm text-muted-foreground">
              Triage newly discovered resources before publishing.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchResources(filters, data.pagination.offset)}
            disabled={isLoading}
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleRunPipeline}
            disabled={isPipelineRunning}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isPipelineRunning ? (
              <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              "🚀"
            )}
            Run Pipeline
          </Button>
          <ScanDialog onScanComplete={refreshList} />
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>Queue</span>
          <span>•</span>
          <span>{data.pagination.total} items</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-4 rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            {/* Triage Tabs */}
            <div className="flex items-center rounded-lg border p-1 bg-muted/20">
              <Button
                variant={filters.confidenceBucket === "high" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs text-emerald-600 font-medium"
                onClick={() => handleFilterChange({ confidenceBucket: "high" })}
              >
                High Confidence
              </Button>
              <Button
                variant={filters.confidenceBucket === "medium" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs text-amber-600 font-medium"
                onClick={() => handleFilterChange({ confidenceBucket: "medium" })}
              >
                Ambiguous
              </Button>
              <Button
                variant={filters.confidenceBucket === "all" || !filters.confidenceBucket ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => handleFilterChange({ confidenceBucket: "all" })}
              >
                All Unverified
              </Button>
            </div>
            
            <div className="h-6 w-px bg-border" />

            <div className="flex items-center rounded-lg border p-1 bg-muted/20">
              <Button
                variant={!filters.requireMissingInfo && !filters.requireCompleteInfo ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => handleFilterChange({ requireMissingInfo: false, requireCompleteInfo: false })}
              >
                Any
              </Button>
              <Button
                variant={filters.requireMissingInfo ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => handleFilterChange({ requireMissingInfo: true, requireCompleteInfo: false })}
              >
                Missing Info
              </Button>
              <Button
                variant={filters.requireCompleteInfo ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => handleFilterChange({ requireMissingInfo: false, requireCompleteInfo: true })}
              >
                Complete Info
              </Button>
            </div>

            <div className="h-6 w-px bg-border" />

            <Checkbox
              id="duplicates-only"
              checked={filters.onlyPotentialDuplicates}
              onCheckedChange={() =>
                handleFilterChange({
                  onlyPotentialDuplicates: !filters.onlyPotentialDuplicates,
                })
              }
            />
            <label
              htmlFor="duplicates-only"
              className="text-sm font-medium text-foreground"
            >
              Potential duplicates
            </label>

            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                handleFilterChange({
                  sort: filters.sort === "newest" ? "oldest" : "newest",
                })
              }
            >
              Sort: {filters.sort === "newest" ? "Newest first" : "Oldest first"}
            </Button>

            <div className="h-6 w-px bg-border" />

            <div className="flex items-center gap-2">
              <Checkbox
                id="show-archived"
                checked={filters.showArchived}
                onCheckedChange={() =>
                  handleFilterChange({ showArchived: !filters.showArchived })
                }
              />
              <label
                htmlFor="show-archived"
                className="text-sm font-medium text-foreground"
              >
                Show Archived
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Missing fields:</span>
            {missingOptions.map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant={missingFieldSet.has(option.value) ? "default" : "ghost"}
                className="h-7"
                onClick={() => handleMissingFieldToggle(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          <Separator />

          <div className="flex flex-wrap items-center gap-2">
            <Checkbox
              id="select-all"
              checked={
                data.items.length > 0 &&
                selectedIds.length === data.items.length
              }
              onCheckedChange={toggleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm text-muted-foreground">
              Select all
            </label>
            <div className="ml-auto flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="default"
                disabled={selectedIds.length === 0 || isQueueProcessing}
                onClick={handleBatchEnhance}
              >
                {isQueueProcessing ? (
                  <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  "✨"
                )}
                Prep with AI
              </Button>
              <Separator orientation="vertical" className="h-6" />
              {batchActions.map((action) => (
                <Button
                  key={action.status}
                  size="sm"
                  variant="outline"
                  disabled={selectedIds.length === 0 || isUpdating}
                  onClick={() => handleBatchUpdate(action.status)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {statusMessage && !error && (
            <div className="rounded-md border border-emerald-400/60 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {statusMessage}
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Address</th>
                  <th className="px-4 py-3 font-medium">Missing</th>
                  <th className="px-4 py-3 font-medium text-right">Queue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70 bg-background/60">
                {data.items
                  .filter((item) => {
                    if (!filters.confidenceBucket || filters.confidenceBucket === "all") return true;
                    const score = item.resource.confidenceScore ?? 0;
                    if (filters.confidenceBucket === "high") return score >= 0.8;
                    if (filters.confidenceBucket === "medium") return score >= 0.4 && score < 0.8;
                    if (filters.confidenceBucket === "low") return score < 0.4;
                    return true;
                  })
                  .map((item) => (
                  <tr
                    key={item.resource.id}
                    className="cursor-pointer transition hover:bg-muted/50"
                    onClick={() => setActiveResourceId(item.resource.id)}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedIds.includes(item.resource.id)}
                          onCheckedChange={() => toggleSelect(item.resource.id)}
                          onClick={(event) => event.stopPropagation()}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {item.resource.name}
                            </span>
                            {enhancementQueue[item.resource.id] === "loading" && (
                              <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
                            )}
                            {typeof enhancementQueue[item.resource.id] === "object" && (
                              <span className="text-[10px] text-emerald-600">✨ Ready</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.resource.importSource || "Manual"}
                          </div>
                        </div>
                      </div>
                      {/* AI Score Indicator */}
                      {item.resource.confidenceScore != null && item.resource.confidenceScore > 0 && (
                        <div className="ml-8 mt-1 flex items-center gap-1 text-[10px]">
                           <span className={
                             item.resource.confidenceScore >= 0.8 ? "text-emerald-600 font-bold" :
                             item.resource.confidenceScore >= 0.5 ? "text-amber-600 font-bold" :
                             "text-muted-foreground"
                           }>
                             {(item.resource.confidenceScore * 100).toFixed(0)}% Confidence
                           </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      <div>{item.resource.address}</div>
                      <div className="text-xs">
                        {item.resource.city}, {item.resource.state}{" "}
                        {item.resource.zipCode}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {item.missingAddress && (
                          <Badge variant="outline" className="text-xs">
                            Address
                          </Badge>
                        )}
                        {item.missingHours && (
                          <Badge variant="outline" className="text-xs">
                            Hours
                          </Badge>
                        )}
                        {item.missingPhone && (
                          <Badge variant="outline" className="text-xs">
                            Phone
                          </Badge>
                        )}
                        {item.missingWebsite && (
                          <Badge variant="outline" className="text-xs">
                            Website
                          </Badge>
                        )}
                        {item.missingDescription && (
                          <Badge variant="outline" className="text-xs">
                            Description
                          </Badge>
                        )}
                        {!item.missingHours &&
                          !item.missingAddress &&
                          !item.missingPhone &&
                          !item.missingWebsite &&
                          !item.missingDescription && (
                            <span className="text-xs text-muted-foreground">
                              Complete
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {statusBadge(item)}
                    </td>
                  </tr>
                ))}

                {data.items.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-sm text-muted-foreground"
                    >
                      No resources match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Page {currentPage + 1} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 0 || isLoading}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage + 1 >= totalPages || isLoading}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <ResourceEditorPanel
          resource={activeResource}
          onStatusChange={handleBatchUpdate}
          onRefresh={refreshList}
          isUpdating={isUpdating}
          onEnhance={handleEnhance}
          enhancement={enhancement}
          enhancementError={enhancementError}
          isEnhancing={isEnhancing}
          onNext={handleNext}
          hasNext={Boolean(activeResourceId && data.items.findIndex(i => i.resource.id === activeResourceId) < data.items.length - 1)}
        />
      </div>
    </div>
  );
}

type ResourceEditorPanelProps = {
  resource: SerializedAdminResource | null;
  onStatusChange: (status: string, ids?: string[]) => void;
  onRefresh: () => void;
  isUpdating: boolean;
  onEnhance: (resourceId: string, field?: string) => void;
  enhancement: EnhancementProposal | null;
  enhancementError: string | null;
  isEnhancing: boolean;
  onNext?: () => void;
  hasNext?: boolean;
};

function ResourceEditorPanel({
  resource,
  onStatusChange,
  onRefresh,
  isUpdating,
  onEnhance,
  enhancement,
  enhancementError,
  isEnhancing,
  onNext,
  hasNext,
}: ResourceEditorPanelProps) {
  const [formData, setFormData] = useState<Partial<SerializedAdminResource["resource"]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [hoursInput, setHoursInput] = useState("");
  const [isParsingHours, setIsParsingHours] = useState(false);

  // Sync form data when resource changes
  useEffect(() => {
    if (resource) {
      setFormData(resource.resource);
      setIsEditingHours(false);
      setHoursInput("");
    } else {
      setFormData({});
    }
  }, [resource]);

  const handleInputChange = <K extends keyof SerializedAdminResource["resource"]>(
    field: K,
    value: SerializedAdminResource["resource"][K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyEnhancement = () => {
    if (!enhancement?.proposed) return;
    setFormData((prev) => ({
      ...prev,
      ...enhancement.proposed,
      // Ensure we don't wipe existing data if proposal is null for some fields
      phone: enhancement.proposed.phone ?? prev.phone,
      website: enhancement.proposed.website ?? prev.website,
      description: enhancement.proposed.description ?? prev.description,
      services: enhancement.proposed.services ?? prev.services,
      hours: enhancement.proposed.hours ?? prev.hours,
    }));
  };

  const handleParseHours = async () => {
    if (!hoursInput.trim()) return;
    setIsParsingHours(true);
    try {
      const res = await fetch("/api/admin/parse-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: hoursInput }),
      });
      if (!res.ok) throw new Error("Failed to parse");
      type Hours = NonNullable<SerializedAdminResource["resource"]["hours"]>;
      const data = (await res.json()) as { hours: Hours };
      setFormData((prev) => ({ ...prev, hours: data.hours }));
      setIsEditingHours(false);
    } catch (error) {
      console.error(error);
      alert("Could not understand schedule format. Please try again.");
    } finally {
      setIsParsingHours(false);
    }
  };

  const handleSave = async () => {
    if (!resource) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/resources/${resource.resource.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save updates");
      
      // Refresh the list to reflect changes
      onRefresh();
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerify = async (status: string) => {
    if (!resource) return;
    const isDirty = JSON.stringify(formData) !== JSON.stringify(resource.resource);
    if (isDirty) {
      await handleSave();
    }
    await onStatusChange(status, [resource.resource.id]);
    if (onNext) onNext();
  };

  useEffect(() => {
    if (!resource) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleVerify("official");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [formData, resource]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!resource) {
    return (
      <Card className="h-full rounded-3xl border border-dashed border-border/70 bg-card/70">
        <CardContent className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
          Select a resource to review its details.
        </CardContent>
      </Card>
    );
  }

  const { resource: details } = resource;
  const isDirty = JSON.stringify(formData) !== JSON.stringify(details);

  const missingAddress =
    !formData.address ||
    formData.address.trim() === "" ||
    !formData.city ||
    formData.city.trim() === "" ||
    !formData.state ||
    formData.state.trim() === "" ||
    formData.latitude === 0 ||
    formData.longitude === 0;
  const missingPhone = !formData.phone || formData.phone.trim() === "";
  const missingWebsite = !formData.website || formData.website.trim() === "";
  const missingDescription =
    !formData.description || formData.description.trim() === "";
  const missingHours = !formData.hours;

  const fieldDiffs = computeDiffs(formData as SerializedAdminResource["resource"], enhancement?.proposed ?? null);

  return (
    <Card className="sticky top-8 h-fit rounded-3xl border border-border/70 bg-card/95">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold">
            <Input 
              value={formData.name ?? ""} 
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="h-auto border-transparent px-0 text-lg font-semibold focus-visible:ring-0"
            />
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {formData.address}, {formData.city}, {formData.state} {formData.zipCode}
          </p>
        </div>
        {isDirty && (
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="rounded-2xl border border-dashed border-border/70 p-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  AI Sous-Chef
                </p>
                <p className="text-xs text-muted-foreground">
                  Fetch missing details from trusted directories.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEnhance(details.id)}
                disabled={isEnhancing}
              >
                ✨ {isEnhancing ? "Searching…" : "Re-Run Analysis"}
              </Button>
            </div>
            
            {/* Existing AI Metadata Display */}
            {details.confidenceScore != null && details.confidenceScore > 0 && !enhancement && (
              <div className="space-y-2 rounded-xl bg-muted/30 p-3 text-xs border border-border/50">
                 <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">Previous Analysis</p>
                    <Badge variant="outline">{(details.confidenceScore * 100).toFixed(0)}% Score</Badge>
                 </div>
                 <p className="text-muted-foreground">{details.aiSummary}</p>
                 {details.sourceUrl && (
                   <a href={details.sourceUrl} target="_blank" rel="noreferrer" className="text-primary underline truncate block max-w-[250px]">
                     {details.sourceUrl}
                   </a>
                 )}
                 {details.rawHours && (
                   <div className="mt-2">
                     <p className="font-semibold text-foreground">Raw Hours Found:</p>
                     <p className="text-muted-foreground bg-background/50 p-1 rounded">{details.rawHours}</p>
                   </div>
                 )}
              </div>
            )}
            {enhancementError && (
              <p className="text-xs text-destructive">{enhancementError}</p>
            )}
            {enhancement && (
              <div className="space-y-2 rounded-xl bg-muted/50 p-3 text-xs">
                <p className="font-medium text-foreground">{enhancement.summary}</p>
                {enhancement.focusField && (
                  <p className="text-muted-foreground">
                    Focus: {enhancement.focusField}
                  </p>
                )}
                <p className="text-muted-foreground">
                  Confidence: {(enhancement.confidence * 100).toFixed(0)}%
                </p>
                {enhancement.sources.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">Sources</p>
                    <ul className="list-inside list-disc text-muted-foreground">
                      {enhancement.sources.map((source) => (
                        <li key={source} className="truncate">
                          <a
                            href={source}
                            className="text-primary underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {source}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {fieldDiffs.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">Proposed updates</p>
                      <Button size="sm" className="h-6 px-2 text-xs" onClick={handleApplyEnhancement}>Apply All</Button>
                    </div>
                    <div className="space-y-2">
                      {fieldDiffs.map((diff) => (
                        <FieldDiff
                          key={diff.label}
                          label={diff.label}
                          current={diff.current}
                          proposed={diff.proposed}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No new differences compared to current data.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Address
            </label>
            {missingAddress && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={() => onEnhance(details.id, "address")}
              >
                Find address
              </Button>
            )}
          </div>
          <div className="rounded-xl border border-border/60 bg-background/60 p-3 text-sm text-muted-foreground space-y-2">
            <Input 
              value={formData.address ?? ""} 
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Street Address"
              className="h-8 text-sm"
            />
            <div className="grid grid-cols-3 gap-2">
              <Input 
                value={formData.city ?? ""} 
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="City"
                className="h-8 text-sm"
              />
              <Input 
                value={formData.state ?? ""} 
                onChange={(e) => handleInputChange("state", e.target.value)}
                placeholder="State"
                className="h-8 text-sm"
              />
              <Input 
                value={formData.zipCode ?? ""} 
                onChange={(e) => handleInputChange("zipCode", e.target.value)}
                placeholder="Zip"
                className="h-8 text-sm"
              />
            </div>
            <p className="text-xs px-1">
              Lat/Lng: {formData.latitude?.toFixed(4) ?? 0}, {formData.longitude?.toFixed(4) ?? 0}
            </p>
          </div>
        </div>
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Phone
            </label>
            {missingPhone && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={() => onEnhance(details.id, "phone")}
              >
                Find phone
              </Button>
            )}
          </div>
          <Input 
            value={formData.phone ?? ""} 
            onChange={(e) => handleInputChange("phone", e.target.value)}
          />
        </div>
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Website
            </label>
            {missingWebsite && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={() => onEnhance(details.id, "website")}
              >
                Find website
              </Button>
            )}
          </div>
          <Input 
            value={formData.website ?? ""} 
            onChange={(e) => handleInputChange("website", e.target.value)}
          />
        </div>
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Description
            </label>
            {missingDescription && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={() => onEnhance(details.id, "description")}
              >
                Find description
              </Button>
            )}
          </div>
          <Textarea
            value={formData.description ?? ""}
            onChange={(e) => handleInputChange("description", e.target.value)}
            className="min-h-[120px]"
          />
        </div>
        <div className="grid gap-3">
          <label className="text-xs font-semibold uppercase text-muted-foreground">
            Services (Comma separated)
          </label>
          <Input 
            value={formData.services?.join(", ") ?? ""} 
            onChange={(e) => handleInputChange("services", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
          />
          <div className="flex flex-wrap gap-2">
            {formData.services?.map((service) => (
              <Badge key={service} variant="outline">
                {service}
              </Badge>
            ))}
          </div>
        </div>
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Hours
            </label>
            {missingHours && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={() => onEnhance(details.id, "hours")}
              >
                Find hours
              </Button>
            )}
          </div>
          {isEditingHours ? (
            <div className="space-y-2">
              <Textarea
                value={hoursInput}
                onChange={(e) => setHoursInput(e.target.value)}
                placeholder="e.g. Mon-Fri 9am to 5pm, Sat 10-2"
                className="min-h-[80px] text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleParseHours}
                  disabled={isParsingHours || !hoursInput.trim()}
                >
                  {isParsingHours ? "Parsing..." : "Apply Schedule"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingHours(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="group relative min-h-[60px] cursor-pointer rounded-xl border border-dashed p-3 text-sm hover:border-primary/50"
              onClick={() => setIsEditingHours(true)}
            >
              {formData.hours ? (
                Object.entries(formData.hours).map(([day, hours]) => (
                  <div
                    key={day}
                    className="flex items-center justify-between text-muted-foreground"
                  >
                    <span className="font-medium capitalize">{day}</span>
                    <span>
                      {hours
                        ? `${hours.open} - ${hours.close}${
                            hours.closed ? " (Closed)" : ""
                          }`
                        : "—"}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-muted-foreground">Click to add schedule...</span>
              )}
              <div className="absolute right-2 top-2 hidden group-hover:block">
                <Badge variant="secondary" className="opacity-90">
                  Edit
                </Badge>
              </div>
            </div>
          )}
        </div>
        <Separator />
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase text-muted-foreground">
            Actions
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => handleVerify("official")}
              disabled={isUpdating || isSaving}
              className="min-w-[140px]"
            >
              {hasNext ? "Verify & Next" : (isDirty ? "Save & Verify" : "Mark Verified")}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleVerify("community_verified")}
              disabled={isUpdating || isSaving}
            >
              Community Verified
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusChange("duplicate", [details.id])}
              disabled={isUpdating || isSaving}
            >
              Mark Duplicate
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onStatusChange("rejected", [details.id])}
              disabled={isUpdating || isSaving}
            >
              Reject
            </Button>
            {hasNext && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onNext}
                disabled={isUpdating || isSaving}
              >
                Skip
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground text-center pt-2">
            Tip: Press <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100"><span className="text-xs">⌘</span>Enter</kbd> to verify & next
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

type FieldDiffData = {
  label: string;
  current: string;
  proposed: string;
};

function computeDiffs(
  current: SerializedAdminResource["resource"],
  proposed: EnhancementProposal["proposed"] | null
): FieldDiffData[] {
  if (!proposed) return [];
  const diffs: FieldDiffData[] = [];

  const fields: Array<{
    key: keyof EnhancementProposal["proposed"];
    label: string;
    formatter?: (value: unknown) => string;
  }> = [
    { key: "phone", label: "Phone" },
    { key: "website", label: "Website" },
    { key: "description", label: "Description" },
    {
      key: "services",
      label: "Services",
      formatter: (value) =>
        Array.isArray(value) && value.length
          ? value.join(", ")
          : value
          ? String(value)
          : "—",
    },
    {
      key: "hours",
      label: "Hours",
      formatter: (value) => formatHours(value as SerializedAdminResource["resource"]["hours"]),
    },
  ];

  for (const field of fields) {
    const nextValue = proposed[field.key];
    if (typeof nextValue === "undefined") continue;
    const currentValue = current[field.key as keyof typeof current];
    if (isEqualValue(currentValue, nextValue)) continue;

    const formatter = field.formatter ?? ((value: unknown) => formatValue(value));
    diffs.push({
      label: field.label,
      current: formatter(currentValue),
      proposed: formatter(nextValue),
    });
  }

  return diffs;
}

function isEqualValue(a: unknown, b: unknown) {
  const normalize = (value: unknown): unknown => {
    if (typeof value === "string") {
      return value.trim();
    }
    if (Array.isArray(value)) {
      return value.map((item) => normalize(item));
    }
    if (value && typeof value === "object") {
      return JSON.parse(JSON.stringify(value));
    }
    return value ?? null;
  };
  return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
}

function formatValue(value: unknown) {
  if (value === null || typeof value === "undefined" || value === "") {
    return "—";
  }
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "—";
  }
  return String(value);
}

function formatHours(
  value: SerializedAdminResource["resource"]["hours"]
): string {
  if (!value) return "—";
  return Object.entries(value)
    .map(([day, hours]) =>
      hours ? `${day}: ${hours.open}-${hours.close}` : `${day}: —`
    )
    .join("; ");
}

function FieldDiff({
  label,
  current,
  proposed,
}: {
  label: string;
  current: string;
  proposed: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/60 p-3 text-xs">
      <div className="text-[11px] font-semibold uppercase text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 grid gap-2 text-foreground">
        <div>
          <p className="text-[11px] uppercase text-muted-foreground">Current</p>
          <p>{current}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase text-muted-foreground">
            Proposed
          </p>
          <p className="font-medium text-primary">{proposed}</p>
        </div>
      </div>
    </div>
  );
}
