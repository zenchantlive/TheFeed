"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { addDays, format } from "date-fns";
import { MapSearchBar } from "@/components/map/MapSearchBar";
import { MapView } from "@/components/map/MapView";
import { LocationPopup } from "@/components/map/LocationPopup";
import {
  getUserLocation,
  calculateDistance,
  isCurrentlyOpen,
  type Coordinates,
} from "@/lib/geolocation";
import type { NormalizedResourceWithMeta } from "@/lib/resource-feed";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DiscoveryFiltersProvider,
  useDiscoveryFilters,
} from "@/app/community/discovery-context";

type MapPageClientProps = {
  foodBanks: NormalizedResourceWithMeta[];
  services: string[];
  isAdmin?: boolean;
};

type VerificationStatus = "unverified" | "community_verified" | "official" | "rejected" | "duplicate";

type EnrichedFoodBank = NormalizedResourceWithMeta & {
  verificationStatus: VerificationStatus;
  distanceMiles: number | null;
  isOpen: boolean;
};

type MapEventPin = {
  id: string;
  title: string;
  location: string;
  latitude: number;
  longitude: number;
  eventType: "potluck" | "volunteer";
  startTime: Date;
  rsvpCount: number;
  capacity: number | null;
  isVerified: boolean;
};

type MapPostPin = {
  id: string;
  content: string;
  kind: "share" | "request" | "update" | "resource";
  location: string | null;
  latitude: number;
  longitude: number;
  createdAt: Date;
  urgency?: string | null;
  author: {
    name: string;
    image: string | null;
  };
};

type EventApiResponseItem = {
  id: string;
  title: string;
  eventType: "potluck" | "volunteer";
  location: string;
  locationCoords: { lat: number; lng: number } | null;
  startTime: string;
  rsvpCount: number;
  capacity: number | null;
  isVerified: boolean;
};

type PostApiResponseItem = {
  id: string;
  content: string;
  kind: "share" | "request" | "update" | "resource";
  location: string | null;
  locationCoords: { lat: number; lng: number } | null;
  createdAt: string;
  urgency?: string | null;
  author: {
    name: string;
    image: string | null;
  };
};

export function MapPageClient(props: MapPageClientProps) {
  return (
    <DiscoveryFiltersProvider>
      <MapPageView {...props} />
    </DiscoveryFiltersProvider>
  );
}

