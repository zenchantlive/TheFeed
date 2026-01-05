import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Map as MapIcon, ShieldCheck } from "lucide-react";
import { VerificationBadge } from "./verification-badge";
import { formatHoursForDisplay } from "@/lib/geolocation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

type CompactResourceCardProps = {
    resource: {
        id: string;
        name: string;
        address: string;
        city: string;
        state: string;
        zipCode: string;
        hours?: Record<string, { open: string; close: string; closed?: boolean }> | null;
        verificationStatus?: string | null;
        lastVerified?: Date | string | null;
        dataCompleteness?: number;
        claimedBy?: string | null;
    };
    distanceMiles?: number;
    className?: string;
};

export function CompactResourceCard({
    resource,
    distanceMiles,
    className,
}: CompactResourceCardProps) {
    const completeness = resource.dataCompleteness || 0;
    const isClaimed = !!resource.claimedBy;

    return (
        <Card className={cn("group relative overflow-hidden rounded-xl border border-border/60 transition-all hover:border-primary/50 hover:shadow-md", className)}>
            {/* Clickable Overlay for Main Resource Page */}
            <Link href={`/resources/${resource.id}`} className="absolute inset-0 z-10">
                <span className="sr-only">View details for {resource.name}</span>
            </Link>

            <CardContent className="p-4">
                {/* Top Row: Completeness & Distance */}
                <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-primary">{completeness}% complete</span>
                        <Progress value={completeness} className="h-1.5 w-16" />
                    </div>
                    {typeof distanceMiles === "number" && (
                        <span className="font-medium uppercase tracking-wide">
                            {distanceMiles.toFixed(1)} mi
                        </span>
                    )}
                </div>

                {/* Header: Name & Map Icon */}
                <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold leading-tight text-foreground group-hover:text-primary transition-colors">
                                {resource.name}
                            </h3>
                            {isClaimed && (
                                <Badge variant="outline" className="h-5 px-1.5 text-[10px] border-blue-200 bg-blue-50 text-blue-700">
                                    <ShieldCheck className="mr-1 h-3 w-3" />
                                    Claimed
                                </Badge>
                            )}
                        </div>
                        {resource.verificationStatus && (
                            <div className="mt-1">
                                <VerificationBadge
                                    status={resource.verificationStatus}
                                    lastVerified={resource.lastVerified}
                                    size="sm"
                                />
                            </div>
                        )}
                    </div>
                    {/* Map Button - Z-index higher to be clickable over the card link */}
                    <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="relative z-20 h-8 w-8 shrink-0 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    >
                        <Link href={`/map?resource=${resource.id}`} title="View on Map">
                            <MapIcon className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>

                {/* Details: Address & Hours */}
                <div className="space-y-1.5 text-sm text-muted-foreground">
                    <p className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span className="line-clamp-1">
                            {resource.address}, {resource.city}
                        </span>
                    </p>
                    <p className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span suppressHydrationWarning>
                            {formatHoursForDisplay(resource.hours?.[
                                new Date().toLocaleDateString("en-US", { weekday: "long" })
                            ])}
                        </span>
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
