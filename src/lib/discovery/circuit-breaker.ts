/**
 * Discovery Circuit Breaker
 *
 * This module prevents "The Desert Problem" (infinite searching in barren areas)
 * and saves API costs by enforcing a cooldown period between searches.
 */

import { db } from "../db";
import { discoveryEvents } from "../schema";
import { eq, and, gt, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

const DISCOVERY_COOLDOWN_DAYS = 30;

/**
 * Checks if we should trigger a discovery run for a given location.
 *
 * @param locationHash - Unique identifier for the area (e.g. "sacramento-ca")
 * @param userId - The ID of the user triggering this check (for logging)
 * @returns Object indicating if we should proceed and the event ID if created
 */
export async function checkDiscoveryEligibility(
  locationHash: string,
  userId?: string
): Promise<{ shouldSearch: boolean; eventId?: string; reason?: string }> {
  // Calculate the cutoff date
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - DISCOVERY_COOLDOWN_DAYS);

  // Query for recent successful or in-progress searches
  const recentEvents = await db
    .select()
    .from(discoveryEvents)
    .where(
      and(
        eq(discoveryEvents.locationHash, locationHash),
        gt(discoveryEvents.searchedAt, cutoffDate)
      )
    )
    .orderBy(desc(discoveryEvents.searchedAt))
    .limit(1);

  if (recentEvents.length > 0) {
    const lastEvent = recentEvents[0];
    return {
      shouldSearch: false,
      reason: `Recently searched on ${lastEvent.searchedAt.toISOString()}. Status: ${
        lastEvent.status
      }`,
    };
  }

  // If no recent search, we are eligible.
  // We DO NOT create the event here; we assume the caller will create it
  // when they actually start the Tavily process, to avoid "ghost" events if the API fails immediately.
  return { shouldSearch: true };
}

/**
 * Logs the start of a discovery run.
 */
export async function logDiscoveryStart(
  locationHash: string,
  userId?: string,
  metadata: Record<string, any> = {}
): Promise<string> {
  const id = randomUUID();
  await db.insert(discoveryEvents).values({
    id,
    locationHash,
    status: "in_progress",
    provider: "tavily",
    triggeredByUserId: userId,
    metadata: { version: "1.0", ...metadata },
    searchedAt: new Date(),
  });
  return id;
}

/**
 * Updates the discovery event with final results.
 */
export async function logDiscoveryComplete(
  eventId: string,
  status: "completed" | "failed" | "no_results",
  resourcesFound: number
) {
  await db
    .update(discoveryEvents)
    .set({
      status,
      resourcesFound,
    })
    .where(eq(discoveryEvents.id, eventId));
}