function useMapEvents({
  eventTypeFilter,
  dateRangeFilter,
}: {
  eventTypeFilter: "all" | "potluck" | "volunteer";
  dateRangeFilter: "week" | "month";
}) {
  const [events, setEvents] = useState<MapEventPin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchEvents() {
      setIsLoading(true);
      const now = new Date();
      const rangeEnd = addDays(now, dateRangeFilter === "week" ? 7 : 30);
      const searchParams = new URLSearchParams({
        limit: "50",
        status: "upcoming",
        onlyUpcoming: "true",
        onlyWithCoords: "true",
        startAfter: now.toISOString(),
        startBefore: rangeEnd.toISOString(),
      });

      if (eventTypeFilter !== "all") {
        searchParams.set("eventType", eventTypeFilter);
      }

      try {
        const response = await fetch(`/api/events?${searchParams.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Failed to load events");
        }
        const data = await response.json();
        if (Array.isArray(data?.items)) {
          const mapped = (data.items as EventApiResponseItem[])
            .map((item) => {
              if (!item.locationCoords) return null;
              return {
                id: item.id,
                title: item.title,
                eventType: item.eventType,
                location: item.location,
                latitude: item.locationCoords.lat,
                longitude: item.locationCoords.lng,
                startTime: new Date(item.startTime),
                rsvpCount: item.rsvpCount,
                capacity: item.capacity,
                isVerified: item.isVerified,
              } satisfies MapEventPin;
            })
            .filter(Boolean) as MapEventPin[];
          setEvents(mapped);
        } else {
          setEvents([]);
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error("Failed to fetch events for map:", error);
          setEvents([]);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvents();

    return () => {
      controller.abort();
    };
  }, [eventTypeFilter, dateRangeFilter]);

  return { events, isLoading };
}

function useMapPosts({
  postKindFilter,
}: {
  postKindFilter: "all" | "share" | "request";
}) {
  const [posts, setPosts] = useState<MapPostPin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchPosts() {
      setIsLoading(true);
      const searchParams = new URLSearchParams({
        limit: "50",
        onlyWithCoords: "true",
        includeExpired: "false",
      });

      if (postKindFilter !== "all") {
        searchParams.set("kind", postKindFilter);
      }

      try {
        const response = await fetch(`/api/posts?${searchParams.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Failed to load posts");
        }
        const data = await response.json();
        if (Array.isArray(data?.items)) {
          const mapped = (data.items as PostApiResponseItem[])
            .map((item) => {
              if (!item.locationCoords) return null;
              return {
                id: item.id,
                content: item.content,
                kind: item.kind,
                location: item.location,
                latitude: item.locationCoords.lat,
                longitude: item.locationCoords.lng,
                createdAt: new Date(item.createdAt),
                urgency: item.urgency,
                author: item.author,
              } satisfies MapPostPin;
            })
            .filter(Boolean) as MapPostPin[];
          setPosts(mapped);
        } else {
          setPosts([]);
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error("Failed to fetch posts for map:", error);
          setPosts([]);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchPosts();

    return () => {
      controller.abort();
    };
  }, [postKindFilter]);

  return { posts, isLoading };
}

function EventPopup({
  event,
  onClose,
}: {
  event: MapEventPin;
  onClose: () => void;
}) {
  const [isRsvping, setIsRsvping] = useState(false);
  const [guestCount, setGuestCount] = useState(1);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [rsvpMessage, setRsvpMessage] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleQuickRsvp = async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsRsvping(true);
    setRsvpMessage("");

    try {
      const response = await fetch(`/api/events/${event.id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestCount }),
        signal: controller.signal,
      });

      const data = await response.json();

      if (response.ok) {
        setRsvpSuccess(true);
        setRsvpMessage(data.message || "RSVP confirmed!");
      } else {
        setRsvpMessage(data.error || "Failed to RSVP");
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setRsvpMessage("Failed to RSVP. Please try again.");
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsRsvping(false);
      }
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 z-30 w-full max-w-md -translate-x-1/2 rounded-3xl border border-border/60 bg-card/95 p-5 shadow-2xl backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {format(event.startTime, "EEEE, MMM d")}
          </div>
          <h3 className="mt-1 text-lg font-semibold text-foreground">
            {event.title}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {format(event.startTime, "h:mm a")}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {event.location}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {event.rsvpCount} attending
              {event.capacity && ` / ${event.capacity}`}
            </span>
          </div>
          <Badge
            variant="outline"
            className="mt-2 inline-flex text-[0.65rem]"
          >
            {event.eventType === "potluck" ? "🎉 Potluck" : "🤝 Volunteer"}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ×
        </Button>
      </div>

      {rsvpSuccess ? (
        <div className="mt-4 rounded-lg bg-primary/10 p-3 text-sm text-primary">
          ✓ {rsvpMessage}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <label htmlFor="guestCount" className="text-sm font-medium">
              Guests:
            </label>
            <select
              id="guestCount"
              value={guestCount}
              onChange={(e) => setGuestCount(parseInt(e.target.value))}
              className="rounded-lg border border-border bg-background px-3 py-1 text-sm"
              disabled={isRsvping}
            >
              {[1, 2, 3, 4, 5].map((count) => (
                <option key={count} value={count}>
                  {count} {count === 1 ? "person" : "people"}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleQuickRsvp}
              disabled={isRsvping}
              className="flex-1"
              size="sm"
            >
              {isRsvping ? "RSVPing..." : "Quick RSVP"}
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href={`/community/events/${event.id}`}>Full details</Link>
            </Button>
          </div>
          {rsvpMessage && !rsvpSuccess && (
            <p className="text-xs text-destructive">{rsvpMessage}</p>
          )}
        </div>
      )}
    </div>
  );
}

function PostPopup({
  post,
  onClose,
}: {
  post: MapPostPin;
  onClose: () => void;
}) {
  // Truncate content to first 150 characters
  const truncatedContent =
    post.content.length > 150
      ? post.content.substring(0, 150) + "..."
      : post.content;

  return (
    <div className="fixed bottom-4 left-1/2 z-30 w-full max-w-md -translate-x-1/2 rounded-3xl border border-border/60 bg-card/95 p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge
              variant="outline"
              className={cn(
                "text-[0.65rem]",
                post.kind === "share" && "border-full-end/40 bg-full-start/10 text-full-end",
                post.kind === "request" && "border-hungry-end/40 bg-hungry-start/10 text-hungry-end"
              )}
            >
              {post.kind === "share" && "🍽️ Share"}
              {post.kind === "request" && "🙏 Request"}
              {post.kind === "update" && "📢 Update"}
              {post.kind === "resource" && "📍 Resource"}
            </Badge>
            {post.urgency && (
              <Badge variant="outline" className="text-[0.65rem]">
                {post.urgency === "asap" && "⚡ ASAP"}
                {post.urgency === "today" && "📅 Today"}
                {post.urgency === "this_week" && "📆 This week"}
              </Badge>
            )}
          </div>
          <p className="mt-2 text-sm text-foreground">{truncatedContent}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            {post.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {post.location}
              </span>
            )}
            <span>•</span>
            <span>by {post.author.name}</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="mt-4 flex justify-end">
        <Button asChild variant="secondary">
          <Link href="/community">View in community</Link>
        </Button>
      </div>
    </div>
  );
}

function MapPageView({ foodBanks, services, isAdmin }: MapPageClientProps) {
  const searchParams = useSearchParams();

  // Read URL params for initial state
  const initialFoodBankId = searchParams.get("foodBankId");
  const initialEventId = searchParams.get("eventId");
  const initialPostId = searchParams.get("postId");
  const initialEventType = searchParams.get("eventType") as "all" | "potluck" | "volunteer" | null;
  const initialPostKind = searchParams.get("postKind") as "all" | "share" | "request" | null;

  const [searchTerm, setSearchTerm] = useState("");
  const [openNow, setOpenNow] = useState(false);
  const [maxDistance, setMaxDistance] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(initialFoodBankId);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(initialEventId);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(initialPostId);
  const [postKindFilter, setPostKindFilter] = useState<"all" | "share" | "request">(initialPostKind || "all");
  const {
    eventTypeFilter,
    dateRangeFilter,
    setEventTypeFilter,
    setDateRangeFilter,
  } = useDiscoveryFilters();

  // Set event type filter from URL param on mount
  useEffect(() => {
    if (initialEventType && ["all", "potluck", "volunteer"].includes(initialEventType)) {
      setEventTypeFilter(initialEventType);
    }
  }, [initialEventType, setEventTypeFilter]);
  const { events: mapEvents, isLoading: isLoadingEvents } = useMapEvents({
    eventTypeFilter,
    dateRangeFilter,
  });
  const { posts: mapPosts, isLoading: isLoadingPosts } = useMapPosts({
    postKindFilter,
  });

  useEffect(() => {
    setIsLocating(true);
    getUserLocation()
      .then((location) => {
        setUserLocation(location);
        setLocationError(null);
      })
      .catch((error: Error) => {
        setLocationError(error.message);
      })
      .finally(() => setIsLocating(false));
  }, []);

  const requestLocation = async () => {
    setIsLocating(true);
    try {
      const location = await getUserLocation();
      setUserLocation(location);
      setLocationError(null);
    } catch (error) {
      setLocationError(
        error instanceof Error ? error.message : "Unable to fetch location."
      );
    } finally {
      setIsLocating(false);
    }
  };

  const enrichedFoodBanks = useMemo<EnrichedFoodBank[]>(() => {
    return foodBanks.map((bank) => {
      const hours = bank.hours ?? null;
      const verificationStatus = (bank.verificationStatus ?? "unverified") as VerificationStatus;
      const distance =
        userLocation !== null
          ? calculateDistance(
              userLocation,
              { lat: bank.latitude, lng: bank.longitude }
            )
          : null;

      return {
        ...bank,
        verificationStatus,
        distanceMiles: distance,
        isOpen: hours ? isCurrentlyOpen(hours) : false,
      };
    });
  }, [foodBanks, userLocation]);

  const filteredFoodBanks = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const service = selectedService?.toLowerCase();

    return enrichedFoodBanks.filter((bank) => {
      const matchesSearch =
        term.length === 0 ||
        bank.name.toLowerCase().includes(term) ||
        bank.city.toLowerCase().includes(term) ||
        bank.address.toLowerCase().includes(term) ||
        (bank.services ?? []).some((svc) =>
          svc.toLowerCase().includes(term)
        );

      if (!matchesSearch) return false;

      if (openNow && !bank.isOpen) return false;

      if (service) {
        const bankServices = bank.services?.map((svc) => svc.toLowerCase()) ?? [];
        if (!bankServices.includes(service)) {
          return false;
        }
      }

      if (maxDistance !== null && bank.distanceMiles !== null) {
        if (bank.distanceMiles > maxDistance) return false;
      }

      return true;
    });
  }, [enrichedFoodBanks, searchTerm, openNow, selectedService, maxDistance]);

  const selectedFoodBank =
    enrichedFoodBanks.find((bank) => bank.id === selectedId) ?? null;
  const selectedEvent = mapEvents.find((event) => event.id === selectedEventId) ?? null;
  const selectedPost = mapPosts.find((post) => post.id === selectedPostId) ?? null;

  const handleSelectFoodBank = (id: string | null) => {
    setSelectedId(id);
    if (id) {
      setSelectedEventId(null);
      setSelectedPostId(null);
    }
  };

  const handleSelectEvent = (id: string | null) => {
    setSelectedEventId(id);
    if (id) {
      setSelectedId(null);
      setSelectedPostId(null);
    }
  };

  const handleSelectPost = (id: string | null) => {
    setSelectedPostId(id);
    if (id) {
      setSelectedId(null);
      setSelectedEventId(null);
    }
  };

  return (
    <div className="relative flex flex-col gap-4">
      <div className="sticky top-4 z-20 space-y-3 rounded-3xl border border-border/60 bg-card/95 p-4 shadow-sm">
        <MapSearchBar
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          openNow={openNow}
          onToggleOpenNow={() => setOpenNow((prev) => !prev)}
          maxDistance={maxDistance}
          onDistanceChange={setMaxDistance}
          services={services}
          selectedService={selectedService}
          onServiceChange={setSelectedService}
          onUseLocation={requestLocation}
          isLocating={isLocating}
          locationError={locationError}
        />
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Event filters
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {["all", "potluck", "volunteer"].map((type) => (
              <Button
                key={type}
                size="sm"
                variant={eventTypeFilter === type ? "default" : "secondary"}
                className="rounded-full"
                onClick={() =>
                  setEventTypeFilter(type as typeof eventTypeFilter)
                }
              >
                {type === "all"
                  ? "All"
                  : type === "potluck"
                  ? "Potluck"
                  : "Volunteer"}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {["week", "month"].map((range) => (
              <Button
                key={range}
                size="sm"
                variant={dateRangeFilter === range ? "default" : "secondary"}
                className="rounded-full"
                onClick={() =>
                  setDateRangeFilter(range as typeof dateRangeFilter)
                }
              >
                {range === "week" ? "This week" : "This month"}
              </Button>
            ))}
            {isLoadingEvents && (
              <span className="text-xs text-muted-foreground">
                Loading events…
              </span>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Community posts
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {["all", "share", "request"].map((kind) => (
              <Button
                key={kind}
                size="sm"
                variant={postKindFilter === kind ? "default" : "secondary"}
                className="rounded-full"
                onClick={() =>
                  setPostKindFilter(kind as typeof postKindFilter)
                }
              >
                {kind === "all" && "All posts"}
                {kind === "share" && "🍽️ Shares"}
                {kind === "request" && "🙏 Requests"}
              </Button>
            ))}
            {isLoadingPosts && (
              <span className="text-xs text-muted-foreground">
                Loading posts…
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="relative h-[70vh] w-full">
        <MapView
          foodBanks={filteredFoodBanks}
          userLocation={userLocation}
          selectedFoodBankId={selectedId}
          onSelectFoodBank={handleSelectFoodBank}
          events={mapEvents}
          selectedEventId={selectedEventId}
          onSelectEvent={handleSelectEvent}
          posts={mapPosts}
          selectedPostId={selectedPostId}
          onSelectPost={handleSelectPost}
        />
      </div>

      {selectedFoodBank ? (
        <LocationPopup
          isOpen
          onClose={() => setSelectedId(null)}
          foodBank={selectedFoodBank}
          distanceMiles={selectedFoodBank.distanceMiles}
          currentlyOpen={selectedFoodBank.isOpen}
          isAdmin={isAdmin}
        />
      ) : null}

      {selectedEvent ? (
        <EventPopup event={selectedEvent} onClose={() => setSelectedEventId(null)} />
      ) : null}

      {selectedPost ? (
        <PostPopup post={selectedPost} onClose={() => setSelectedPostId(null)} />
      ) : null}
    </div>
  );
}
