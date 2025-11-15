"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { ResourceCard } from "../resource-card";

interface ResourceDetailsRendererProps {
  userLocation: { lat: number; lng: number } | null;
}

export function ResourceDetailsRenderer({
  userLocation,
}: ResourceDetailsRendererProps) {
  useCopilotAction({
    name: "get_resource_by_id",
    available: "disabled",
    render: ({ status, args, result }) => {
      if (status === "inProgress" || status === "executing") {
        return (
          <div className="text-sm text-muted-foreground">
            📋 Loading resource details...
          </div>
        );
      }

      if (status === "complete" && result && !result.error) {
        return <ResourceCard resource={result} userLocation={userLocation} />;
      }

      return null;
    },
  });

  return null;
}
