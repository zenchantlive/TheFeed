"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

interface ClaimResourceDialogProps {
    resourceId: string;
    resourceName: string;
    trigger?: React.ReactNode;
}

export function ClaimResourceDialog({
    resourceId,
    resourceName,
    trigger,
}: ClaimResourceDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    // Form State
    const [jobTitle, setJobTitle] = useState("");
    const [workEmail, setWorkEmail] = useState("");
    const [workPhone, setWorkPhone] = useState("");
    const [verificationMethod, setVerificationMethod] = useState("phone_call");
    const [reason, setReason] = useState("");

    const handleSubmit = async () => {
        // Basic Validation
        if (!jobTitle.trim()) {
            setError("Job Title is required.");
            return;
        }
        if (!workPhone.trim() || workPhone.length < 10) {
            setError("Please provide a valid work phone number.");
            return;
        }
        if (reason.length < 10) {
            setError("Please provide a more detailed reason (at least 10 characters).");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/claims", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    resourceId,
                    claimReason: reason,
                    verificationInfo: {
                        jobTitle,
                        workEmail,
                        workPhone,
                        verificationMethod,
                    },
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to submit claim");
            }

            setOpen(false);
            alert("Claim submitted successfully! An admin will review your request.");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="w-full justify-start" size="sm">
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Claim this Listing
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Claim {resourceName}</DialogTitle>
                    <DialogDescription>
                        To verify your identity as a representative of this organization, please provide the following details.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="jobTitle">Job Title <span className="text-red-500">*</span></Label>
                            <Input
                                id="jobTitle"
                                placeholder="e.g. Program Director"
                                value={jobTitle}
                                onChange={(e) => setJobTitle(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="workPhone">Work Phone <span className="text-red-500">*</span></Label>
                            <Input
                                id="workPhone"
                                placeholder="(555) 123-4567"
                                value={workPhone}
                                onChange={(e) => setWorkPhone(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="workEmail">Work Email (Optional)</Label>
                        <Input
                            id="workEmail"
                            type="email"
                            placeholder="name@organization.org"
                            value={workEmail}
                            onChange={(e) => setWorkEmail(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="method">Preferred Verification Method</Label>
                        <Select value={verificationMethod} onValueChange={setVerificationMethod}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="phone_call">Phone Call to Organization</SelectItem>
                                <SelectItem value="email_domain">Work Email Domain Check</SelectItem>
                                <SelectItem value="website_access">Website Access Verification</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="reason">Additional Notes / Reason <span className="text-red-500">*</span></Label>
                        <Textarea
                            id="reason"
                            placeholder="Please explain your role and why you are claiming this listing..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="min-h-[80px]"
                        />
                    </div>

                    {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Claim
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
