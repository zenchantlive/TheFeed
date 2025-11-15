"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import type { CopilotRenderProps, DirectionsResult } from "./types";

export function DirectionsRenderer() {
  useCopilotAction({
    name: "get_directions",
    available: "disabled",
    render: ({ status, result }: CopilotRenderProps<DirectionsResult>) => {
      if (status === "inProgress" || status === "executing") {
        return (
          <div className="text-sm text-muted-foreground">
            🗺️ Generating directions...
          </div>
        );
      }

      if (status === "complete" && result?.url) {
        return (
          <div className="my-3 p-4 rounded-xl border border-border/40 bg-card shadow-sm max-w-md">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">
                  Directions ready
                </p>
                <p className="text-xs text-muted-foreground">
                  Open in Google Maps
                </p>
              </div>
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                🗺️ Get Directions
              </a>
            </div>
          </div>
        );
      }

      return <></>;
    },
  });

  return null;
}
