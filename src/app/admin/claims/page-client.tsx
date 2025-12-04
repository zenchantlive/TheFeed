"use client";

/**
 * Admin Provider Claims Page - Client Component
 * Manages claims table state, filtering, and data fetching
 */

import { useState, useEffect, useCallback } from "react";
import { ClaimsTable } from "./components/claims-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";

type ClaimStatus = "pending" | "approved" | "rejected" | "withdrawn" | "all";

export interface Claim {
  id: string;
  resourceId: string;
  userId: string;
  status: string;
  claimReason: string | null;
  verificationInfo: {
    jobTitle: string;
    workEmail?: string;
    workPhone: string;
    verificationMethod: string;
  } | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  resource: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
  };
  claimer: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  reviewer: {
    id: string;
    name: string;
  } | null;
}

interface ClaimsResponse {
  claims: Claim[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function ClaimsPageClient() {
  const [activeTab, setActiveTab] = useState<ClaimStatus>("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: activeTab,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/admin/claims?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch claims");
      }

      const data: ClaimsResponse = await response.json();
      // Ensure dates are parsed correctly
      const parsedClaims = data.claims.map(claim => ({
        ...claim,
        createdAt: new Date(claim.createdAt),
        updatedAt: new Date(claim.updatedAt),
        reviewedAt: claim.reviewedAt ? new Date(claim.reviewedAt) : null
      }));

      setClaims(parsedClaims);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching claims:", error);
      // Silently fail or show error in UI state if needed
    } finally {
      setLoading(false);
    }
  }, [activeTab, pagination.page, pagination.limit, searchTerm]);

  // Fetch claims whenever tab or search changes
  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleApprove = async (claimId: string) => {
    try {
      const response = await fetch(`/api/admin/claims/${claimId}/approve`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to approve claim");

      toast.success("Claim approved successfully");
      fetchClaims();
    } catch (error) {
      console.error("Error approving claim:", error);
      toast.error("Failed to approve claim");
    }
  };

  const handleReject = async (claimId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/claims/${claimId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) throw new Error("Failed to reject claim");

      toast.success("Claim rejected successfully");
      fetchClaims();
    } catch (error) {
      console.error("Error rejecting claim:", error);
      toast.error("Failed to reject claim");
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabs for status filtering */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ClaimStatus)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          {/* Search input */}
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by resource or user..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table content for all tabs */}
        <TabsContent value={activeTab} className="space-y-4">
          <ClaimsTable
            claims={claims}
            loading={loading}
            pagination={pagination}
            onPageChange={(page) => setPagination({ ...pagination, page })}
            onRefresh={fetchClaims}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
