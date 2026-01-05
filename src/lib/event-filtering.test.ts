import { filterEventsByRadius, type EventWithLocation } from "./event-filtering";
import { describe, expect, it } from "bun:test";

describe("filterEventsByRadius", () => {
    const center = { lat: 38.5816, lng: -121.4944 }; // Sacramento Capitol

    const eventAccrossStreet: EventWithLocation = {
        locationCoords: { lat: 38.5819, lng: -121.4944 }, // Very close
    };

    const eventInRoseville: EventWithLocation = {
        locationCoords: { lat: 38.7521, lng: -121.2880 }, // ~16 miles away
    };

    const eventInSF: EventWithLocation = {
        locationCoords: { lat: 37.7749, lng: -122.4194 }, // ~75 miles away
    };

    const eventNoCoords: EventWithLocation = {
        locationCoords: null, // Should be filtered out
    };

    it("should include events within the radius", () => {
        const events = [eventAccrossStreet, eventInRoseville, eventInSF];
        // 20 mile radius should include Roseville but not SF
        const filtered = filterEventsByRadius(events, center, 20);
        expect(filtered).toContain(eventAccrossStreet);
        expect(filtered).toContain(eventInRoseville);
        expect(filtered).not.toContain(eventInSF);
    });

    it("should exclude events outside the radius", () => {
        const events = [eventAccrossStreet, eventInRoseville];
        // 5 mile radius should exclude Roseville
        const filtered = filterEventsByRadius(events, center, 5);
        expect(filtered).toContain(eventAccrossStreet);
        expect(filtered).not.toContain(eventInRoseville);
    });

    it("should exclude events without coordinates", () => {
        const events = [eventAccrossStreet, eventNoCoords];
        const filtered = filterEventsByRadius(events, center, 10);
        expect(filtered).toContain(eventAccrossStreet);
        expect(filtered).not.toContain(eventNoCoords);
    });
});
