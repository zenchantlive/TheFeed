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
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground mb-3">
              Found {result.length} post{result.length !== 1 ? "s" : ""}:
            </p>
            {result.map((post) => (
              <PostPreview key={post.id} post={post} />
            ))}
          </div>
        );
      }

      return <></>;
    },
  });

  return null;
}
