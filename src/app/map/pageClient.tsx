"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import type { FoodBank } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import {
  DiscoveryFiltersProvider,
  useDiscoveryFilters,
} from "@/app/community/discovery-context";

type MapPageClientProps = {
  foodBanks: FoodBank[];
  services: string[];
};

type EnrichedFoodBank = FoodBank & {
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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

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
        if (!isMounted) return;
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
        if (controller.signal.aborted) return;
        console.error("Failed to fetch events for map:", error);
        if (isMounted) {
          setEvents([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchEvents();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [eventTypeFilter, dateRangeFilter]);

  return { events, isLoading };
}

function EventPopup({
  event,
  onClose,
}: {
  event: MapEventPin;
  onClose: () => void;
}) {
  return (
    <div className="fixed bottom-4 left-1/2 z-30 w-full max-w-md -translate-x-1/2 rounded-3xl border border-border/60 bg-card/95 p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
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
          Close
        </Button>
      </div>
      <div className="mt-4 flex justify-end">
        <Button asChild>
          <Link href={`/community/events/${event.id}`}>See details</Link>
        </Button>
      </div>
    </div>
  );
}

function MapPageView({ foodBanks, services }: MapPageClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [openNow, setOpenNow] = useState(false);
  const [maxDistance, setMaxDistance] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const {
    eventTypeFilter,
    dateRangeFilter,
    setEventTypeFilter,
    setDateRangeFilter,
  } = useDiscoveryFilters();
  const { events: mapEvents, isLoading: isLoadingEvents } = useMapEvents({
    eventTypeFilter,
    dateRangeFilter,
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
      const distance =
        userLocation !== null
          ? calculateDistance(
              userLocation,
              { lat: bank.latitude, lng: bank.longitude }
            )
          : null;

      return {
        ...bank,
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

  const handleSelectFoodBank = (id: string | null) => {
    setSelectedId(id);
    if (id) {
      setSelectedEventId(null);
    }
  };

  const handleSelectEvent = (id: string | null) => {
    setSelectedEventId(id);
    if (id) {
      setSelectedId(null);
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
        />
      </div>

      {selectedFoodBank ? (
        <LocationPopup
          isOpen
          onClose={() => setSelectedId(null)}
          foodBank={selectedFoodBank}
          distanceMiles={selectedFoodBank.distanceMiles}
          currentlyOpen={selectedFoodBank.isOpen}
        />
      ) : null}

      {selectedEvent ? (
        <EventPopup event={selectedEvent} onClose={() => setSelectedEventId(null)} />
      ) : null}
    </div>
  );
}
