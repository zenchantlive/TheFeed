/**
 * Post filtering utilities
 */

import type { FeedPost, FeedFilter } from "../../../types";

/**
 * Filter posts by type
 */
export function filterPostsByType(
  posts: FeedPost[],
  filter: FeedFilter,
  kindMap: Record<FeedPost["kind"], FeedFilter>
): FeedPost[] {
  if (filter === "all") return posts;
  return posts.filter((post) => kindMap[post.kind] === filter);
}
