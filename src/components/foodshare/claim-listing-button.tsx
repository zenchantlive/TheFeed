"use client";

import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import { useAuthModal } from "@/components/auth/auth-modal-context";

interface ClaimListingButtonProps {
    className?: string;
}

export function ClaimListingButton({ className }: ClaimListingButtonProps) {
    const { openLogin } = useAuthModal();

    return (
        <Button
            variant="outline"
            className={className}
            size="sm"
            onClick={() => openLogin()}
        >
            <ShieldCheck className="mr-2 h-4 w-4" />
            Claim this Listing
        </Button>
    );
}
