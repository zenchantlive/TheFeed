"use client";

import { useState } from "react";
import { useCopilotAction } from "@copilotkit/react-core";
import { ResourceCard } from "../resource-card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
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
        return <ResourceGrid resources={result} userLocation={userLocation} />;
      }

      return <></>;
    },
  });

  return null;
}

function ResourceGrid({
  resources,
  userLocation,
}: {
  resources: SearchResourceResult[];
  userLocation: { lat: number; lng: number } | null;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMore = resources.length > 2;
  const displayedResources = isExpanded ? resources : resources.slice(0, 2);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">
        Found {resources.length} resource{resources.length !== 1 ? "s" : ""}{" "}
        near you:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {displayedResources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            userLocation={userLocation}
          />
        ))}
      </div>

      {hasMore && (
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
                Show {resources.length - 2} more
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
