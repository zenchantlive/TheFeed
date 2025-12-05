"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

/**
 * Map CTA Widget
 *
 * Call to action for viewing the map.
 * Simple pinned card style.
 */
export function MapCTAWidget() {
  return (
    <div className="rounded-xl border-2 border-emerald-200/60 bg-gradient-to-br from-emerald-50/90 to-teal-50/80 p-4 shadow-[0.125rem_0.1875rem_0.5rem_rgba(0,0,0,0.08)] dark:border-slate-700/60 dark:from-slate-800/90 dark:to-slate-800/80 dark:shadow-[0.125rem_0.1875rem_0.75rem_rgba(0,0,0,0.25)]">
      <p className="text-sm text-slate-700 dark:text-slate-300">
        Need a map view of these spots? Jump to the food map or ask the sous-chef.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild size="sm" className="rounded-full font-semibold shadow-md">
          <Link href="/map">
            <MapPin className="mr-1.5 h-4 w-4" />
            Map view
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="rounded-full border-2 font-semibold"
        >
          <Link href="/chat?prefill=Can%20you%20summarize%20today%27s%20community%20posts%20for%20me%3F">
            Ask AI for recap
          </Link>
        </Button>
      </div>
    </div>
  );
}
