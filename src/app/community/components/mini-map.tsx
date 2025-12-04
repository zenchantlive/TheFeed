"use client";

import { useEffect, useState } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const MAPBOX_STYLE = "mapbox://styles/mapbox/streets-v12";

type MiniMapProps = {
    userCoords: { lat: number; lng: number } | null;
    className?: string;
};

export function MiniMap({ userCoords, className }: MiniMapProps) {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const [viewState, setViewState] = useState({
        latitude: 40.7128, // Default to NYC
        longitude: -74.0060,
        zoom: 13,
    });

    useEffect(() => {
        if (userCoords) {
            setViewState(prev => ({
                ...prev,
                latitude: userCoords.lat,
                longitude: userCoords.lng,
            }));
        }
    }, [userCoords]);

    if (!mounted || !mapboxToken || !userCoords) {
        return (
            <div className={cn("flex items-center justify-center bg-muted/30 text-xs text-muted-foreground", className)}>
                {!mapboxToken ? "Map unavailable" : "Loading map..."}
            </div>
        );
    }

    return (
        <div className={cn("relative overflow-hidden rounded-lg", className)}>
            <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                mapStyle={MAPBOX_STYLE}
                mapboxAccessToken={mapboxToken}
                attributionControl={false}
                dragRotate={false}
                reuseMaps
            >
                {userCoords && (
                    <Marker latitude={userCoords.lat} longitude={userCoords.lng} anchor="center">
                        <span className="flex h-3 w-3 items-center justify-center rounded-full border-2 border-white bg-primary shadow">
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        </span>
                    </Marker>
                )}
            </Map>
            {/* Overlay to prevent interaction but allow clicking through to the full map link if we wrapped it */}
            <div className="absolute inset-0 z-10 bg-transparent" />
        </div>
    );
}
