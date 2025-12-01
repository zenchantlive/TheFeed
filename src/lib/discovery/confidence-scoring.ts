/**
 * Quantitative Confidence Scoring
 *
 * Replaces subjective LLM "vibes" with formula-based scoring (0-100 points).
 * Provides transparent, auditable quality metrics for discovered resources.
 */

import { type DiscoveryResult } from "./types";

export type ConfidenceFactors = {
  fieldCompleteness: number; // 0-40 points
  sourceAuthority: number;   // 0-30 points
  dataFreshness: number;     // 0-10 points
  multiSourceConfirmation: number; // 0-20 points
  total: number;             // 0-100
};

export function calculateConfidence(
  resource: DiscoveryResult,
  options: {
    discoveryDate?: Date;
    confirmingSources?: string[];
  } = {}
): { score: number; factors: ConfidenceFactors } {
  const factors: ConfidenceFactors = {
    fieldCompleteness: 0,
    sourceAuthority: 0,
    dataFreshness: 0,
    multiSourceConfirmation: 0,
    total: 0
  };

  // 1. Field Completeness (40 points max)
  const fields = {
    phone: 8,
    website: 8,
    hours: 12, // Critical field
    services: 6,
    description: 6
  };

  for (const [field, points] of Object.entries(fields)) {
    const value = resource[field as keyof DiscoveryResult];
    if (value != null && value !== "") {
      if (field === "services" && Array.isArray(value) && value.length > 0) {
        factors.fieldCompleteness += points;
      } else if (field !== "services") {
        factors.fieldCompleteness += points;
      }
    }
  }

  // 2. Source Authority (30 points max)
  const sourceUrl = resource.sourceUrl;
  if (sourceUrl) {
    try {
      const domain = new URL(sourceUrl).hostname.toLowerCase();

      if (domain.endsWith('.gov')) {
        factors.sourceAuthority = 30; // Government source - highest trust
      } else if (domain.match(/feedingamerica\.org|211\.org|fns\.usda\.gov/i)) {
        factors.sourceAuthority = 25; // Known authoritative sources
      } else if (domain.endsWith('.org')) {
        factors.sourceAuthority = 15; // Non-profit org
      } else if (domain.endsWith('.edu')) {
        factors.sourceAuthority = 10; // Educational institution
      } else {
        factors.sourceAuthority = 5; // Commercial/unknown
      }
    } catch {
      factors.sourceAuthority = 0;
    }
  }

  // 3. Data Freshness (10 points max)
  // Since it's newly discovered, full points
  factors.dataFreshness = 10;

  // 4. Multi-Source Confirmation (20 points max)
  const confirmingSources = options.confirmingSources || [];
  if (confirmingSources.length >= 3) {
    factors.multiSourceConfirmation = 20;
  } else if (confirmingSources.length === 2) {
    factors.multiSourceConfirmation = 15;
  } else if (confirmingSources.length === 1) {
    factors.multiSourceConfirmation = 10;
  }

  // Calculate total (0-100 scale)
  factors.total =
    factors.fieldCompleteness +
    factors.sourceAuthority +
    factors.dataFreshness +
    factors.multiSourceConfirmation;

  // Convert to 0-1 scale for storage
  const score = factors.total / 100;

  return { score, factors };
}

export function getConfidenceTier(score: number): "high" | "medium" | "low" {
  if (score >= 0.8) return "high";
  if (score >= 0.5) return "medium";
  return "low";
}

export function shouldAutoApprove(
  score: number,
  sourceUrl: string,
  isPotentialDuplicate: boolean
): boolean {
  if (isPotentialDuplicate) return false;

  // Only auto-approve high confidence from trusted sources
  if (score < 0.9) return false;

  try {
    const domain = new URL(sourceUrl).hostname.toLowerCase();
    return domain.endsWith('.gov') ||
           domain.match(/feedingamerica\.org|211\.org|fns\.usda\.gov/) !== null;
  } catch {
    return false;
  }
}
