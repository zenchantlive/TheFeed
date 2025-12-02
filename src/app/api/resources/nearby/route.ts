import { NextRequest, NextResponse } from "next/server";
import { getNormalizedResources } from "@/lib/resource-feed";
import { calculateDistance } from "@/lib/geolocation";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const latParam = searchParams.get("lat");
        const lngParam = searchParams.get("lng");
        const limitParam = searchParams.get("limit");

        if (!latParam || !lngParam) {
            return NextResponse.json(
                { error: "Missing lat or lng parameters" },
                { status: 400 }
            );
        }

        const userLat = parseFloat(latParam);
        const userLng = parseFloat(lngParam);
        const limit = limitParam ? parseInt(limitParam) : 3;

        if (isNaN(userLat) || isNaN(userLng)) {
            return NextResponse.json(
                { error: "Invalid lat or lng parameters" },
                { status: 400 }
            );
        }

        // Fetch resources (fetching a larger set to ensure we find the closest ones)
        // In a production app with PostGIS, we would do this at the DB level
        const resources = await getNormalizedResources({ limit: 500 });

        // Calculate distance and sort
        const resourcesWithDistance = resources.map((resource) => {
            const distance = calculateDistance(
                { lat: userLat, lng: userLng },
                { lat: resource.latitude, lng: resource.longitude }
            );
            return { ...resource, distanceMiles: distance };
        });

        const sortedResources = resourcesWithDistance
            .sort((a, b) => a.distanceMiles - b.distanceMiles)
            .slice(0, limit);

        return NextResponse.json({ items: sortedResources });
    } catch (error) {
        console.error("Error fetching nearby resources:", error);
        return NextResponse.json(
            { error: "Failed to fetch nearby resources" },
            { status: 500 }
        );
    }
}
