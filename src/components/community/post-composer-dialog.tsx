"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { PostComposer } from "@/app/community/components/composer";
import type { PostIntent } from "@/app/community/types";

interface PostComposerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialContent?: string;
    defaultIntent?: PostIntent;
}

/**
 * Post Composer Dialog
 * 
 * Reusable dialog that wraps the PostComposer. 
 * Allows the Chat AI to pop up a "finalize your post" modal.
 */
export function PostComposerDialog({
    open,
    onOpenChange,
    initialContent,
    defaultIntent = "need",
}: PostComposerDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-background/95 backdrop-blur-xl border-white/20">
                <DialogHeader>
                    <DialogTitle>Create Community Post</DialogTitle>
                    <DialogDescription>
                        Review and publish to your neighborhood feed.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <PostComposer
                        defaultIntent={defaultIntent}
                        initialContent={initialContent}
                        onSuccess={() => onOpenChange(false)}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
