"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { ResourceCard } from "../resource-card";

interface SearchResourcesRendererProps {
  userLocation: { lat: number; lng: number } | null;
}

export function SearchResourcesRenderer({
  userLocation,
}: SearchResourcesRendererProps) {
  useCopilotAction({
    name: "search_resources",
    available: "disabled", // Only for rendering, tool is defined in backend
    render: ({ status, args, result }) => {
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
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground mb-3">
              Found {result.length} resource{result.length !== 1 ? "s" : ""}{" "}
              near you:
            </p>
            {result.map((resource: any) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                userLocation={userLocation}
              />
            ))}
          </div>
        );
      }

      return null;
    },
  });

  return null;
}
