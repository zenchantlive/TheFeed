/**
 * Enhanced Duplicate Detection
 *
 * Multi-strategy duplicate detection with scoring.
 * Catches duplicates through exact address matching and geo-spatial + name similarity.
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

export async function detectDuplicates(
  resource: {
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
  const exactMatches = await db
    .select()
    .from(foodBanks)
    .where(
      sql`LOWER(${foodBanks.address}) = LOWER(${resource.address})
          AND LOWER(${foodBanks.city}) = LOWER(${resource.city})
          AND LOWER(${foodBanks.state}) = LOWER(${resource.state})`
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

  // Strategy 2: Geo-spatial + name similarity
  const latBuffer = 0.005; // ~555m
  const lngBuffer = 0.005;

  const nearbyCandidates = await db
    .select()
    .from(foodBanks)
    .where(
      sql`${foodBanks.latitude} BETWEEN ${resource.latitude - latBuffer} AND ${resource.latitude + latBuffer}
          AND ${foodBanks.longitude} BETWEEN ${resource.longitude - lngBuffer} AND ${resource.longitude + lngBuffer}`
    );

  for (const candidate of nearbyCandidates) {
    // Skip if already matched exactly
    if (duplicates.some(d => d.matchedResource?.id === candidate.id)) continue;

    const distance = haversineDistance(
      resource.latitude,
      resource.longitude,
      candidate.latitude,
      candidate.longitude
    );

    if (distance > 200) continue; // Only consider within 200m

    const nameSim = calculateStringSimilarity(resource.name, candidate.name);
    const addressSim = calculateStringSimilarity(
      normalizeAddress(resource.address),
      normalizeAddress(candidate.address)
    );

    const phoneMatch = resource.phone === candidate.phone && resource.phone != null;
    const websiteMatch = resource.website === candidate.website && resource.website != null;

    // Weighted scoring
    let score = 0;
    score += addressSim * 30;  // 30% weight
    score += nameSim * 20;     // 20% weight
    score += ((200 - Math.min(distance, 200)) / 200) * 10; // 10% weight (closer = higher)
    score += phoneMatch ? 20 : 0;    // 20% weight
    score += websiteMatch ? 20 : 0;  // 20% weight

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

function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;

  const distance = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);

  return 1 - (distance / maxLen);
}

function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .trim()
    .replace(/\b(street|st|avenue|ave|boulevard|blvd|road|rd|drive|dr|lane|ln|court|ct)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
