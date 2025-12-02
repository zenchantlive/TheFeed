/**
 * Verification Badge Component
 *
 * Visual indicator showing the public verification status of a resource.
 * Used in LocationCard and LocationPopup to build user trust.
 *
 * Statuses:
 * - official (Verified): Green check, high trust
 * - community_verified (Community): Blue/Purple, medium trust
 * - unverified (Unverified): Gray/Yellow, low trust
 * - rejected/duplicate: Red, warning
 */

"use client";

import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle2, AlertCircle, Users, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type VerificationStatus =
    | "official"
    | "community_verified"
    | "unverified"
    | "rejected"
    | "duplicate";

interface VerificationBadgeProps {
    /** Current verification status of the resource */
    status: string; // Using string to be safe, but conceptually VerificationStatus

    /** Date when the resource was last verified (optional) */
    lastVerified?: Date | string | null;

    /** Size variant */
    size?: "sm" | "md" | "lg";

    /** Custom class name */
    className?: string;
}

/**
 * Get configuration for each status (colors, icon, label)
 */
function getStatusConfig(status: string) {
    switch (status) {
        case "official":
            return {
                bg: "bg-green-500/15 hover:bg-green-500/25 border-green-500/20",
                text: "text-green-700 dark:text-green-400",
                icon: CheckCircle2,
                label: "Verified",
                description: "Verified by our team",
            };
        case "community_verified":
            return {
                bg: "bg-blue-500/15 hover:bg-blue-500/25 border-blue-500/20",
                text: "text-blue-700 dark:text-blue-400",
                icon: Users,
                label: "Community Verified",
                description: "Verified by community members",
            };
        case "rejected":
        case "duplicate":
            return {
                bg: "bg-red-500/15 hover:bg-red-500/25 border-red-500/20",
                text: "text-red-700 dark:text-red-400",
                icon: AlertCircle,
                label: "Flagged",
                description: "This resource has been flagged",
            };
        case "unverified":
        default:
            return {
                bg: "bg-yellow-500/15 hover:bg-yellow-500/25 border-yellow-500/20",
                text: "text-yellow-700 dark:text-yellow-400",
                icon: HelpCircle,
                label: "Unverified",
                description: "Not yet verified",
            };
    }
}

/**
 * Get size classes for badge
 */
function getSizeClasses(size: "sm" | "md" | "lg"): string {
    switch (size) {
        case "sm":
            return "text-[10px] px-1.5 py-0.5 h-5";
        case "md":
            return "text-xs px-2.5 py-0.5 h-6";
        case "lg":
            return "text-sm px-3 py-1 h-7";
    }
}

export function VerificationBadge({
    status,
    lastVerified,
    size = "md",
    className,
}: VerificationBadgeProps) {
    const config = getStatusConfig(status);
    const Icon = config.icon;

    // Format date if available
    const dateStr = lastVerified
        ? new Date(lastVerified).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
        : null;

    const badgeContent = (
        <Badge
            variant="outline"
            className={cn(
                "gap-1.5 font-medium transition-colors cursor-default",
                config.bg,
                config.text,
                getSizeClasses(size),
                className
            )}
        >
            <Icon className={cn("shrink-0", size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5")} />
            <span>{config.label}</span>
        </Badge>
    );

    // If unverified, maybe don't show tooltip or show simple one
    // For verified, show date
    return (
        <TooltipProvider>
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
                <TooltipContent className="text-xs max-w-[200px]">
                    <p className="font-semibold">{config.description}</p>
                    {dateStr && (
                        <p className="text-muted-foreground mt-1">On {dateStr}</p>
                    )}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
