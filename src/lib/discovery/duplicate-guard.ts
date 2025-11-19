/**
 * Discovery Duplicate Guard
 *
 * This module prevents re-importing existing resources by performing fuzzy matching
 * against the database. It uses Geolocation + Name Similarity to detect duplicates.
 */

import { db } from "../db";
import { foodBanks, tombstone } from "../schema";
import { sql } from "drizzle-orm";
import { type DiscoveryResult } from "./types";

const DUPLICATE_DISTANCE_METERS = 200; // Look for existing items within 200m
const NAME_SIMILARITY_THRESHOLD = 0.8; // 80% similarity

/**
 * Checks if a discovered resource is a duplicate or has been blacklisted (tombstoned).
 *
 * @param resource - The newly discovered resource
 * @returns True if it's a duplicate or blocked, False if it's safe to insert
 */
export async function isDuplicateOrBlocked(
  resource: DiscoveryResult
): Promise<{ isDuplicate: boolean; reason?: string }> {
  // 1. Check Tombstone (Blacklist)
  // We check if this specific address has been marked as "closed" or "invalid"
  const tombstones = await db
    .select()
    .from(tombstone)
    .where(sql`lower(${tombstone.address}) = lower(${resource.address})`)
    .limit(1);

  if (tombstones.length > 0) {
    return { isDuplicate: true, reason: `Tombstoned: ${tombstones[0].reason}` };
  }

  // 2. Geo-Spatial Check
  // Find existing food banks within X meters
  // Note: We assume the DB has PostGIS or we use the haversine formula if using plain lat/lng
  // Since we are using drizzle and potentially simple postgres, we'll use a bounding box or simple distance calculation
  // For simplicity and compatibility, we'll assume standard lat/lng columns and use SQL for distance
  // ST_DWithin is ideal if PostGIS is enabled. If not, we fallback to a rough box.
  // Assuming standard Postgres without PostGIS for the starter kit unless specified.
  // Actually, `seed-food-banks.ts` uses simple float lat/lng.
  // We will implement a "Haversine" style check in SQL or just fetch nearby and filter in JS for small datasets.
  // Given "local" context, let's do a rough lat/lng box query then refinement.

  const latBuffer = 0.005; // approx 500m
  const lngBuffer = 0.005;

  const nearbyCandidates = await db
    .select()
    .from(foodBanks)
    .where(
      sql`${foodBanks.latitude} BETWEEN ${resource.latitude - latBuffer} AND ${
        resource.latitude + latBuffer
      }
      AND ${foodBanks.longitude} BETWEEN ${resource.longitude - lngBuffer} AND ${
        resource.longitude + lngBuffer
      }`
    );

  for (const candidate of nearbyCandidates) {
    // 3. Refine Distance (Haversine)
    const distance = getDistanceFromLatLonInMeters(
      resource.latitude,
      resource.longitude,
      candidate.latitude,
      candidate.longitude
    );

    if (distance <= DUPLICATE_DISTANCE_METERS) {
      // 4. Name Similarity Check
      const similarity = getLevenshteinSimilarity(resource.name, candidate.name);
      if (similarity >= NAME_SIMILARITY_THRESHOLD) {
        return {
          isDuplicate: true,
          reason: `Duplicate of ${candidate.name} (${distance.toFixed(0)}m away)`,
        };
      }
    }
  }

  return { isDuplicate: false };
}

// --- Helpers ---

function getDistanceFromLatLonInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371e3; // metres
  const q1 = (lat1 * Math.PI) / 180;
  const q2 = (lat2 * Math.PI) / 180;
  const dq = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dq / 2) * Math.sin(dq / 2) +
    Math.cos(q1) * Math.cos(q2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function getLevenshteinSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const longerLength = longer.length;

  if (longerLength === 0) {
    return 1.0;
  }

  const editDistance = levenshteinDistance(longer, shorter);
  return (longerLength - editDistance) / longerLength;
}

function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue;
    }
  }
  return costs[s2.length];
}
