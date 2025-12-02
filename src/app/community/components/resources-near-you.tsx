"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CompactResourceCard } from "@/components/foodshare/compact-resource-card";
import { ArrowRight, MapPin } from "lucide-react";
import type { NormalizedResourceWithMeta } from "@/lib/resource-feed";

interface ResourcesNearYouProps {
    userCoords: { lat: number; lng: number } | null;
}

type NearbyResource = NormalizedResourceWithMeta & {
    distanceMiles: number;
};

export function ResourcesNearYou({ userCoords }: ResourcesNearYouProps) {
    const [resources, setResources] = useState<NearbyResource[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userCoords) return;

        const fetchResources = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch(
                    `/api/resources/nearby?lat=${userCoords.lat}&lng=${userCoords.lng}&limit=3`
                );
                if (!res.ok) throw new Error("Failed to fetch resources");
                const data = await res.json();
                setResources(data.items);
            } catch (err) {
                console.error(err);
                setError("Could not load nearby resources");
            } finally {
                setIsLoading(false);
            }
        };

        fetchResources();
    }, [userCoords]);

    if (!userCoords) {
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Resources near you
                    </h2>
                </div>
                <div className="rounded-xl border border-border/60 bg-card p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                        Share your location to find food banks and pantries nearby.
                    </p>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/map">View Map</Link>
                    </Button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="space-y-4 rounded-xl border border-border/60 bg-card p-4">
                <div className="h-6 w-48 animate-pulse rounded bg-muted"></div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 w-full animate-pulse rounded-lg bg-muted/50"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) return null;

    if (resources.length === 0) {
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Resources near you
                    </h2>
                </div>
                <div className="rounded-xl border border-border/60 bg-card p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        No resources found nearby.
                    </p>
                    <Button variant="link" size="sm" asChild className="mt-2">
                        <Link href="/map">View Map</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Resources near you
                </h2>
                <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground">
                    <Link href="/map">
                        View all on map <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {resources.map((resource) => (
                    <CompactResourceCard
                        key={resource.id}
                        resource={resource}
                        distanceMiles={resource.distanceMiles}
                        className="h-full"
                    />
                ))}
            </div>

            <div className="text-center md:hidden">
                <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/map">
                        Show more resources
                    </Link>
                </Button>
            </div>
        </div>
    );
}
