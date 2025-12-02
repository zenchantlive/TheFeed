"use client";

/**
 * Claims Table Component
 * Displays provider claims with sorting, pagination, and actions
 */

import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Claim {
  id: string;
  resourceId: string;
  userId: string;
  status: string;
  claimReason: string | null;
  verificationInfo: string | null;
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

interface ClaimsTableProps {
  claims: Claim[];
  loading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "pending":
      return "secondary";
    case "approved":
      return "default";
    case "rejected":
      return "destructive";
    case "withdrawn":
      return "outline";
    default:
      return "secondary";
  }
}

export function ClaimsTable({
  claims,
  loading,
  pagination,
  onPageChange,
  onRefresh,
}: ClaimsTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-muted-foreground">Loading claims...</div>
      </div>
    );
  }

  if (claims.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          No claims found
        </p>
        <p className="text-sm text-muted-foreground">
          Claims will appear here when providers submit them
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Resource</TableHead>
              <TableHead>Claimed By</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claims.map((claim) => (
              <TableRow key={claim.id}>
                {/* Resource */}
                <TableCell>
                  <div className="flex flex-col">
                    <Link
                      href={`/resources/${claim.resource.id}`}
                      className="font-medium hover:underline"
                    >
                      {claim.resource.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {claim.resource.city}, {claim.resource.state}
                    </div>
                  </div>
                </TableCell>

                {/* Claimed By */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={claim.claimer.image || undefined} />
                      <AvatarFallback>
                        {claim.claimer.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <div className="text-sm font-medium">
                        {claim.claimer.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {claim.claimer.email}
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Claim Reason */}
                <TableCell className="max-w-xs">
                  <div className="truncate text-sm text-muted-foreground">
                    {claim.claimReason || "No reason provided"}
                  </div>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(claim.status)}>
                    {claim.status}
                  </Badge>
                </TableCell>

                {/* Submitted Date */}
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(claim.createdAt), {
                    addSuffix: true,
                  })}
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/claims/${claim.id}`}>
                      Review
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} claims
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
