"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChefHat, ArrowRight } from "lucide-react";
import type { GuideMoment } from "../../types";

type GuideTipsWidgetProps = {
  tips: GuideMoment[];
};

/**
 * Guide Tips Widget
 *
 * Shows community guide tips and resources.
 * Pinned card style.
 */
export function GuideTipsWidget({ tips }: GuideTipsWidgetProps) {
  return (
    <div className="rounded-xl border-2 border-blue-200/60 bg-gradient-to-br from-blue-50/90 to-sky-50/80 p-4 shadow-[0.125rem_0.1875rem_0.5rem_rgba(0,0,0,0.08)] dark:border-slate-700/60 dark:from-slate-800/90 dark:to-slate-800/80 dark:shadow-[0.125rem_0.1875rem_0.75rem_rgba(0,0,0,0.25)]">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-bold text-blue-900 dark:text-blue-100">
        <ChefHat className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        Guide tips
      </div>

      {/* Tips */}
      <div className="mt-4 space-y-3 text-sm">
        {tips.map((moment) => (
          <div
            key={moment.id}
            className="space-y-2 rounded-lg border-2 border-blue-200/40 bg-white/70 p-3 shadow-sm dark:border-slate-700/40 dark:bg-slate-900/40"
          >
            <p className="font-bold text-slate-900 dark:text-slate-100">
              {moment.guide}
            </p>
            <p className="text-slate-700 dark:text-slate-300">{moment.tip}</p>
            <Button asChild variant="link" className="h-auto p-0 text-xs text-primary">
              <Link href={moment.href} className="inline-flex items-center gap-1 font-semibold">
                {moment.linkLabel}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
