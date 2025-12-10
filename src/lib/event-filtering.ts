import { calculateDistance, type Coordinates } from "./geolocation";
import type { Event } from "./schema";

export type EventWithLocation = Pick<Event, "locationCoords">;

/**
 * Filter events to only those within a certain radius of a center point.
 * Events without coordinates are excluded.
 */
export function filterEventsByRadius<T extends EventWithLocation>(
    events: T[],
    center: Coordinates,
    radiusMiles: number
): T[] {
    return events.filter((event) => {
        // If event has no coords, we can't determine distance.
        // Requirement: "only show the events within a small radius".
        // So we assume events without coords shouldn't be shown if filtering is active?
        // Or maybe they are "virtual"?
        // The type definition says locationCoords can be null.
        // If null, we exclude it for now as per strict radius interpretation.
        if (!event.locationCoords) {
            return false;
        }

        const eventCoords: Coordinates = {
            lat: event.locationCoords.lat,
            lng: event.locationCoords.lng
        };

        const distance = calculateDistance(center, eventCoords);
        return distance <= radiusMiles;
    });
}
