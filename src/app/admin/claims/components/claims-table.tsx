"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Check, X, ExternalLink } from "lucide-react";
import { Claim } from "../page-client";
import { useState } from "react";
import { ApproveClaimDialog, RejectClaimDialog, ViewClaimDetailsDialog } from "./claim-action-dialogs";
import Link from "next/link";

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
  onApprove: (claimId: string) => Promise<void>;
  onReject: (claimId: string, reason: string) => Promise<void>;
}

export function ClaimsTable({
  claims,
  loading,
  pagination,
  onPageChange,
  onRefresh,
  onApprove,
  onReject,
}: ClaimsTableProps) {
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const handleRowClick = (claim: Claim) => {
    setSelectedClaim(claim);
    setShowDetailsDialog(true);
  };

  const handleApproveClick = (claim: Claim) => {
    setSelectedClaim(claim);
    setShowApproveDialog(true);
  };

  const handleRejectClick = (claim: Claim) => {
    setSelectedClaim(claim);
    setShowRejectDialog(true);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Resource</TableHead>
            <TableHead>Claimant</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
              </TableCell>
            </TableRow>
          ) : claims.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                No claims found.
              </TableCell>
            </TableRow>
          ) : (
            claims.map((claim) => (
              <TableRow
                key={claim.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleRowClick(claim)}
              >
                <TableCell>
                  <div className="flex flex-col">
                    <Link
                      href={`/map?resource=${claim.resourceId}`}
                      className="font-medium hover:underline"
                      target="_blank"
                    >
                      {claim.resource.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {claim.resource.address}, {claim.resource.city}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={claim.claimer.image || undefined} />
                      <AvatarFallback>{claim.claimer.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{claim.claimer.name}</span>
                      <span className="text-xs text-muted-foreground">{claim.claimer.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={claim.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(new Date(claim.createdAt), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    {claim.status === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleApproveClick(claim)}
                          title="Approve Claim"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRejectClick(claim)}
                          title="Reject Claim"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      asChild
                      title="View Resource"
                    >
                      <Link href={`/map?resource=${claim.resourceId}`} target="_blank">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination controls could go here */}

      {selectedClaim && (
        <>
          <ViewClaimDetailsDialog
            claim={selectedClaim}
            open={showDetailsDialog}
            onOpenChange={setShowDetailsDialog}
            onApprove={() => {
              setShowDetailsDialog(false);
              setShowApproveDialog(true);
            }}
            onReject={() => {
              setShowDetailsDialog(false);
              setShowRejectDialog(true);
            }}
          />
          <ApproveClaimDialog
            open={showApproveDialog}
            onOpenChange={setShowApproveDialog}
            onConfirm={() => onApprove(selectedClaim.id)}
            resourceName={selectedClaim.resource.name}
            userName={selectedClaim.claimer.name}
            verificationInfo={selectedClaim.verificationInfo || undefined}
          />
          <RejectClaimDialog
            open={showRejectDialog}
            onOpenChange={setShowRejectDialog}
            onConfirm={(reason) => onReject(selectedClaim.id, reason)}
            resourceName={selectedClaim.resource.name}
          />
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "approved":
      return <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    case "pending":
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
    case "withdrawn":
      return <Badge variant="outline">Withdrawn</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
