/**
 * Discovery Trigger API (Streaming)
 *
 * This endpoint initiates the "Just-in-Time" discovery process.
 * It streams progress updates to the client as it processes batches.
 */

import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth-middleware"; // Use validateSession instead of withAuth for streaming
import { db } from "@/lib/db";
import { foodBanks } from "@/lib/schema";
import { searchResourcesInArea, type ProgressUpdate } from "@/lib/discovery/tavily-search";
import {
  checkDiscoveryEligibility,
  logDiscoveryStart,
  logDiscoveryComplete,
} from "@/lib/discovery/circuit-breaker";
import { isDuplicateOrBlocked } from "@/lib/discovery/duplicate-guard";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

// Helper to geocode address using Mapbox
async function geocodeAddress(address: string, city: string, state: string): Promise<{ latitude: number; longitude: number } | null> {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!mapboxToken) return null;

  const query = `${address}, ${city}, ${state}`;
  const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&limit=1`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) return null;
    const data = await res.json();
    
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { latitude: lat, longitude: lng };
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }
  return null;
}

// Validation schema for the request body
const triggerSchema = z.object({
  city: z.string().min(1),
  state: z.string().length(2),
  force: z.boolean().optional(),
  isTest: z.boolean().optional(),
});

export const POST = async (req: NextRequest) => {
  // 1. Auth Check (Manual because we need to return a stream)
  const session = await validateSession(req);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId } = session;

  // 2. Parse Body
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validation = triggerSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid location data", details: validation.error },
      { status: 400 }
    );
  }

  const { city, state, force, isTest } = validation.data;
  const locationHash = `${city.toLowerCase().trim()}-${state.toLowerCase().trim()}`;
  const isAdmin = process.env.ADMIN_USER_ID === userId;
  const shouldForce = force && isAdmin;
  const importSource = isTest ? "tavily_test_run" : "tavily";

  // 3. Circuit Breaker Check
  const eligibility = shouldForce
    ? { shouldSearch: true }
    : await checkDiscoveryEligibility(locationHash, userId);

  if (!eligibility.shouldSearch) {
    return NextResponse.json({
      status: "cached",
      message: "Discovery recently run for this area. Cooldown active.",
      reason: eligibility.reason,
      resourcesFound: 0,
    });
  }

  // 4. Create Stream
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = (data: any) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
      };

      try {
        // Start Log
        const eventId = await logDiscoveryStart(locationHash, userId, { isTest });
        let newCount = 0;

        // Progress Callback
        const handleProgress = (update: ProgressUpdate) => {
          sendUpdate({ type: "progress", ...update });
        };

        // Execute Search
        const results = await searchResourcesInArea(city, state, handleProgress);

        // Processing
        sendUpdate({ type: "progress", stage: "saving", message: "Saving new resources..." });
        
        for (const result of results) {
          const { isDuplicate } = await isDuplicateOrBlocked(result);
          if (!isDuplicate) {
            let lat = result.latitude;
            let lng = result.longitude;

            // Geocode if missing coordinates (0,0)
            if (lat === 0 && lng === 0) {
              const coords = await geocodeAddress(result.address, result.city, result.state);
              if (coords) {
                lat = coords.latitude;
                lng = coords.longitude;
              }
            }

            await db.insert(foodBanks).values({
              name: result.name,
              address: result.address,
              city: result.city,
              state: result.state,
              zipCode: result.zipCode,
              latitude: lat,
              longitude: lng,
              phone: result.phone,
              website: result.website,
              description: result.description,
              services: result.services,
              hours: result.hours,
              verificationStatus: "unverified",
              importSource: importSource,
              autoDiscoveredAt: new Date(),
            });
            newCount++;
          }
        }

        // Log Success
        await logDiscoveryComplete(eventId, "completed", newCount);

        // Fetch Samples
        const samples = await db
          .select()
          .from(foodBanks)
          .where(
            and(
              eq(foodBanks.city, city),
              eq(foodBanks.verificationStatus, "unverified")
            )
          )
          .orderBy(desc(foodBanks.createdAt))
          .limit(5);

        // Final Response
        sendUpdate({
          type: "complete",
          status: "completed",
          message: `Discovery successful. Added ${newCount} new resources.`,
          resourcesFound: newCount,
          samples,
        });

        controller.close();
      } catch (error) {
        console.error("Discovery stream failed:", error);
        sendUpdate({ type: "error", message: "Discovery process failed." });
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Transfer-Encoding": "chunked",
    },
  });
};
