"use client";

import { Sparkles, Clock, Navigation2 } from "lucide-react";
import type { HotItem } from "../../types";

type HotItemsWidgetProps = {
  items: HotItem[];
};

/**
 * Hot Items Widget
 *
 * Shows tonight's hot dishes.
 * Sticky note style cards.
 */
export function HotItemsWidget({ items }: HotItemsWidgetProps) {
  return (
    <div className="rounded-xl border-2 border-yellow-200/60 bg-gradient-to-br from-yellow-50/90 to-amber-50/80 p-4 shadow-[0.125rem_0.1875rem_0.5rem_rgba(0,0,0,0.08)] dark:border-slate-700/60 dark:from-slate-800/90 dark:to-slate-800/80 dark:shadow-[0.125rem_0.1875rem_0.75rem_rgba(0,0,0,0.25)]">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-100">
        <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        Tonight&apos;s hot dishes
      </div>

      {/* Items */}
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border-2 border-amber-200/40 bg-white/70 p-3 text-sm shadow-sm dark:border-slate-700/40 dark:bg-slate-900/40"
          >
            <p className="font-bold text-slate-900 dark:text-slate-100">{item.title}</p>
            <p className="text-xs text-slate-700 dark:text-slate-300">
              Hosted by {item.host}
            </p>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {item.until}
              </span>
              <span className="flex items-center gap-1">
                <Navigation2 className="h-3 w-3" /> {item.distance}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
