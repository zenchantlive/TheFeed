"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import type { CopilotRenderProps, UserContextResult } from "./types";

export function UserContextRenderer() {
  useCopilotAction({
    name: "get_user_context",
    available: "disabled",
    render: ({ status, result }: CopilotRenderProps<UserContextResult>) => {
      if (status === "inProgress" || status === "executing") {
        return (
          <div className="text-sm text-muted-foreground">
            👤 Loading your saved locations...
          </div>
        );
      }

      if (
        status === "complete" &&
        result?.savedLocations &&
        result.savedLocations.length > 0
      ) {
        return (
          <div className="my-3 p-4 rounded-xl border border-border/40 bg-card shadow-sm max-w-md">
            <p className="text-sm font-medium text-foreground mb-2">
              Your saved locations:
            </p>
            <ul className="space-y-1">
              {result.savedLocations.map((loc) => (
                <li
                  key={loc.id}
                  className="text-sm text-muted-foreground flex items-center gap-2"
                >
                  <span>📍</span>
                  <span>Saved location</span>
                </li>
              ))}
            </ul>
          </div>
        );
      }

      return <></>;
    },
  });

  return null;
}
