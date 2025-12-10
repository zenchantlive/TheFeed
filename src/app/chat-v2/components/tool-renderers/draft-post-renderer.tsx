"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { DraftPostCard, type DraftPost } from "../cards/draft-post-card";
import type { CopilotRenderProps } from "./types";

export function DraftPostRenderer() {
    useCopilotAction({
        name: "create_draft_post",
        available: "disabled",
        render: ({ status, result }: CopilotRenderProps<{ draft: DraftPost }>) => {
            if (status === "complete" && result && result.draft) {
                return <DraftPostCard draft={result.draft} />;
            }

            if (status === "inProgress" || status === "executing") {
                return (
                    <div className="mt-2 rounded-xl border border-border/40 bg-muted/20 p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            <p className="text-sm font-medium text-muted-foreground animate-pulse">
                                Composing your post...
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
