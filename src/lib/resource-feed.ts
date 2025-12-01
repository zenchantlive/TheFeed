import { db } from "./db";
import { foodBanks } from "./schema";
import { normalizeResource, type NormalizedResource } from "./resource-normalizer";
import { notInArray, inArray } from "drizzle-orm";

type FeedOptions = {
  limit?: number;
  offset?: number;
  includeStatuses?: string[];
  excludeRejected?: boolean;
};

export type NormalizedResourceWithMeta = NormalizedResource & {
  id: string;
  verificationStatus: string | null;
};

/**
 * Returns normalized resources for client surfaces (map/search/chat).
 * Applies the same canonical formatting used during ingestion.
 */
export async function getNormalizedResources(
  options: FeedOptions = {}
): Promise<NormalizedResourceWithMeta[]> {
  const {
    limit = 100,
    offset = 0,
    includeStatuses,
    excludeRejected = true
  } = options;

  const excludedStatuses = ["rejected", "duplicate"];

  // Build query with proper filtering
  const baseQuery = db.select().from(foodBanks);

  let rows;
  if (includeStatuses && includeStatuses.length > 0) {
    rows = await baseQuery
      .where(inArray(foodBanks.verificationStatus, includeStatuses))
      .limit(limit)
      .offset(offset);
  } else if (excludeRejected) {
    rows = await baseQuery
      .where(notInArray(foodBanks.verificationStatus, excludedStatuses))
      .limit(limit)
      .offset(offset);
  } else {
    rows = await baseQuery
      .limit(limit)
      .offset(offset);
  }

  return rows.map((row) => {
    const normalized = normalizeResource({
      name: row.name,
      address: row.address,
      city: row.city,
      state: row.state,
      zipCode: row.zipCode,
      latitude: row.latitude,
      longitude: row.longitude,
      phone: row.phone,
      website: row.website,
      description: row.description,
      services: row.services ?? [],
      hours: row.hours ?? null,
      sourceUrl: row.sourceUrl ?? undefined,
      confidence: row.confidenceScore ?? undefined,
      provenance: row.sourceUrl ? { sources: [row.sourceUrl] } : undefined,
    });

    return {
      ...normalized,
      id: row.id,
      verificationStatus: row.verificationStatus ?? null,
    };
  });
}
