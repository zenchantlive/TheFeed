"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { PostPreview } from "../post-preview";
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
        return (
          <div className="space-y-2 w-full max-w-full">
            <p className="text-xs sm:text-sm font-medium text-foreground mb-2 sm:mb-3">
              Found {result.length} post{result.length !== 1 ? "s" : ""}:
            </p>
            <div className="grid grid-cols-1 gap-2 sm:gap-3">
              {result.map((post) => (
                <PostPreview key={post.id} post={post} />
              ))}
            </div>
          </div>
        );
      }

      return <></>;
    },
  });

  return null;
}
