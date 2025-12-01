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
import { searchResourcesInArea, type ProgressUpdate, DiscoveryConfigError } from "@/lib/discovery/tavily-search";
import {
  checkDiscoveryEligibility,
  logDiscoveryStart,
  logDiscoveryComplete,
} from "@/lib/discovery/circuit-breaker";
import { isDuplicateOrBlocked } from "@/lib/discovery/duplicate-guard";
import { detectDuplicates } from "@/lib/discovery/duplicate-detector";
import { normalizeResource, isTrustedSource } from "@/lib/resource-normalizer";
import { calculateConfidence, shouldAutoApprove } from "@/lib/discovery/confidence-scoring";
import { withTimeout } from "@/lib/timeout";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

// Helper to geocode address using Mapbox (server-side token only)
async function geocodeAddress(address: string, city: string, state: string): Promise<{ latitude: number; longitude: number } | null> {
  const mapboxToken = process.env.MAPBOX_SERVER_TOKEN || process.env.MAPBOX_TOKEN;
  if (!mapboxToken) {
    console.warn("Mapbox server token missing. Skipping geocoding fallback.");
    return null;
  }

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
  state: z.string().min(2), // Allow full state names (e.g. "California")
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
  } catch {
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
    : await checkDiscoveryEligibility(locationHash);

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
      const sendUpdate = (
        data: { type: "progress" | "complete" | "error" } & Record<string, unknown>
      ) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
      };

      // Send immediate feedback to confirm connection
      sendUpdate({ type: "progress", stage: "init", message: "Connected to discovery engine..." });

      try {
        // Start Log
        const eventId = await logDiscoveryStart(locationHash, userId, { isTest });
        let newCount = 0;

        // Progress Callback
        const handleProgress = (update: ProgressUpdate) => {
          sendUpdate({ type: "progress", ...update });
        };

        // Execute Search with 10-minute timeout
        const results = await withTimeout(
          searchResourcesInArea(city, state, handleProgress),
          10 * 60 * 1000, // 10 minutes
          "Discovery scan timed out after 10 minutes"
        );

        // Processing
        sendUpdate({ type: "progress", stage: "saving", message: "Saving new resources..." });
        
        for (const result of results) {
          const normalized = normalizeResource({
            ...result,
            services: result.services ?? [],
            hours: result.hours ?? null,
            sourceUrl: result.sourceUrl ?? null,
          });

          // Geocode if missing coordinates (0,0)
          let lat = normalized.latitude;
          let lng = normalized.longitude;
          if (lat === 0 && lng === 0) {
            const coords = await geocodeAddress(normalized.address, normalized.city, normalized.state);
            if (coords) {
              lat = coords.latitude;
              lng = coords.longitude;
            }
          }

          const { isDuplicate, type, duplicateId } = await isDuplicateOrBlocked({
            ...normalized,
            latitude: lat,
            longitude: lng,
            // DiscoveryResult expects undefined, not null
            phone: normalized.phone ?? undefined,
            website: normalized.website ?? undefined,
            description: normalized.description ?? undefined,
            hours: normalized.hours ?? undefined,
            confidence: normalized.confidence ?? 0,
            sourceUrl: normalized.sourceUrl ?? "",
          });

          // Skip hard duplicates or blocked items
          if (isDuplicate && (type === "hard" || type === "blocked")) {
            continue;
          }

          // Enhanced duplicate detection with multi-factor scoring
          const duplicateMatches = await detectDuplicates({
            name: normalized.name,
            address: normalized.address,
            city: normalized.city,
            state: normalized.state,
            zipCode: normalized.zipCode,
            latitude: lat,
            longitude: lng,
            phone: normalized.phone ?? null,
            website: normalized.website ?? null,
          });

          const isPotentialDuplicate = duplicateMatches.some(d => d.confidence === "high");

          if (isPotentialDuplicate) {
            console.info(`Potential duplicate found for ${normalized.name}:`, {
              matches: duplicateMatches
                .filter(d => d.confidence === "high")
                .map(d => d.matchedResource?.name)
            });
          }

          // Calculate quantitative confidence score
          const { score: confidenceScore } = calculateConfidence({
            ...normalized,
            latitude: lat,
            longitude: lng,
            phone: normalized.phone ?? undefined,
            website: normalized.website ?? undefined,
            description: normalized.description ?? undefined,
            hours: normalized.hours ?? undefined,
            services: normalized.services ?? [],
            sourceUrl: normalized.sourceUrl ?? "",
            confidence: normalized.confidence ?? 0,
          }, {
            discoveryDate: new Date(),
            confirmingSources: [] // TODO: Track multi-source confirmation
          });

          const autoApprove = shouldAutoApprove(
            confidenceScore,
            normalized.sourceUrl ?? "",
            isPotentialDuplicate
          );

          await db.insert(foodBanks).values({
            name: normalized.name,
            address: normalized.address,
            city: normalized.city,
            state: normalized.state,
            zipCode: normalized.zipCode,
            latitude: lat,
            longitude: lng,
            phone: normalized.phone ?? undefined,
            website: normalized.website ?? undefined,
            description: normalized.description ?? undefined,
            services: normalized.services,
            hours: normalized.hours,
            verificationStatus: autoApprove ? "community_verified" : "unverified",
            communityVerifiedAt: autoApprove ? new Date() : null,
            importSource: importSource,
            autoDiscoveredAt: new Date(),
            confidenceScore: confidenceScore, // Use quantitative score instead of LLM "vibes"
            sourceUrl: normalized.sourceUrl ?? null,
            potentialDuplicates: duplicateMatches
              .filter(d => d.confidence !== "low")
              .map(d => d.matchedResource?.id)
              .filter((id): id is string => id !== undefined),
            aiSummary: isPotentialDuplicate && duplicateId ? `Potential duplicate of ${duplicateId}` : undefined,
          });
          newCount++;
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

        let message = "Discovery process failed.";
        if (error instanceof DiscoveryConfigError) {
          message = error.message;
        } else if (error instanceof Error && error.message.includes("timed out")) {
          message = "Scan timed out. Try a smaller area or contact support.";
        }

        sendUpdate({ type: "error", message });
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
