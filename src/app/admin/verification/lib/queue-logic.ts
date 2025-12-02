/**
 * Queue Logic
 *
 * Determines which queue (column) each resource should appear in based on
 * confidence score, completeness, and flags.
 */

import type {
  VerificationResource,
  QueueType,
  ConfidenceTier,
  FieldStatus,
  FieldCompleteness,
} from "../types";

/**
 * Categorize a resource into the appropriate verification queue
 *
 * Logic:
 * 1. Flagged resources go to "flagged" queue (duplicates, suspicious data)
 * 2. High confidence (80%+) + few missing fields → "quick_wins"
 * 3. Medium/high confidence + complete data → "high_impact"
 * 4. Everything else → "needs_work"
 *
 * @param resource - The resource to categorize
 * @returns The queue type this resource belongs to
 */
export function categorizeResource(resource: VerificationResource): QueueType {
  // Convert confidence from 0-1 scale to 0-100 percentage
  const confidencePercent = (resource.confidenceScore || 0) * 100;

  // Check if resource is flagged for manual review
  const isFlagged =
    (resource.potentialDuplicates && resource.potentialDuplicates.length > 0) ||
    resource.verificationStatus === "rejected" ||
    resource.verificationStatus === "flagged";

  // Flagged resources always go to flagged queue
  if (isFlagged) {
    return "flagged";
  }

  // Count missing critical fields
  const missingFieldCount = countMissingFields(resource);

  // Quick wins: High confidence + 1-2 missing fields
  // These are easy to complete with minimal effort
  if (confidencePercent >= 80 && missingFieldCount <= 2) {
    return "quick_wins";
  }

  // High impact: Good confidence + complete data
  // These just need a quick verify and publish
  if (confidencePercent >= 60 && missingFieldCount === 0) {
    return "high_impact";
  }

  // Everything else needs work
  return "needs_work";
}

/**
 * Count how many critical fields are missing from a resource
 *
 * Critical fields: phone, website, hours, description, services
 *
 * @param resource - The resource to check
 * @returns Number of missing fields (0-5)
 */
export function countMissingFields(resource: VerificationResource): number {
  let count = 0;

  // Check each critical field
  if (!resource.phone) count++;
  if (!resource.website) count++;
  if (!resource.hours) count++;
  if (!resource.description) count++;
  if (!resource.services || resource.services.length === 0) count++;

  return count;
}

/**
 * Get confidence tier for visual indicators
 *
 * @param confidenceScore - Confidence score (0-1 scale)
 * @returns Tier classification (high, medium, low)
 */
export function getConfidenceTier(confidenceScore: number): ConfidenceTier {
  const percent = confidenceScore * 100;

  if (percent >= 80) return "high";
  if (percent >= 60) return "medium";
  return "low";
}

/**
 * Get field completeness status for all fields in a resource
 *
 * @param resource - The resource to check
 * @returns Object with status for each field
 */
export function getFieldCompleteness(
  resource: VerificationResource
): FieldCompleteness {
  return {
    phone: getFieldStatus(resource.phone),
    website: getFieldStatus(resource.website),
    hours: resource.hours ? "complete" : "missing",
    description: getFieldStatus(resource.description),
    services:
      resource.services && resource.services.length > 0
        ? "complete"
        : "missing",
  };
}

/**
 * Get status for a single text field
 *
 * @param value - The field value
 * @returns Field status (complete, incomplete, or missing)
 */
function getFieldStatus(value: string | null | undefined): FieldStatus {
  if (!value) return "missing";

  // Field is present but might need review if it's very short
  // or looks incomplete (less than 5 characters)
  if (value.length < 5) return "incomplete";

  return "complete";
}

/**
 * Calculate confidence score breakdown
 *
 * Shows how the confidence score was calculated across different factors.
 * This provides transparency for admins to understand resource quality.
 *
 * @param resource - The resource to analyze
 * @returns Breakdown of confidence factors
 */
export function calculateConfidenceBreakdown(resource: VerificationResource) {
  // Field completeness (0-40 points)
  const completenessPoints = {
    phone: 8,
    website: 8,
    hours: 12, // Most critical field
    services: 6,
    description: 6,
  };

  let completeness = 0;
  if (resource.phone) completeness += completenessPoints.phone;
  if (resource.website) completeness += completenessPoints.website;
  if (resource.hours) completeness += completenessPoints.hours;
  if (resource.services && resource.services.length > 0) {
    completeness += completenessPoints.services;
  }
  if (resource.description) completeness += completenessPoints.description;

  // Source authority (0-30 points)
  let sourceAuthority = 5; // Default for unknown sources
  if (resource.sourceUrl) {
    try {
      const domain = new URL(resource.sourceUrl).hostname.toLowerCase();

      if (domain.endsWith(".gov")) {
        sourceAuthority = 30; // Government source
      } else if (
        domain.includes("feedingamerica") ||
        domain.includes("211.org")
      ) {
        sourceAuthority = 25; // Known authoritative sources
      } else if (domain.endsWith(".org")) {
        sourceAuthority = 15; // Non-profit
      } else if (domain.endsWith(".edu")) {
        sourceAuthority = 10; // Educational
      }
    } catch {
      // Invalid URL, keep default
    }
  }

  // Data freshness (0-20 points)
  // For newly discovered resources, give full points
  // In future, could decay based on age
  const dataFreshness = resource.autoDiscoveredAt ? 20 : 10;

  // Multi-source confirmation (0-10 points)
  // Currently not implemented, placeholder for future
  const multiSourceConfirmation = 0;

  // Calculate total
  const total =
    completeness + sourceAuthority + dataFreshness + multiSourceConfirmation;

  return {
    total,
    completeness,
    sourceAuthority,
    dataFreshness,
    multiSourceConfirmation,
  };
}

/**
 * Get user-friendly label for queue type
 *
 * @param queue - Queue type
 * @returns Display label with emoji
 */
export function getQueueLabel(queue: QueueType): string {
  const labels: Record<QueueType, string> = {
    quick_wins: "⚡ Quick Wins",
    high_impact: "🎯 High Impact",
    needs_work: "🔧 Needs Work",
    flagged: "⚠️ Flagged",
  };

  return labels[queue];
}

/**
 * Get description for what each queue contains
 *
 * @param queue - Queue type
 * @returns User-friendly description
 */
export function getQueueDescription(queue: QueueType): string {
  const descriptions: Record<QueueType, string> = {
    quick_wins: "High confidence, missing 1-2 fields. Fast to complete.",
    high_impact: "Complete data, just needs verification.",
    needs_work: "Low confidence or missing critical fields.",
    flagged: "Potential duplicates or needs manual review.",
  };

  return descriptions[queue];
}
