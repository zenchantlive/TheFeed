/**
 * Admin Verification Page - Server Component
 *
 * Fetches unverified resources from the database and passes them to the client component.
 * Runs on the server for optimal data fetching.
 */

import { db } from "@/lib/db";
import { foodBanks } from "@/lib/schema";
import { sql } from "drizzle-orm";
import { VerificationPageClient } from "./page-client";
import type { VerificationResource } from "./types";

/**
 * Fetch all unverified resources from the database
 * Returns resources that need admin attention
 */
async function getUnverifiedResources(): Promise<VerificationResource[]> {
  // Query for resources that need verification
  // Include: unverified, auto-discovered, and community-verified
  // Exclude: already admin-verified, rejected
  const resources = await db
    .select()
    .from(foodBanks)
    .where(
      sql`${foodBanks.verificationStatus} IN ('unverified', 'community_verified', 'auto_discovered')
          OR ${foodBanks.adminVerifiedBy} IS NULL`
    )
    .orderBy(sql`${foodBanks.createdAt} DESC`)
    .limit(500); // Limit to 500 most recent for performance

  // Transform database records to VerificationResource format
  return resources.map((resource) => ({
    id: resource.id,
    name: resource.name,
    address: resource.address,
    city: resource.city,
    state: resource.state,
    zipCode: resource.zipCode,
    latitude: resource.latitude,
    longitude: resource.longitude,
    phone: resource.phone,
    website: resource.website,
    description: resource.description,
    hours: resource.hours,
    services: resource.services,
    confidenceScore: resource.confidenceScore || 0,
    verificationStatus: resource.verificationStatus,
    autoDiscoveredAt: resource.autoDiscoveredAt,
    sourceUrl: resource.sourceUrl,
    potentialDuplicates: resource.potentialDuplicates as string[] | null,
  }));
}

export default async function VerificationPage() {
  // Fetch resources on the server
  const initialResources = await getUnverifiedResources();

  return <VerificationPageClient initialResources={initialResources} />;
}
