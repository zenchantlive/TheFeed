"use client";

import { useMemo, useState } from "react";
import type { FeedPost, FeedFilter, CommunityMode } from "../../types";
import { kindToFilter } from "../../types";
import { PostCard } from "./post-card";
import { PostFilters } from "./post-filters";
import { sortPostsByMode } from "./utils/sorting";
import { filterPostsByType } from "./utils/filtering";

type PostFeedProps = {
  posts: FeedPost[];
  mode: CommunityMode;
};

/**
 * Post Feed
 *
 * Main feed container with filtering and sorting.
 * Displays posts as bulletin board notes.
 */
export function PostFeed({ posts, mode }: PostFeedProps) {
  const [postFilter, setPostFilter] = useState<FeedFilter>("all");

  const displayPosts = useMemo(() => {
    // First sort by mode
    const sorted = sortPostsByMode(posts, mode);

    // Then filter by type
    return filterPostsByType(sorted, postFilter, kindToFilter);
  }, [posts, mode, postFilter]);

  return (
    <section className="flex flex-col gap-4" id="community-feed">
      <PostFilters
        currentFilter={postFilter}
        onFilterChange={setPostFilter}
        mode={mode}
      />

      <div className="space-y-4">
        {displayPosts.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-300/60 bg-white/60 p-8 text-center dark:border-slate-700/60 dark:bg-slate-800/60">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No posts match these filters yet. Be the first to share!
            </p>
          </div>
        ) : (
          displayPosts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </section>
  );
}
