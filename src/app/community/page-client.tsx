"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { CommunityPageClientProps } from "./types";
import { DiscoveryFiltersProvider } from "./discovery-context";
import { PostComposer } from "./components/composer";
import { EventsSection } from "./components/events-section";
import { PostFeed } from "./components/post-feed";
import { UtensilsCrossed, HandHeart, Plus, Sparkles, MapPin, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Community Page Client Component
 *
 * Events-first design with smart filtering based on user's needs
 */
export function CommunityPageClient(props: CommunityPageClientProps) {
  return (
    <DiscoveryFiltersProvider>
      <CommunityPageView {...props} />
    </DiscoveryFiltersProvider>
  );
}

function CommunityPageView({
  posts,
  initialEvents,
  hotItems,
  guideMoments,
  vibeStats,
  user,
}: CommunityPageClientProps) {
  const [activeMode, setActiveMode] = useState<"hungry" | "full" | null>(null);
  const [userLocation, setUserLocation] = useState<string | null>(null);

  const handleModeToggle = (mode: "hungry" | "full") => {
    setActiveMode(activeMode === mode ? null : mode);
  };

  // Detect user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // Reverse geocode to get readable location
          // For now, just use a placeholder - we can enhance this later
          setUserLocation("Your neighborhood");
        },
        () => {
          setUserLocation("Location unavailable");
        }
      );
    }
  }, []);

  // Calculate stats
  const sharesCount = posts.filter((p) => p.kind === "share").length;
  const requestsCount = posts.filter((p) => p.kind === "request").length;
  const eventsCount = initialEvents.length;

  // Determine which events/posts to show based on mode
  const eventMode = activeMode || undefined;
  const postMode = activeMode === "hungry" ? "hungry" : activeMode === "full" ? "helper" : "browse";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-4">
        {/* Page Header with Mode Toggles */}
        <div className="mb-4 flex items-center justify-between border-b border-border/40 pb-4">
          <h2 className="text-xl font-semibold text-foreground">Community</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleModeToggle("hungry")}
              className={cn(
                "flex items-center gap-2 rounded-xl border-2 px-4 py-2 font-medium transition-all",
                activeMode === "hungry"
                  ? "border-hungry-end bg-gradient-to-r from-hungry-start to-hungry-end text-white shadow-md"
                  : "border-border/60 bg-card hover:border-hungry-end/40 hover:bg-hungry-start/5"
              )}
            >
              <UtensilsCrossed className="h-4 w-4" />
              <span>I'm hungry</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeToggle("full")}
              className={cn(
                "flex items-center gap-2 rounded-xl border-2 px-4 py-2 font-medium transition-all",
                activeMode === "full"
                  ? "border-full-end bg-gradient-to-r from-full-start to-full-end text-white shadow-md"
                  : "border-border/60 bg-card hover:border-full-end/40 hover:bg-full-start/5"
              )}
            >
              <HandHeart className="h-4 w-4" />
              <span>I'm Full</span>
            </button>
          </div>
        </div>

        {/* Clean 2-Column: Location + Greeting | Urgency Card */}
        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_340px]">
          {/* Left: Location Bar + Friendly Greeting */}
          <div className="flex flex-col items-center justify-center space-y-3 text-center">
            {/* Location Badge */}
            <div className="inline-flex items-center gap-2 rounded-lg border border-border/40 bg-muted/30 px-3 py-1.5 text-sm">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium text-foreground">
                {userLocation || "Detecting location..."}
              </span>
              <button className="ml-1 text-xs text-primary hover:underline">
                Change
              </button>
            </div>

            {/* Friendly Greeting */}
            <div>
              <h3 className="font-serif text-2xl font-light text-foreground">
                Hey {user?.name?.split(" ")[0] || "there"}
                {activeMode === "hungry" && ", let's find you some food"}
                {activeMode === "full" && ", ready to make a difference"}
                {!activeMode && ", welcome back"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {!activeMode && "Select 'I'm hungry' or 'I'm Full' above to get started"}
                {activeMode === "hungry" && "Browse food resources and events below, or ask neighbors for help"}
                {activeMode === "full" && "Check out ways to volunteer and share with your community"}
              </p>
            </div>
          </div>

          {/* Right: Urgency Card */}
          <div>
            {activeMode === "hungry" && (
              <div className="rounded-xl border border-hungry-end/30 bg-gradient-to-br from-hungry-start/5 to-hungry-end/5 p-4">
                <h3 className="font-semibold text-hungry-end">Need help now?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  RSVP to food events below, or check the map for food banks open now.
                </p>
                <Button asChild size="sm" className="mt-3 w-full">
                  <Link href="/map">Find food nearby</Link>
                </Button>
              </div>
            )}

            {activeMode === "full" && (
              <div className="rounded-xl border border-full-end/30 bg-gradient-to-br from-full-start/5 to-full-end/5 p-4">
                <h3 className="font-semibold text-full-end">Ready to help?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  RSVP to volunteer events or host your own potluck to share food.
                </p>
                <Button asChild size="sm" className="mt-3 w-full">
                  <Link href="/community/events/new">Create an event</Link>
                </Button>
              </div>
            )}

            {!activeMode && (
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <h3 className="text-sm font-semibold text-muted-foreground">Today in your neighborhood</h3>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-2xl font-bold text-full-end">{sharesCount}</div>
                    <div className="text-xs text-muted-foreground">Available shares</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-hungry-end">{requestsCount}</div>
                    <div className="text-xs text-muted-foreground">Requests</div>
                  </div>
                </div>
                <div className="mt-3 border-t border-border/40 pt-3">
                  <div className="text-2xl font-bold text-primary">{eventsCount}</div>
                  <div className="text-xs text-muted-foreground">Upcoming events</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          {/* LEFT: Events + Posts */}
          <div className="flex flex-col gap-4">
            {/* Events Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">
                  {activeMode === "hungry" && "Food & resources near you"}
                  {activeMode === "full" && "Ways to help"}
                  {!activeMode && "Upcoming events"}
                </h2>
                {activeMode === "full" && (
                  <Button asChild size="sm" className="rounded-full">
                    <Link href="/community/events/new">
                      <Plus className="mr-1.5 h-4 w-4" />
                      Host an event
                    </Link>
                  </Button>
                )}
                {!activeMode && (
                  <Button asChild variant="ghost" size="sm" className="rounded-full">
                    <Link href="/community/events/calendar">View calendar</Link>
                  </Button>
                )}
              </div>
              <EventsSection initialEvents={initialEvents} mode={eventMode} />
            </div>

            {/* Composer (when mode is active) */}
            {activeMode && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {activeMode === "hungry" ? "Ask neighbors for help" : "Offer to help neighbors"}
                </h3>
                <PostComposer
                  defaultIntent={activeMode === "hungry" ? "need" : "share"}
                  hideIntentToggle
                />
              </div>
            )}

            {/* Community Posts */}
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-foreground">Community chat</h2>
              <PostFeed posts={posts} mode={postMode} />
            </div>
          </div>

          {/* RIGHT: Mini Map + Stats + Hot Items */}
          <div className="flex flex-col gap-4">
            {/* Mini Map (TODO: implement) - Now at top */}
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Nearby resources</h3>
              <div className="flex aspect-video items-center justify-center rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">Mini map loading...</p>
              </div>
              <Button asChild size="sm" variant="outline" className="mt-3 w-full">
                <Link href="/map">View full map</Link>
              </Button>
            </div>

            {/* Compact stats card (only when no mode active) */}
            {!activeMode && (
              <div className="rounded-xl border border-border/60 bg-card p-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xl font-bold text-full-end">{sharesCount}</div>
                    <div className="text-xs text-muted-foreground">Shares</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-hungry-end">{requestsCount}</div>
                    <div className="text-xs text-muted-foreground">Requests</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-primary">{eventsCount}</div>
                    <div className="text-xs text-muted-foreground">Events</div>
                  </div>
                </div>
              </div>
            )}

            {/* Hot items */}
            {hotItems.length > 0 && (
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Tonight's hot dishes
                </h3>
                <div className="mt-3 space-y-2">
                  {hotItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="text-sm">
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.host} • {item.until}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
