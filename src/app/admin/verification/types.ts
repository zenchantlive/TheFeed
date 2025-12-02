/**
 * Type definitions for the verification workspace
 *
 * These types define the data structures used throughout the verification UI,
 * including queue categories, resource states, and filter options.
 */

import type { HoursType } from "@/lib/schema";

/**
 * Queue categories for organizing resources by verification priority
 * - quick_wins: High confidence, just needs 1-2 fields filled
 * - high_impact: Complete data, just needs verification approval
 * - needs_work: Low confidence or missing critical fields
 * - flagged: Potential duplicates or suspicious data requiring manual review
 */
export type QueueType = "quick_wins" | "high_impact" | "needs_work" | "flagged";

/**
 * Confidence tier for visual indicators
 * - high: 80%+ (green badge)
 * - medium: 60-79% (yellow badge)
 * - low: <60% (red badge)
 */
export type ConfidenceTier = "high" | "medium" | "low";

/**
 * Field status for showing completeness indicators
 * - complete: Field has valid data (✅)
 * - incomplete: Field has data but may need review (⚠️)
 * - missing: Field is empty or null (❌)
 */
export type FieldStatus = "complete" | "incomplete" | "missing";

/**
 * Resource data for verification cards
 * This is a simplified view of the full food bank record
 */
export interface VerificationResource {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;

  // Contact info
  phone: string | null;
  website: string | null;
  description: string | null;

  // Operating hours
  hours: HoursType | null;

  // Services offered
  services: string[] | null;

  // Verification metadata
  confidenceScore: number; // 0-1 scale
  verificationStatus: string;
  autoDiscoveredAt: Date | null;
  sourceUrl: string | null;

  // Duplicate detection
  potentialDuplicates: string[] | null;

  // Queue assignment (computed on client)
  queue?: QueueType;
}

/**
 * Search and filter state
 */
export interface VerificationFilters {
  // Text search query
  searchQuery: string;

  // Queue filter (which columns to show)
  activeQueues: QueueType[];

  // Confidence range filter
  confidenceMin: number; // 0-100
  confidenceMax: number; // 0-100

  // Location filter (city, state, or zip)
  location: string | null;

  // Missing field filters
  missingFields: Array<"phone" | "website" | "hours" | "description" | "services">;

  // Source filter
  sources: Array<"auto_discovered" | "manual_import" | "community_submitted">;
}

/**
 * Confidence score breakdown for transparency
 */
export interface ConfidenceBreakdown {
  total: number; // 0-100
  completeness: number; // 0-40 points
  sourceAuthority: number; // 0-30 points
  dataFreshness: number; // 0-20 points
  multiSourceConfirmation: number; // 0-10 points
}

/**
 * Field completeness status for a resource
 */
export interface FieldCompleteness {
  phone: FieldStatus;
  website: FieldStatus;
  hours: FieldStatus;
  description: FieldStatus;
  services: FieldStatus;
}

/**
 * Bulk action types
 */
export type BulkActionType =
  | "verify"
  | "reject"
  | "enhance"
  | "mark_duplicate"
  | "flag_review";

/**
 * Queue statistics for sidebar display
 */
export interface QueueStats {
  quickWins: number;
  highImpact: number;
  needsWork: number;
  flagged: number;
  total: number;
  verified: number;
  verifiedPercent: number;
}

/**
 * Archive filter mode
 * - active: Show only non-archived resources (default)
 * - archived: Show only archived resources
 * - all: Show all resources regardless of archive status
 */
export type ArchiveMode = "active" | "archived" | "all";

/**
 * Table sort column types
 */
export type SortColumn = "name" | "location" | "confidence" | "queue";

/**
 * Table sort direction
 */
export type SortDirection = "asc" | "desc";

/**
 * Table state for managing pagination and sorting
 */
export interface TableState {
  /** Current page (1-indexed) */
  page: number;

  /** Items per page (25, 50, or 100) */
  pageSize: number;

  /** Sort column */
  sortColumn: SortColumn;

  /** Sort direction */
  sortDirection: SortDirection;

  /** Selected resource IDs for bulk actions */
  selectedIds: string[];

  /** Archive filter mode */
  archiveMode: ArchiveMode;
}
