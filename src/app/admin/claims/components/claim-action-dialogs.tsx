"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, User, Building2, Calendar, FileText, ShieldCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Claim } from "../page-client";

interface ApproveClaimDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => Promise<void>;
    resourceName: string;
    userName: string;
    verificationInfo?: {
        jobTitle: string;
        workEmail?: string;
        workPhone: string;
        verificationMethod: string;
    };
}

export function ApproveClaimDialog({
    open,
    onOpenChange,
    onConfirm,
    resourceName,
    userName,
    verificationInfo,
}: ApproveClaimDialogProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () => {
        setLoading(true);
        setError(null);
        try {
            await onConfirm();
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to approve claim:", error);
            setError("Failed to approve claim. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Review Provider Claim</DialogTitle>
                    <DialogDescription>
                        Review the verification details before approving ownership for <strong>{resourceName}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4 text-sm">
                    <div className="rounded-md bg-muted p-3 space-y-2">
                        <div className="grid grid-cols-[100px_1fr] gap-2">
                            <span className="font-medium text-muted-foreground">Claimant:</span>
                            <span>{userName}</span>
                        </div>
                        {verificationInfo && (
                            <>
                                <div className="grid grid-cols-[100px_1fr] gap-2">
                                    <span className="font-medium text-muted-foreground">Job Title:</span>
                                    <span>{verificationInfo.jobTitle}</span>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] gap-2">
                                    <span className="font-medium text-muted-foreground">Work Phone:</span>
                                    <span>{verificationInfo.workPhone}</span>
                                </div>
                                {verificationInfo.workEmail && (
                                    <div className="grid grid-cols-[100px_1fr] gap-2">
                                        <span className="font-medium text-muted-foreground">Work Email:</span>
                                        <span>{verificationInfo.workEmail}</span>
                                    </div>
                                )}
                                <div className="grid grid-cols-[100px_1fr] gap-2">
                                    <span className="font-medium text-muted-foreground">Method:</span>
                                    <span className="capitalize">{verificationInfo.verificationMethod?.replace("_", " ")}</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                        <p><strong>Warning:</strong> Approving this claim will grant full edit access to the user.</p>
                    </div>
                    {error && (
                        <div className="text-sm text-red-500 font-medium">
                            {error}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} disabled={loading} className="bg-green-600 hover:bg-green-700">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Approve & Grant Access
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface RejectClaimDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (reason: string) => Promise<void>;
    resourceName: string;
}

export function RejectClaimDialog({
    open,
    onOpenChange,
    onConfirm,
    resourceName,
}: RejectClaimDialogProps) {
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () => {
        if (!reason.trim()) return;

        setLoading(true);
        setError(null);
        try {
            await onConfirm(reason);
            onOpenChange(false);
            setReason("");
        } catch (error) {
            console.error("Failed to reject claim:", error);
            setError("Failed to reject claim. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reject Provider Claim</DialogTitle>
                    <DialogDescription>
                        Please provide a reason for rejecting the claim for <strong>{resourceName}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-4">
                    <Label htmlFor="reason">Rejection Reason</Label>
                    <Textarea
                        id="reason"
                        placeholder="e.g., Unable to verify affiliation with organization..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                    {error && (
                        <div className="text-sm text-red-500 font-medium mt-2">
                            {error}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={loading || !reason.trim()}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Reject Claim
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface ViewClaimDetailsDialogProps {
    claim: Claim | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onApprove?: () => void;
    onReject?: () => void;
}

export function ViewClaimDetailsDialog({
    claim,
    open,
    onOpenChange,
    onApprove,
    onReject,
}: ViewClaimDetailsDialogProps) {
    if (!claim) return null;

    // Parse verification info from JSON
    const verificationInfo = claim.verificationInfo as {
        jobTitle?: string;
        workEmail?: string;
        workPhone?: string;
        verificationMethod?: string;
    } | null;

    const isPending = claim.status === "pending";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" />
                        Provider Claim Details
                    </DialogTitle>
                    <DialogDescription>
                        Review all information submitted by the provider
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Resource Information */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-semibold text-sm">Resource Information</h3>
                        </div>
                        <div className="rounded-md bg-muted p-4 space-y-2">
                            <div>
                                <p className="font-medium">{claim.resource.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {claim.resource.address}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {claim.resource.city}, {claim.resource.state}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Claimant Information */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-semibold text-sm">Claimant Information</h3>
                        </div>
                        <div className="rounded-md bg-muted p-4 space-y-2">
                            <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                                <span className="font-medium text-muted-foreground">Name:</span>
                                <span>{claim.claimer.name}</span>
                            </div>
                            <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                                <span className="font-medium text-muted-foreground">Email:</span>
                                <span>{claim.claimer.email}</span>
                            </div>
                            {verificationInfo?.jobTitle && (
                                <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                                    <span className="font-medium text-muted-foreground">Job Title:</span>
                                    <span>{verificationInfo.jobTitle}</span>
                                </div>
                            )}
                            {verificationInfo?.workPhone && (
                                <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                                    <span className="font-medium text-muted-foreground">Work Phone:</span>
                                    <span>{verificationInfo.workPhone}</span>
                                </div>
                            )}
                            {verificationInfo?.workEmail && (
                                <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                                    <span className="font-medium text-muted-foreground">Work Email:</span>
                                    <span>{verificationInfo.workEmail}</span>
                                </div>
                            )}
                            {verificationInfo?.verificationMethod && (
                                <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                                    <span className="font-medium text-muted-foreground">Verification Method:</span>
                                    <span className="capitalize">
                                        {verificationInfo.verificationMethod.replace(/_/g, " ")}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Claim Reason */}
                    {claim.claimReason && (
                        <>
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <h3 className="font-semibold text-sm">Claim Reason / Notes</h3>
                                </div>
                                <div className="rounded-md bg-muted p-4">
                                    <p className="text-sm whitespace-pre-wrap">{claim.claimReason}</p>
                                </div>
                            </div>
                            <Separator />
                        </>
                    )}

                    {/* Status and Timeline */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-semibold text-sm">Status & Timeline</h3>
                        </div>
                        <div className="rounded-md bg-muted p-4 space-y-2 text-sm">
                            <div className="grid grid-cols-[120px_1fr] gap-2">
                                <span className="font-medium text-muted-foreground">Status:</span>
                                <span>
                                    <StatusBadge status={claim.status} />
                                </span>
                            </div>
                            <div className="grid grid-cols-[120px_1fr] gap-2">
                                <span className="font-medium text-muted-foreground">Submitted:</span>
                                <span>{formatDistanceToNow(claim.createdAt, { addSuffix: true })}</span>
                            </div>
                            {claim.reviewedAt && (
                                <div className="grid grid-cols-[120px_1fr] gap-2">
                                    <span className="font-medium text-muted-foreground">Reviewed:</span>
                                    <span>{formatDistanceToNow(claim.reviewedAt, { addSuffix: true })}</span>
                                </div>
                            )}
                            {claim.reviewer && (
                                <div className="grid grid-cols-[120px_1fr] gap-2">
                                    <span className="font-medium text-muted-foreground">Reviewed By:</span>
                                    <span>{claim.reviewer.name}</span>
                                </div>
                            )}
                            {claim.reviewNotes && (
                                <div className="grid grid-cols-[120px_1fr] gap-2">
                                    <span className="font-medium text-muted-foreground">Review Notes:</span>
                                    <span className="text-xs">{claim.reviewNotes}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                    {isPending && onApprove && onReject && (
                        <>
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    onOpenChange(false);
                                    onReject();
                                }}
                            >
                                Reject
                            </Button>
                            <Button
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                    onOpenChange(false);
                                    onApprove();
                                }}
                            >
                                Approve
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
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
