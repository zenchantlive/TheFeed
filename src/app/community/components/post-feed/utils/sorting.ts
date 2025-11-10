/**
 * Post sorting utilities
 */

import type { FeedPost, CommunityMode } from "../../../types";

/**
 * Sort posts based on mode
 * - Hungry: Prioritize shares/resources
 * - Helper: Prioritize requests
 * - Browse: Natural order
 */
export function sortPostsByMode(posts: FeedPost[], mode: CommunityMode): FeedPost[] {
  const sorted = [...posts];

  if (mode === "hungry") {
    sorted.sort((a, b) => {
      const aPriority = a.kind === "share" || a.kind === "resource" ? 0 : 1;
      const bPriority = b.kind === "share" || b.kind === "resource" ? 0 : 1;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return 0;
    });
  } else if (mode === "helper") {
    sorted.sort((a, b) => {
      const aPriority = a.kind === "request" ? 0 : 1;
      const bPriority = b.kind === "request" ? 0 : 1;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return 0;
    });
  }

  return sorted;
}
