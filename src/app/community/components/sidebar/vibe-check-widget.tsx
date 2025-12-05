"use client";

import { Sparkles } from "lucide-react";
import type { VibeStat } from "../../types";

type VibeCheckWidgetProps = {
  stats: VibeStat[];
};

/**
 * Vibe Check Widget
 *
 * Shows community stats and activity metrics.
 * Chalkboard-inspired for dark, bulletin for light.
 */
export function VibeCheckWidget({ stats }: VibeCheckWidgetProps) {
  return (
    <div className="rounded-xl border-2 border-purple-200/60 bg-gradient-to-br from-purple-50/90 to-pink-50/80 p-4 shadow-[0.125rem_0.1875rem_0.5rem_rgba(0,0,0,0.08)] dark:border-slate-700/60 dark:from-slate-800/90 dark:to-slate-800/80 dark:shadow-[0.125rem_0.1875rem_0.75rem_rgba(0,0,0,0.25)]">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-bold text-purple-900 dark:text-purple-100">
        <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        Vibe check
      </div>

      {/* Stats */}
      <div className="mt-4 grid gap-3">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="rounded-lg border-2 border-dashed border-purple-200/50 bg-white/70 p-3 text-sm shadow-sm dark:border-slate-700/50 dark:bg-slate-900/40"
          >
            <div className="text-3xl font-bold text-primary">{stat.value}</div>
            <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
              {stat.label}
            </p>
            {stat.description && (
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                {stat.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
