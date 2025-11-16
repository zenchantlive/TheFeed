"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { ResourceCard } from "../resource-card";
import type { CopilotRenderProps, SearchResourceResult } from "./types";

type SearchResourcesRendererProps = {
  userLocation: { lat: number; lng: number } | null;
};

export function SearchResourcesRenderer({
  userLocation,
}: SearchResourcesRendererProps) {
  useCopilotAction({
    name: "search_resources",
    available: "disabled", // Only for rendering, tool is defined in backend
    render: ({ status, result }: CopilotRenderProps<SearchResourceResult[]>) => {
      if (status === "inProgress") {
        return (
          <div className="text-sm text-muted-foreground">
            🔍 Searching for food resources nearby...
          </div>
        );
      }

      if (status === "executing") {
        return (
          <div className="text-sm text-muted-foreground">
            📍 Calculating distances...
          </div>
        );
      }

      if (status === "complete" && result && Array.isArray(result)) {
        return (
          <div className="space-y-2 w-full max-w-full">
            <p className="text-xs sm:text-sm font-medium text-foreground mb-2 sm:mb-3">
              Found {result.length} resource{result.length !== 1 ? "s" : ""}{" "}
              near you:
            </p>
            <div className="grid grid-cols-1 gap-2 sm:gap-3">
              {result.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  userLocation={userLocation}
                />
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
