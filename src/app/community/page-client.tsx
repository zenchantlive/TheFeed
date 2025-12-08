"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { CommunityPageClientProps } from "./types";
import { DiscoveryFiltersProvider } from "./discovery-context";
import { PostComposer } from "./components/composer";
import { EventsSection } from "./components/events-section";
import { PostFeed } from "./components/post-feed";
import { LocationDialog } from "./components/location-dialog";
import { ResourcesNearYou } from "./components/resources-near-you";
import { ScannerNotification } from "@/components/discovery/scanner-notification";
import { UtensilsCrossed, HandHeart, MapPin } from "lucide-react";
import { MiniMap } from "./components/mini-map";
import { cn, calculateDistance, formatDistance } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { EventCreationWizard } from "@/components/events/event-creation-wizard";
import { HostEventButton } from "./components/host-event-button";
import { useSearchParams } from "next/navigation";
import { useAuthModal } from "@/components/auth/auth-modal-context";

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
  user,
}: CommunityPageClientProps) {
  const searchParams = useSearchParams();

  // Initialize state from URL params if available (from onboarding)
  const paramIntent = searchParams.get("intent");
  const paramLat = searchParams.get("lat");
  const paramLng = searchParams.get("lng");
  const paramZip = searchParams.get("zip");

  const initialMode = paramIntent === "need" ? "hungry" :
    (paramIntent === "share" || paramIntent === "volunteer") ? "full" : null;

  const [activeMode, setActiveMode] = useState<"hungry" | "full" | null>(initialMode);
  const [userLocation, setUserLocation] = useState<string | null>(paramZip ? `Zip ${paramZip}` : null);
  const [userState, setUserState] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(
    paramLat && paramLng ? { lat: parseFloat(paramLat), lng: parseFloat(paramLng) } : null
  );
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const { openLogin } = useAuthModal();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleHostEventClick = () => {
    if (!user) {
      openLogin();
      return;
    }
    setIsEventModalOpen(true);
  };

  const closeEventModal = () => setIsEventModalOpen(false);

  const handleModeToggle = (mode: "hungry" | "full") => {
    setActiveMode(activeMode === mode ? null : mode);
  };

  const handleLocationChange = (city: string, state: string, coords?: { lat: number; lng: number }) => {
    setUserLocation(city);
    setUserState(state);
    if (coords) {
      setUserCoords(coords);
    }
  };

  // Detect user location on mount
  useEffect(() => {
    const controller = new AbortController();

    const detectLocation = async () => {
      // If we already have coordinates (e.g. from Onboarding redirect), prioritize those
      if (userCoords) {
        // Optionally verify city name from coords if missing
        if (!userLocation || userLocation.startsWith("Zip")) {
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userCoords.lat}&lon=${userCoords.lng}&zoom=14`,
              { headers: { "User-Agent": "TheFeed Community App" }, signal: controller.signal }
            );
            if (response.ok) {
              const data = await response.json();
              const locName = data.address?.neighbourhood || data.address?.city || data.address?.town || "Your area";
              setUserLocation(locName);
            }
          } catch { /* ignore */ }
        }
        return;
      }

      // Try IP-based geolocation first (works on localhost)
      try {
        const ipResponse = await fetch("https://ipapi.co/json/", {
          signal: controller.signal,
        });
        const ipData = await ipResponse.json();

        if (ipData.city) {
          setUserLocation(ipData.city);

          // Use coordinates from IP API if available
          if (ipData.latitude && ipData.longitude) {
            setUserCoords({
              lat: ipData.latitude,
              lng: ipData.longitude
            });
          } else {
            // Fallback: Try to get coordinates for this city
            try {
              // Use Nominatim for consistency with the GPS fallback
              const geoRes = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(ipData.city)}&limit=1`,
                { headers: { "User-Agent": "TheFeed Community App" }, signal: controller.signal }
              );
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                if (geoData && geoData.length > 0) {
                  setUserCoords({
                    lat: parseFloat(geoData[0].lat),
                    lng: parseFloat(geoData[0].lon)
                  });
                }
              }
            } catch (e) {
              console.warn("Failed to geocode IP city", e);
            }
          }
          return;
        }
      } catch (error) {
        // IP geolocation failed or aborted, continue to GPS
        if ((error as Error).name === "AbortError") return;
      }

      // Fall back to GPS geolocation
      if (!navigator.geolocation) {
        setUserLocation("Set your location");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // Store user coordinates
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });

          try {
            // Use Nominatim (OpenStreetMap) for reverse geocoding
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=14`,
              {
                headers: {
                  "User-Agent": "TheFeed Community App",
                },
                signal: controller.signal,
              }
            );

            if (!response.ok) {
              throw new Error("Geocoding failed");
            }

            const data = await response.json();

            // Extract neighborhood, suburb, or city
            const location =
              data.address?.neighbourhood ||
              data.address?.suburb ||
              data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              "Your area";

            setUserLocation(location);
          } catch (error) {
            // Silent fail - just use default
            if ((error as Error).name !== "AbortError") {
              setUserLocation("Set your location");
            }
          }
        },
        () => {
          // User denied permission or geolocation failed (e.g., on localhost)
          setUserLocation("Set your location");
        },
        {
          timeout: 10000, // 10 second timeout
          enableHighAccuracy: false, // Faster, less battery intensive
        }
      );
    };



    detectLocation();

    // Cleanup: abort fetch requests if component unmounts
    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentional: run once on mount.

  // Calculate distances for posts when user coordinates are available
  const postsWithDistances = useMemo(() => {
    if (!userCoords) {
      return posts;
    }

    return posts.map((post) => {
      // If post has coordinates, calculate distance
      if (post.locationCoords) {
        const distance = calculateDistance(
          userCoords.lat,
          userCoords.lng,
          post.locationCoords.lat,
          post.locationCoords.lng
        );
        return {
          ...post,
          distance: formatDistance(distance),
        };
      }
      // Return post as-is if no coordinates
      return post;
    });
  }, [posts, userCoords]);

  // Calculate stats
  const sharesCount = postsWithDistances.filter((p) => p.kind === "share").length;
  const requestsCount = postsWithDistances.filter((p) => p.kind === "request").length;
  const eventsCount = initialEvents.length;

  // Determine which events/posts to show based on mode
  const eventMode = activeMode || undefined;
  const postMode = activeMode === "hungry" ? "hungry" : activeMode === "full" ? "helper" : "browse";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-4">
        {/* Page Header with Mode Toggles */}
        <div className="relative mb-4 flex flex-col gap-3 border-b border-border/40 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Community</h2>
            {/* Compact Mobile Banner for Active Modes */}
            {activeMode === "hungry" && (
              <div className="flex items-center gap-2 rounded-full bg-hungry-start/10 px-3 py-1 text-xs font-medium text-hungry-end sm:hidden">
                <span>Need help now?</span>
                <Button asChild size="sm" variant="link" className="h-auto p-0 text-xs font-bold text-hungry-end underline">
                  <Link href="/map">Find food</Link>
                </Button>
              </div>
            )}
            {activeMode === "full" && (
              <div className="flex items-center gap-2 rounded-full bg-full-start/10 px-3 py-1 text-xs font-medium text-full-end sm:hidden">
                <span>Ready to help?</span>
                <HostEventButton onClick={handleHostEventClick} className="h-auto p-0 text-xs font-bold text-full-end underline bg-transparent hover:bg-transparent shadow-none" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => handleModeToggle("hungry")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all sm:flex-none sm:px-4 sm:text-base",
                activeMode === "hungry"
                  ? "border-hungry-end bg-gradient-to-r from-hungry-start to-hungry-end text-white shadow-md"
                  : "border-border/60 bg-card hover:border-hungry-end/40 hover:bg-hungry-start/5"
              )}
            >
              <UtensilsCrossed className="h-4 w-4" />
              <span>I&apos;m hungry</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeToggle("full")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all sm:flex-none sm:px-4 sm:text-base",
                activeMode === "full"
                  ? "border-full-end bg-gradient-to-r from-full-start to-full-end text-white shadow-md"
                  : "border-border/60 bg-card hover:border-full-end/40 hover:bg-full-start/5"
              )}
            >
              <HandHeart className="h-4 w-4" />
              <span>I&apos;m Full</span>
            </button>
          </div>
        </div>

        {/* Clean 2-Column: Location + Greeting | Urgency Card */}
        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_21.25rem]">
          {/* Left: Location Bar + Friendly Greeting */}
          <div className="flex flex-col items-center justify-center space-y-3 text-center">
            {/* Location Badge */}
            <div className="inline-flex items-center gap-2 rounded-lg border border-border/40 bg-muted/30 px-3 py-1.5 text-sm">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium text-foreground">
                {userLocation || "Detecting location..."}
              </span>
              <LocationDialog
                currentLocation={userLocation}
                onLocationChange={handleLocationChange}
              />
            </div>

            {/* Friendly Greeting */}
            <div>
              <h3 className="font-serif text-2xl font-light text-foreground">
                Hey {user ? (user.name.split(" ")[0]) : "neighbor"}
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

          {/* Right: Urgency Card - Show on mobile too */}
          <div className="space-y-4">
            {/* Discovery Scanner - Only show if we have a valid location */}
            {userLocation && userLocation !== "Set your location" && (
              <ScannerNotification
                city={userLocation}
                state={userState || ""}
                className="w-full"
              />
            )}

            {/* Desktop-only Cards for Modes (Hidden on mobile as they are now in header) */}
            {activeMode === "hungry" && (
              <div className="hidden rounded-xl border border-hungry-end/30 bg-gradient-to-br from-hungry-start/5 to-hungry-end/5 p-4 sm:block">
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
              <div className="hidden rounded-xl border border-full-end/30 bg-gradient-to-br from-full-start/5 to-full-end/5 p-4 sm:block">
                <h3 className="font-semibold text-full-end">Ready to help?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  RSVP to volunteer events or host your own potluck to share food.
                </p>
                <div className="mt-3">
                  <HostEventButton onClick={handleHostEventClick} className="w-full" />
                </div>
              </div>
            )}

            {!activeMode && (
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <h3 className="text-sm font-semibold text-muted-foreground">Today in your neighborhood</h3>
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-2">
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
        <div className="grid gap-4 lg:grid-cols-[1fr_21.25rem]">
          {/* LEFT: Events + Posts */}
          <div className="flex flex-col gap-4">
            {/* Resources Near You - Hide when in "I'm Full" mode */}
            {activeMode !== "full" && <ResourcesNearYou userCoords={userCoords} />}

            {/* Events Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">
                  {activeMode === "hungry" && "Food Distributions & Events"}
                  {activeMode === "full" && "Ways to help"}
                  {!activeMode && "Upcoming events"}
                </h2>
                {activeMode === "full" && (
                  <HostEventButton onClick={handleHostEventClick} variant="minimal" />
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
                {user ? (
                  <PostComposer
                    defaultIntent={activeMode === "hungry" ? "need" : "share"}
                    hideIntentToggle
                  />
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center">
                    <p className="mb-3 text-sm text-muted-foreground">
                      Sign in to {activeMode === "hungry" ? "ask for help" : "offer help"} and connect with your neighbors.
                    </p>
                    <Button onClick={() => openLogin()}>
                      Sign in to Post
                    </Button>
                  </div>
                )}

              </div>
            )}

            {/* Community Posts */}
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-foreground">Community chat</h2>
              <PostFeed posts={postsWithDistances} mode={postMode} isLoggedIn={!!user} />
            </div>
          </div>

          {/* RIGHT: Mini Map + Stats + Hot Items */}
          <div className="flex flex-col gap-4">
            {/* Mini Map - Now at top */}
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Nearby resources</h3>
              <MiniMap
                userCoords={userCoords}
                className="aspect-video w-full rounded-lg border border-border/40"
              />
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
          </div>
        </div>
      </div>

      {/* Event Creation Modal */}
      {isDesktop ? (
        <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Host an Event</DialogTitle>
            </DialogHeader>
            <EventCreationWizard onClose={closeEventModal} />
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader className="text-left">
              <DrawerTitle>Host an Event</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-8 overflow-y-auto">
              <EventCreationWizard onClose={closeEventModal} />
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
