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
import { Loader2 } from "lucide-react";

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

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to approve claim:", error);
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

    const handleConfirm = async () => {
        if (!reason.trim()) return;

        setLoading(true);
        try {
            await onConfirm(reason);
            onOpenChange(false);
            setReason("");
        } catch (error) {
            console.error("Failed to reject claim:", error);
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
