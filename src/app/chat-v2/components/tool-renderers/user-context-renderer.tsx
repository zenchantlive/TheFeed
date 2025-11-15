"use client";

import { useCopilotAction } from "@copilotkit/react-core";

export function UserContextRenderer() {
  useCopilotAction({
    name: "get_user_context",
    available: "disabled",
    render: ({ status, args, result }) => {
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
              {result.savedLocations.map((loc: any) => (
                <li
                  key={loc.id}
                  className="text-sm text-muted-foreground flex items-center gap-2"
                >
                  <span>📍</span>
                  <span>{loc.label || "Saved location"}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      }

      return null;
    },
  });

  return null;
}
