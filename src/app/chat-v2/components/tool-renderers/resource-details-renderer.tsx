"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { ResourceCard } from "../resource-card";
import type {
  CopilotRenderProps,
  ResourceDetailsResponse,
  SearchResourceResult,
} from "./types";

type ResourceDetailsRendererProps = {
  userLocation: { lat: number; lng: number } | null;
};

export function ResourceDetailsRenderer({
  userLocation,
}: ResourceDetailsRendererProps) {
  useCopilotAction({
    name: "get_resource_by_id",
    available: "disabled",
    render: ({
      status,
      result,
    }: CopilotRenderProps<ResourceDetailsResponse>) => {
      if (status === "inProgress" || status === "executing") {
        return (
          <div className="text-sm text-muted-foreground">
            📋 Loading resource details...
          </div>
        );
      }

      if (status === "complete" && result && !("error" in result)) {
        const resource: SearchResourceResult = {
          ...result,
          distanceMiles: null,
          isOpen: false,
        };
        return <ResourceCard resource={resource} userLocation={userLocation} />;
      }

      return <></>;
    },
  });

  return null;
}
