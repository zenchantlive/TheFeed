"use client";

import { cn } from "@/lib/utils";
import type { CommunityMode, PostIntent } from "../../types";

type ModeToggleProps = {
  mode: CommunityMode;
  onModeChange: (mode: CommunityMode, defaultIntent: PostIntent) => void;
};

/**
 * Mode Toggle Bar
 *
 * Compact header with mode selector.
 * Restored original styling (removed bulletin board aesthetic).
 */
export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-border/40 bg-background/95 px-4 py-2 backdrop-blur">
      {/* Left: Context label */}
      <div className="flex flex-col">
        <span className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          TheFeed • Community
        </span>
        <span className="text-xs text-muted-foreground">
          A neighbor-powered potluck feed for Midtown Sacramento.
        </span>
      </div>

      {/* Right: Mode selector */}
      <div className="flex items-center gap-2">
        <span className="hidden text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:inline">
          View as
        </span>
        <div className="inline-flex items-center gap-1 rounded-full bg-muted/80 p-1">
          <button
            type="button"
            onClick={() => onModeChange("hungry", "need")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
              mode === "hungry"
                ? "bg-gradient-to-r from-hungry-start to-hungry-end text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            🍽️ Hungry
          </button>
          <button
            type="button"
            onClick={() => onModeChange("helper", "share")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
              mode === "helper"
                ? "bg-gradient-to-r from-full-start to-full-end text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            🤲 Helper
          </button>
          <button
            type="button"
            onClick={() => onModeChange("browse", "need")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
              mode === "browse"
                ? "bg-primary/90 text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            👀 Browse
          </button>
        </div>
      </div>
    </div>
  );
}
