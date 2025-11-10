"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PostIntent } from "../../types";
import { useComposer } from "./use-composer";

type PostComposerProps = {
  defaultIntent?: PostIntent;
  onIntentChange?: (intent: PostIntent) => void;
  hideIntentToggle?: boolean;
};

/**
 * Post Composer
 *
 * Simple, clean composer for creating posts.
 * Can hide intent toggle when mode is already set above.
 */
export function PostComposer({
  defaultIntent = "need",
  onIntentChange,
  hideIntentToggle = false
}: PostComposerProps) {
  const {
    composerValue,
    setComposerValue,
    postIntent,
    setPostIntent,
    isPosting,
    handlePost,
  } = useComposer(defaultIntent);

  const handleIntentChange = (newIntent: PostIntent) => {
    setPostIntent(newIntent);
    onIntentChange?.(newIntent);
  };

  return (
    <section
      id="post-composer"
      className="rounded-2xl border border-border/70 bg-card/95 p-4 shadow-sm"
    >
      <div className="space-y-3">
        {/* Header with optional intent toggle */}
        {!hideIntentToggle && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-foreground">
              Share with neighbors
            </span>

            <div className="inline-flex items-center gap-1 rounded-full bg-muted/70 p-1">
              <button
                type="button"
                onClick={() => handleIntentChange("need")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                  postIntent === "need"
                    ? "bg-gradient-to-r from-hungry-start to-hungry-end text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                I need help
              </button>
              <button
                type="button"
                onClick={() => handleIntentChange("share")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                  postIntent === "share"
                    ? "bg-gradient-to-r from-full-start to-full-end text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                I can offer
              </button>
            </div>
          </div>
        )}

        {/* Textarea */}
        <textarea
          rows={3}
          value={composerValue}
          onChange={(event) => setComposerValue(event.target.value)}
          placeholder={
            postIntent === "need"
              ? "Ask for what you need (meals, pantry items, rides) and when/where neighbors can help…"
              : "Offer extra servings, groceries, rides, or volunteer time so neighbors know how you can help…"
          }
          className="w-full resize-none rounded-xl border border-border/60 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        />

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={handlePost}
            size="sm"
            className="rounded-full bg-primary px-4 text-primary-foreground"
            disabled={composerValue.trim().length === 0 || isPosting}
          >
            {isPosting ? "Posting…" : "Post to neighbors"}
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="rounded-full text-xs text-muted-foreground hover:text-primary"
          >
            <Link
              href={`/chat?prefill=${encodeURIComponent(
                "Help me write a short, kind post for the community potluck feed."
              )}`}
            >
              Ask sous-chef for help
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
