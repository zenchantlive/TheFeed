/**
 * Enhanced Duplicate Detection
 *
 * Multi-strategy duplicate detection with scoring.
 * Catches duplicates through exact address matching and geo-spatial + name similarity.
 *
 * Optimized for PostGIS (Phase 4.1).
 */

import { db } from "@/lib/db";
import { foodBanks } from "@/lib/schema";
import { sql } from "drizzle-orm";
import { distance as levenshteinDistance } from "fastest-levenshtein";

export type DuplicateScore = {
  score: number; // 0-100
  factors: {
    addressSimilarity: number;  // 0-100
    nameSimilarity: number;     // 0-100
    distanceMeters: number;
    phoneMatch: boolean;
    websiteMatch: boolean;
  };
  confidence: "high" | "medium" | "low";
  matchedResource?: {
    id: string;
    name: string;
    address: string;
  };
};

/**
 * Detects potential duplicates for a given resource using PostGIS.
 *
 * Strategies:
 * 1. Exact address match (fastest)
 * 2. PostGIS ST_DWithin (spatial proximity) + Name Similarity
 */
export async function detectDuplicates(
  resource: {
    id?: string; // Optional ID to exclude self
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    latitude: number;
    longitude: number;
    phone?: string | null;
    website?: string | null;
  }
): Promise<DuplicateScore[]> {
  const duplicates: DuplicateScore[] = [];

  // Strategy 1: Exact address match
  // This is the most reliable signal and should be checked first.
  const exactMatches = await db
    .select()
    .from(foodBanks)
    .where(
      sql`LOWER(${foodBanks.address}) = LOWER(${resource.address})
          AND LOWER(${foodBanks.city}) = LOWER(${resource.city})
          AND LOWER(${foodBanks.state}) = LOWER(${resource.state})
          ${resource.id ? sql`AND ${foodBanks.id} != ${resource.id}` : sql``}`
    );

  for (const match of exactMatches) {
    duplicates.push({
      score: 100,
      factors: {
        addressSimilarity: 100,
        nameSimilarity: calculateStringSimilarity(resource.name, match.name) * 100,
        distanceMeters: 0,
        phoneMatch: resource.phone === match.phone && resource.phone != null,
        websiteMatch: resource.website === match.website && resource.website != null,
      },
      confidence: "high",
      matchedResource: {
        id: match.id,
        name: match.name,
        address: match.address
      }
    });
  }

  // Strategy 2: PostGIS Spatial Query
  // Find resources within 200 meters using ST_DWithin.
  // This replaces the manual bounding box + Haversine calculation.
  const SEARCH_RADIUS_METERS = 200;

  // Note: We cast to geography for accurate meter-based distance calculations
  const nearbyCandidates = await db.execute(sql`
    SELECT
      id,
      name,
      address,
      phone,
      website,
      ST_Distance(
        geom::geography,
        ST_SetSRID(ST_MakePoint(${resource.longitude}, ${resource.latitude}), 4326)::geography
      ) as distance_meters
    FROM food_banks
    WHERE ST_DWithin(
      geom::geography,
      ST_SetSRID(ST_MakePoint(${resource.longitude}, ${resource.latitude}), 4326)::geography,
      ${SEARCH_RADIUS_METERS}
    )
    ${resource.id ? sql`AND id != ${resource.id}` : sql``}
    ORDER BY distance_meters ASC
    LIMIT 10
  `);

  const rows = (nearbyCandidates as any).rows || nearbyCandidates;

  for (const row of rows) {
    const candidate = row as any;

    // Skip if already matched exactly
    if (duplicates.some(d => d.matchedResource?.id === candidate.id)) continue;

    const nameSim = calculateStringSimilarity(resource.name, candidate.name);
    const addressSim = calculateStringSimilarity(
      normalizeAddress(resource.address),
      normalizeAddress(candidate.address)
    );

    const phoneMatch = resource.phone === candidate.phone && resource.phone != null;
    const websiteMatch = resource.website === candidate.website && resource.website != null;
    const distance = candidate.distance_meters;

    // Weighted scoring logic
    // Address: 30%, Name: 20%, Distance: 10%, Phone: 20%, Website: 20%
    let score = 0;
    score += addressSim * 30;
    score += nameSim * 20;
    score += ((SEARCH_RADIUS_METERS - Math.min(distance, SEARCH_RADIUS_METERS)) / SEARCH_RADIUS_METERS) * 10;
    score += phoneMatch ? 20 : 0;
    score += websiteMatch ? 20 : 0;

    const confidence: "high" | "medium" | "low" =
      score > 80 ? "high" :
        score > 50 ? "medium" :
          "low";

    if (score > 50) { // Only flag if medium or high confidence
      duplicates.push({
        score,
        factors: {
          addressSimilarity: addressSim * 100,
          nameSimilarity: nameSim * 100,
          distanceMeters: distance,
          phoneMatch,
          websiteMatch,
        },
        confidence,
        matchedResource: {
          id: candidate.id,
          name: candidate.name,
          address: candidate.address
        }
      });
    }
  }

  return duplicates.sort((a, b) => b.score - a.score);
}

/**
 * Calculates similarity between two strings (0.0 to 1.0).
 * Uses Levenshtein distance normalized by string length.
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const distance = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);

  return 1 - (distance / maxLen);
}

/**
 * Normalizes an address string for better comparison.
 * Removes common suffixes and non-alphanumeric characters.
 */
function normalizeAddress(address: string): string {
  if (!address) return "";
  return address
    .toLowerCase()
    .trim()
    .replace(/\b(street|st|avenue|ave|boulevard|blvd|road|rd|drive|dr|lane|ln|court|ct)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}
