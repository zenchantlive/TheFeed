"use client";

import type { PostIntent } from "../../types";
import { ACTIONS } from "./actions";
import { ActionTile } from "./action-tile";

type ActionTilesProps = {
  onSelectAction: (intent: PostIntent) => void;
};

/**
 * Action Tiles Grid
 *
 * Primary CTAs for community interaction.
 * Bulletin board cards with pushpins - most prominent feature above the fold.
 */
export function ActionTiles({ onSelectAction }: ActionTilesProps) {
  const handleActionSelect = (intent: "need" | "share" | "volunteer" | "other") => {
    // Map volunteer/other to appropriate post intent
    let postIntent: PostIntent;
    if (intent === "volunteer" || intent === "other") {
      postIntent = "share"; // Volunteer and ride sharing are offers
    } else {
      postIntent = intent as PostIntent;
    }

    onSelectAction(postIntent);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          Quick Actions
        </h2>
        <span className="text-xs text-slate-500 dark:text-slate-500">
          Choose what you&apos;d like to do
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
        {ACTIONS.map((action) => (
          <ActionTile
            key={action.id}
            {...action}
            onSelect={handleActionSelect}
          />
        ))}
      </div>
    </section>
  );
}
