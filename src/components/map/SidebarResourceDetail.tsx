"use client";

import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { LocationCard } from "@/components/foodshare/location-card";
import type { HoursType } from "@/lib/schema";
import { ArrowLeft, Bookmark, BookmarkCheck, ExternalLink } from "lucide-react";
import { useSavedLocation } from "@/hooks/use-saved-locations";
import type { Source } from "@/components/foodshare/sources-section";
import Link from "next/link";

export type SidebarResourceDetailProps = {
    foodBank: {
        id: string;
        name: string;
        address: string;
        city: string;
        state: string;
        zipCode: string;
        phone: string | null;
        website: string | null;
        description: string | null;
        services: string[] | null;
        hours: HoursType | null;
        verificationStatus?: string;
        lastVerified?: Date | string | null;
        sources?: Source[];
    };
    distanceMiles?: number | null;
    currentlyOpen?: boolean;
    onBack: () => void;
    isAdmin?: boolean;
};

export function SidebarResourceDetail({
    foodBank,
    distanceMiles,
    currentlyOpen,
    onBack,
    isAdmin,
}: SidebarResourceDetailProps) {
    const {
        isSaved,
        isLoading,
        toggleSave,
        checkSaved,
        isSignedIn,
    } = useSavedLocation(foodBank.id);

    useEffect(() => {
        if (isSignedIn) {
            checkSaved();
        }
    }, [foodBank.id, checkSaved, isSignedIn]);

    const handleToggleSave = async () => {
        const result = await toggleSave();
        if (!result.success && result.error) {
            alert(result.error);
        }
    };

    const handleMarkDuplicate = async () => {
        if (!confirm("Are you sure you want to mark this as a duplicate?")) return;
        try {
            const res = await fetch("/api/admin/resources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: [foodBank.id], status: "duplicate" }),
            });
            if (!res.ok) throw new Error("Failed");
            onBack();
            window.location.reload();
        } catch {
            alert("Failed to mark as duplicate");
        }
    };

    const handleImprove = () => {
        alert("Thank you for your interest! Community editing features are coming soon.");
    };

    const directionsUrl = useMemo(() => {
        const destination = encodeURIComponent(
            `${foodBank.address}, ${foodBank.city}, ${foodBank.state} ${foodBank.zipCode}`
        );
        return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    }, [foodBank.address, foodBank.city, foodBank.state, foodBank.zipCode]);

    return (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
            <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="self-start -ml-2 text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to results
            </Button>

            <LocationCard
                location={foodBank}
                distanceMiles={typeof distanceMiles === "number" ? distanceMiles : undefined}
                isOpen={Boolean(currentlyOpen)}
                onImprove={handleImprove}
                className="border-0 shadow-none p-0"
                actionSlot={
                    <div className="grid gap-2">
                        <div className="grid grid-cols-2 gap-2">
                            {isSignedIn && (
                                <Button
                                    onClick={handleToggleSave}
                                    disabled={isLoading}
                                    variant={isSaved ? "default" : "outline"}
                                    className="w-full"
                                >
                                    {isSaved ? (
                                        <>
                                            <BookmarkCheck className="mr-2 h-4 w-4" />
                                            Saved
                                        </>
                                    ) : (
                                        <>
                                            <Bookmark className="mr-2 h-4 w-4" />
                                            Save
                                        </>
                                    )}
                                </Button>
                            )}
                            <Button asChild variant="outline" className="w-full">
                                <a href={directionsUrl} target="_blank" rel="noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Directions
                                </a>
                            </Button>
                        </div>

                        <Button asChild variant="secondary" className="w-full">
                            <Link href={`/resources/${foodBank.id}`}>
                                View Full Details
                            </Link>
                        </Button>

                        {isAdmin && (
                            <Button
                                onClick={handleMarkDuplicate}
                                variant="destructive"
                                className="w-full"
                                size="sm"
                            >
                                Mark Duplicate (Admin)
                            </Button>
                        )}
                    </div>
                }
            />
        </div>
    );
}
