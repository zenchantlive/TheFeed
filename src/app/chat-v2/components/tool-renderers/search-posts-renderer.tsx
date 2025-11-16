"use client";

import { useState } from "react";
import { useCopilotAction } from "@copilotkit/react-core";
import { PostPreview } from "../post-preview";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { CopilotRenderProps, SearchPostResult } from "./types";

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
        return <PostGrid posts={result} />;
      }

      return <></>;
    },
  });

  return null;
}

function PostGrid({ posts }: { posts: SearchPostResult[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMore = posts.length > 2;
  const displayedPosts = isExpanded ? posts : posts.slice(0, 2);

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <p className="text-sm font-medium text-foreground">
        Found {posts.length} post{posts.length !== 1 ? "s" : ""}:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        {displayedPosts.map((post) => (
          <PostPreview key={post.id} post={post} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show {posts.length - 2} more
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
