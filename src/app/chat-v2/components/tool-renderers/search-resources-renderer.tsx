"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { ResourceCard } from "../resource-card";
import { ChevronDown } from "lucide-react";
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
  if (resources.length === 0) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/60 p-4 text-sm text-muted-foreground">
        No nearby resources found.
      </div>
    );
  }

  const prioritizedResources = [...resources].sort((a, b) => {
    if (a.isOpen !== b.isOpen) {
      return a.isOpen ? -1 : 1;
    }

    const aDistance = a.distanceMiles ?? Number.POSITIVE_INFINITY;
    const bDistance = b.distanceMiles ?? Number.POSITIVE_INFINITY;

    if (aDistance !== bDistance) {
      return aDistance - bDistance;
    }

    return a.name.localeCompare(b.name);
  });

  const limitedResources = prioritizedResources.slice(0, 8);
  const primaryResources = limitedResources.slice(0, Math.min(2, limitedResources.length));
  const hiddenResources = limitedResources.slice(primaryResources.length);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <p className="text-sm font-medium text-foreground">
        {`Showing the closest ${limitedResources.length} of ${resources.length} resource${resources.length !== 1 ? "s" : ""} near you (open locations first):`}
      </p>

      <div className="space-y-3">
        {primaryResources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            userLocation={userLocation}
          />
        ))}
      </div>

      {hiddenResources.length > 0 && (
        <details className="group rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm">
          <summary className="flex cursor-pointer items-center justify-between px-4 py-2 text-sm font-medium text-foreground">
            <span>
              Show {hiddenResources.length} more resource{hiddenResources.length > 1 ? "s" : ""}
            </span>
            <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="space-y-3 px-4 pb-4 pt-2">
            {hiddenResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                userLocation={userLocation}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
