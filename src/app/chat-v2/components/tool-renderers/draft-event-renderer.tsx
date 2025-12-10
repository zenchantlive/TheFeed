"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { DraftEventCard, type DraftEvent } from "../cards/draft-event-card";
import type { CopilotRenderProps } from "./types";

export function DraftEventRenderer() {
    useCopilotAction({
        name: "create_draft_event",
        available: "disabled", // Backend action handles execution
        render: ({ status, result }: CopilotRenderProps<{ draft: DraftEvent }>) => {
            // Logic:
            // If complete, show the structured draft from result
            // If in progress, show a skeleton or "Drafting..." state

            if (status === "complete" && result && result.draft) {
                return <DraftEventCard draft={result.draft} />;
            }

            if (status === "inProgress" || status === "executing") {
                return (
                    <div className="mt-2 rounded-xl border border-border/40 bg-muted/20 p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                            <p className="text-sm font-medium text-muted-foreground animate-pulse">
                                Drafting your event details...
                            </p>
                        </div>
                    </div>
                );
            }

            return <></>;
        },
    });

    return null;
}
