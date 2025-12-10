"use client";

import { useState } from "react";
import { PostComposerDialog } from "@/components/community/post-composer-dialog";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react";
import type { PostIntent } from "@/app/community/types";

/**
 * Schema matches the output of `create_draft_post` tool
 */
export interface DraftPost {
    intent: PostIntent;
    content: string;
    urgency?: "asap" | "today" | "this_week";
}

interface DraftPostCardProps {
    draft: DraftPost;
}

/**
 * Draft Post Card
 * 
 * Renders a preview of the post.
 * Allows user to "Review & Post".
 */
export function DraftPostCard({ draft }: DraftPostCardProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const isNeed = draft.intent === "need";
    const themeColor = isNeed ? "text-hungry-end" : "text-full-end";
    const borderColor = isNeed ? "border-hungry-end/30" : "border-full-end/30";
    const bgColor = isNeed ? "bg-hungry-start/5" : "bg-full-start/5";

    return (
        <>
            <div className={`mt-3 overflow-hidden rounded-2xl border ${borderColor} ${bgColor} backdrop-blur-sm`}>
                <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold uppercase tracking-wider ${themeColor}`}>
                            {isNeed ? "Requesting Help" : "Sharing Food"}
                        </span>
                        {draft.urgency && (
                            <span className="text-[10px] bg-red-500/20 text-red-200 px-1.5 py-0.5 rounded uppercase">
                                {draft.urgency.replace("_", " ")}
                            </span>
                        )}
                    </div>

                    <div className="bg-background/40 p-3 rounded-lg border border-white/5 italic text-sm text-foreground/90">
                        &quot;{draft.content}&quot;
                    </div>

                    <Button
                        onClick={() => setIsDialogOpen(true)}
                        variant="outline"
                        className="w-full border-white/10 hover:bg-white/5 hover:text-white"
                    >
                        <MessageSquarePlus className="mr-2 h-4 w-4" />
                        Review & Post
                    </Button>
                </div>
            </div>

            <PostComposerDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                defaultIntent={draft.intent}
                initialContent={draft.content}
            />
        </>
    );
}
