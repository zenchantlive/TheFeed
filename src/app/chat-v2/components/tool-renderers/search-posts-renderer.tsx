"use client";

import { useState } from "react";
import { useCopilotAction } from "@copilotkit/react-core";
import { PostPreview } from "../post-preview";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { CopilotRenderProps, SearchPostResult } from "./types";

const INITIAL_DISPLAY_COUNT = 2;

function PostsList({ posts }: { posts: SearchPostResult[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const showExpandButton = posts.length > INITIAL_DISPLAY_COUNT;
  const displayedPosts = isExpanded
    ? posts
    : posts.slice(0, INITIAL_DISPLAY_COUNT);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground mb-3">
        Found {posts.length} post{posts.length !== 1 ? "s" : ""}:
      </p>
      {displayedPosts.map((post) => (
        <PostPreview key={post.id} post={post} />
      ))}
      {showExpandButton && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show {posts.length - INITIAL_DISPLAY_COUNT} more
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export function SearchPostsRenderer() {
  useCopilotAction({
    name: "search_posts",
    available: "disabled",
    render: ({ status, result }: CopilotRenderProps<SearchPostResult[]>) => {
      if (status === "inProgress") {
        return (
          <div className="text-sm text-muted-foreground">
            💬 Searching community posts...
          </div>
        );
      }

      if (status === "executing") {
        return (
          <div className="text-sm text-muted-foreground">
            🔎 Finding the best matches...
          </div>
        );
      }

      if (status === "complete" && result && Array.isArray(result)) {
        return <PostsList posts={result} />;
      }

      return <></>;
    },
  });

  return null;
}
