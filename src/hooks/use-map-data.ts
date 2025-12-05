import { useState, useEffect } from "react";
import { addDays } from "date-fns";

// Type definitions for Map Pins
export type MapEventPin = {
    id: string;
    title: string;
    location: string;
    latitude: number;
    longitude: number;
    eventType: "potluck" | "volunteer";
    startTime: Date;
    rsvpCount: number;
    capacity: number | null;
    isVerified: boolean;
};

export type MapPostPin = {
    id: string;
    content: string;
    kind: "share" | "request" | "update" | "resource";
    location: string | null;
    latitude: number;
    longitude: number;
    createdAt: Date;
    urgency?: string | null;
    author: {
        name: string;
        image: string | null;
    };
};

// API Response Types
type EventApiResponseItem = {
    id: string;
    title: string;
    eventType: "potluck" | "volunteer";
    location: string;
    locationCoords: { lat: number; lng: number } | null;
    startTime: string;
    rsvpCount: number;
    capacity: number | null;
    isVerified: boolean;
};

type PostApiResponseItem = {
    id: string;
    content: string;
    kind: "share" | "request" | "update" | "resource";
    location: string | null;
    locationCoords: { lat: number; lng: number } | null;
    createdAt: string;
    urgency?: string | null;
    author: {
        name: string;
        image: string | null;
    };
};

/**
 * Hook to fetch events for the map based on filters.
 * Handles fetching, parsing, and error states.
 */
export function useMapEvents({
    eventTypeFilter,
    dateRangeFilter,
}: {
    eventTypeFilter: "all" | "potluck" | "volunteer";
    dateRangeFilter: "week" | "month";
}) {
    const [events, setEvents] = useState<MapEventPin[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();

        async function fetchEvents() {
            setIsLoading(true);
            const now = new Date();
            // Calculate end date based on filter
            const rangeEnd = addDays(now, dateRangeFilter === "week" ? 7 : 30);

            const searchParams = new URLSearchParams({
                limit: "50",
                status: "upcoming",
                onlyUpcoming: "true",
                onlyWithCoords: "true",
                startAfter: now.toISOString(),
                startBefore: rangeEnd.toISOString(),
            });

            if (eventTypeFilter !== "all") {
                searchParams.set("eventType", eventTypeFilter);
            }

            try {
                const response = await fetch(`/api/events?${searchParams.toString()}`, {
                    signal: controller.signal,
                    cache: "no-store",
                });
                if (!response.ok) {
                    throw new Error("Failed to load events");
                }
                const data = await response.json();
                if (Array.isArray(data?.items)) {
                    const mapped = (data.items as EventApiResponseItem[])
                        .map((item) => {
                            if (!item.locationCoords) return null;
                            return {
                                id: item.id,
                                title: item.title,
                                eventType: item.eventType,
                                location: item.location,
                                latitude: item.locationCoords.lat,
                                longitude: item.locationCoords.lng,
                                startTime: new Date(item.startTime),
                                rsvpCount: item.rsvpCount,
                                capacity: item.capacity,
                                isVerified: item.isVerified,
                            } satisfies MapEventPin;
                        })
                        .filter(Boolean) as MapEventPin[];
                    setEvents(mapped);
                } else {
                    setEvents([]);
                }
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    console.error("Failed to fetch events for map:", error);
                    setEvents([]);
                }
            } finally {
                setIsLoading(false);
            }
        }

        fetchEvents();

        return () => {
            controller.abort();
        };
    }, [eventTypeFilter, dateRangeFilter]);

    return { events, isLoading };
}

/**
 * Hook to fetch community posts for the map based on filters.
 * Handles fetching, parsing, and error states.
 */
export function useMapPosts({
    postKindFilter,
}: {
    postKindFilter: "all" | "share" | "request";
}) {
    const [posts, setPosts] = useState<MapPostPin[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();

        async function fetchPosts() {
            setIsLoading(true);
            const searchParams = new URLSearchParams({
                limit: "50",
                onlyWithCoords: "true",
                includeExpired: "false",
            });

            if (postKindFilter !== "all") {
                searchParams.set("kind", postKindFilter);
            }

            try {
                const response = await fetch(`/api/posts?${searchParams.toString()}`, {
                    signal: controller.signal,
                    cache: "no-store",
                });
                if (!response.ok) {
                    throw new Error("Failed to load posts");
                }
                const data = await response.json();
                if (Array.isArray(data?.items)) {
                    const mapped = (data.items as PostApiResponseItem[])
                        .map((item) => {
                            if (!item.locationCoords) return null;
                            return {
                                id: item.id,
                                content: item.content,
                                kind: item.kind,
                                location: item.location,
                                latitude: item.locationCoords.lat,
                                longitude: item.locationCoords.lng,
                                createdAt: new Date(item.createdAt),
                                urgency: item.urgency,
                                author: item.author,
                            } satisfies MapPostPin;
                        })
                        .filter(Boolean) as MapPostPin[];
                    setPosts(mapped);
                } else {
                    setPosts([]);
                }
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    console.error("Failed to fetch posts for map:", error);
                    setPosts([]);
                }
            } finally {
                setIsLoading(false);
            }
        }

        fetchPosts();

        return () => {
            controller.abort();
        };
    }, [postKindFilter]);

    return { posts, isLoading };
}
