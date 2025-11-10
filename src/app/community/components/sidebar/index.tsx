"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Clock, Navigation2, ChefHat, ArrowRight, MapPin } from "lucide-react";
import type { HotItem, GuideMoment, VibeStat } from "../../types";

type CommunitySidebarProps = {
  hotItems: HotItem[];
  guideMoments: GuideMoment[];
  vibeStats: VibeStat[];
};

/**
 * Community Sidebar
 *
 * Collection of widgets showing hot items, guide tips, vibe stats, and map CTA.
 * Simplified, clean styling (removed bulletin board aesthetic).
 */
export function CommunitySidebar({
  hotItems,
  guideMoments,
  vibeStats,
}: CommunitySidebarProps) {
  return (
    <aside className="flex flex-col gap-4">
      {/* Hot Items */}
      <div className="rounded-3xl border border-border/60 bg-card/95 p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Sparkles className="h-5 w-5 text-accent-foreground" />
          Tonight&apos;s hot dishes
        </div>
        <div className="mt-4 space-y-4">
          {hotItems.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border/60 bg-secondary/60 p-4 text-sm">
              <p className="font-semibold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground">Hosted by {item.host}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
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

      {/* Guide Tips */}
      <div className="rounded-3xl border border-border/60 bg-card/95 p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ChefHat className="h-5 w-5 text-primary" />
          Guide tips
        </div>
        <div className="mt-4 space-y-4 text-sm text-muted-foreground">
          {guideMoments.map((moment) => (
            <div key={moment.id} className="space-y-2 rounded-2xl border border-border/60 bg-muted/30 p-4">
              <p className="font-semibold text-foreground">{moment.guide}</p>
              <p>{moment.tip}</p>
              <Button asChild variant="link" className="px-0 text-primary">
                <Link href={moment.href} className="inline-flex items-center gap-1">
                  {moment.linkLabel}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Vibe Check */}
      <div className="rounded-3xl border border-border/60 bg-card/95 p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Sparkles className="h-5 w-5 text-primary" />
          Vibe check
        </div>
        <div className="mt-4 grid gap-3">
          {vibeStats.map((stat) => (
            <div key={stat.id} className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-3 text-sm">
              <div className="text-2xl font-semibold text-primary">{stat.value}</div>
              <p className="text-sm font-medium text-foreground">{stat.label}</p>
              {stat.description && (
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Map CTA */}
      <div className="rounded-3xl border border-border/60 bg-card/95 p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Need a map view of these spots? Jump to the food map or ping the sous-chef.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild size="sm" className="rounded-full">
            <Link href="/map">
              <MapPin className="mr-1.5 h-4 w-4" />
              Map view
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/chat?prefill=Can%20you%20summarize%20today%27s%20community%20posts%20for%20me%3F">
              Ask AI for recap
            </Link>
          </Button>
        </div>
      </div>
    </aside>
  );
}
