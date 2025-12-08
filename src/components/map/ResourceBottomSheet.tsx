"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LocationCard } from "@/components/foodshare/location-card";
import { X, MapPin } from "lucide-react";
import { SidebarResourceDetail } from "./SidebarResourceDetail";
import type { EnrichedFoodBank } from "@/app/map/pageClient";

type ResourceBottomSheetProps = {
    resources: EnrichedFoodBank[];
    selectedResource: EnrichedFoodBank | null;
    onSelectResource: (id: string | null) => void;
    className?: string;
    isAdmin?: boolean;
};

export function ResourceBottomSheet({
    resources,
    selectedResource,
    onSelectResource,
    className,
    isAdmin,
}: ResourceBottomSheetProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-expand if a resource is selected
    useEffect(() => {
        if (selectedResource) {
            setIsExpanded(true);
        } else {
            setIsExpanded(false);
        }
    }, [selectedResource]);

    const toggleExpand = () => {
        // If selected, closing means deselecting
        if (selectedResource && isExpanded) {
            onSelectResource(null);
        } else {
            setIsExpanded(!isExpanded);
        }
    };

    return (
        <div
            className={cn(
                "fixed bottom-[4rem] left-0 right-0 z-20 flex flex-col bg-background shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out lg:hidden",
                isExpanded ? "h-[80vh] rounded-t-xl" : "h-auto rounded-t-xl",
                className
            )}
        >
            {/* Handle / Grabber for dragging (visual only for now) */}
            <div
                className="flex w-full cursor-pointer items-center justify-center border-b border-border/40 py-2 hover:bg-muted/50"
                onClick={toggleExpand}
            >
                <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
                {selectedResource ? (
                    /* Detailed View */
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Details</h3>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onSelectResource(null)}
                                className="h-8 w-8 rounded-full"
                            >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Close</span>
                            </Button>
                        </div>
                        <SidebarResourceDetail
                            foodBank={selectedResource}
                            distanceMiles={selectedResource.distanceMiles}
                            currentlyOpen={selectedResource.isOpen}
                            onBack={() => onSelectResource(null)}
                            isAdmin={isAdmin}
                        />
                    </div>
                ) : (
                    /* List View */
                    <>
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-muted-foreground">
                                {resources.length} Resources Nearby
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-xs text-primary"
                                onClick={() => setIsExpanded(!isExpanded)}
                            >
                                {isExpanded ? "Show Map" : "Expand List"}
                            </Button>
                        </div>

                        {/* Horizontal Scroll for Collapsed (Compact), Vertical for Expanded (Full) */}
                        <div className={cn(
                            "gap-3",
                            isExpanded ? "grid space-y-3" : "flex overflow-x-auto pb-4 px-2 snap-x"
                        )}>
                            {resources.map((bank) => (
                                <div
                                    key={bank.id}
                                    onClick={() => onSelectResource(bank.id)}
                                    className={cn(
                                        "cursor-pointer transition-all active:scale-[0.98]",
                                        isExpanded ? "w-full" : "min-w-[85vw] snap-center sm:min-w-[300px]"
                                    )}
                                >
                                    {isExpanded ? (
                                        <LocationCard
                                            location={bank}
                                            isOpen={bank.isOpen}
                                            distanceMiles={bank.distanceMiles ?? undefined}
                                            className="border-border/60 shadow-sm"
                                        />
                                    ) : (
                                        /* Compact Card Custom View */
                                        <div className="flex h-full flex-col justify-between rounded-xl border border-border/80 bg-card p-3 shadow-sm">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="space-y-1">
                                                    <h4 className="font-semibold leading-tight line-clamp-1 text-sm">{bank.name}</h4>
                                                    <p className="flex items-center text-xs text-muted-foreground line-clamp-1">
                                                        <MapPin className="mr-1 h-3 w-3 shrink-0" />
                                                        {bank.address}
                                                    </p>
                                                </div>
                                                {bank.distanceMiles !== null && bank.distanceMiles !== undefined && (
                                                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                                                        {bank.distanceMiles.toFixed(1)} mi
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-2 flex items-center justify-between">
                                                <div className="flex gap-1.5 items-center">
                                                    {bank.isOpen ? (
                                                        <span className="flex items-center text-xs font-medium text-green-600">
                                                            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-green-600" />
                                                            Open
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center text-xs font-medium text-muted-foreground">
                                                            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                                                            Closed
                                                        </span>
                                                    )}
                                                </div>
                                                {(bank.services && bank.services.length > 0) && (
                                                    <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                                                        {bank.services[0]} {bank.services.length > 1 ? `+${bank.services.length - 1}` : ""}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {resources.length === 0 && (
                                <div className="flex w-full flex-col items-center justify-center py-8 text-center text-muted-foreground px-4">
                                    <MapPin className="mb-2 h-8 w-8 opacity-20" />
                                    <p>No resources found in this area.</p>
                                    <p className="text-xs">Try zooming out or changing filters.</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
