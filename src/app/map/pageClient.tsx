"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MapSearchBar } from "@/components/map/MapSearchBar";
import { MapView } from "@/components/map/MapView";

import { LocationCard } from "@/components/foodshare/location-card";
import { SidebarResourceDetail } from "@/components/map/SidebarResourceDetail";
import {
  getUserLocation,
  calculateDistance,
  isCurrentlyOpen,
  type Coordinates,
} from "@/lib/geolocation";
import type { NormalizedResourceWithMeta } from "@/lib/resource-feed";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DiscoveryFiltersProvider,
  useDiscoveryFilters,
} from "@/app/community/discovery-context";
import type { Source } from "@/components/foodshare/sources-section";

// Imported Hooks and Components
import { useMapEvents } from "@/hooks/use-map-data";
import { EventPopup, PostPopup } from "@/components/map/MapPopups";
import { MapFilterSection } from "@/components/map/MapFilterSection";

// --- Types ---

type MapPageClientProps = {
  foodBanks: NormalizedResourceWithMeta[];
  services: string[];
  isAdmin?: boolean;
};

type VerificationStatus = "unverified" | "community_verified" | "official" | "rejected" | "duplicate";

type EnrichedFoodBank = Omit<NormalizedResourceWithMeta, "phone" | "website" | "description"> & {
  phone: string | null;
  website: string | null;
  description: string | null;
  verificationStatus: VerificationStatus;
  lastVerified: Date | null;
  distanceMiles: number | null;
  isOpen: boolean;
  sources?: Source[];
};

// --- Main Component ---

export function MapPageClient(props: MapPageClientProps) {
  return (
    <DiscoveryFiltersProvider>
      <MapPageView {...props} />
    </DiscoveryFiltersProvider>
  );
}

// --- View Component ---

function MapPageView({ foodBanks, services, isAdmin }: MapPageClientProps) {
  const searchParams = useSearchParams();

  // 1. Initialize State from URL Parameters
  const initialFoodBankId = searchParams.get("foodBankId") || searchParams.get("resource");
  const initialEventId = searchParams.get("eventId");
  const initialPostId = searchParams.get("postId");
  const initialEventType = searchParams.get("eventType") as "all" | "potluck" | "volunteer" | null;

  // 2. Local State Management
  const [searchTerm, setSearchTerm] = useState("");
  const [openNow, setOpenNow] = useState(false);
  const [maxDistance, setMaxDistance] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Selection State
  const [selectedId, setSelectedId] = useState<string | null>(initialFoodBankId);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(initialEventId);
  const [, setSelectedPostId] = useState<string | null>(initialPostId); // selectedPostId unused - posts feature disabled
  const [viewMode, setViewMode] = useState<"list" | "map">("map");

  // Filter State
  const {
    eventTypeFilter,
    dateRangeFilter,
    setEventTypeFilter,
    setDateRangeFilter,
  } = useDiscoveryFilters();

  // 3. Effects

  // Sync event type filter with URL on mount
  useEffect(() => {
    if (initialEventType && ["all", "potluck", "volunteer"].includes(initialEventType)) {
      setEventTypeFilter(initialEventType);
    }
  }, [initialEventType, setEventTypeFilter]);

  // Fetch Events and Posts using custom hooks
  const { events: mapEvents, isLoading: isLoadingEvents } = useMapEvents({
    eventTypeFilter,
    dateRangeFilter,
  });
  // const { posts: mapPosts } = useMapPosts({
  //   postKindFilter,
  // });

  // Get User Location on Mount
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

  // 4. Helper Functions

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

  // 5. Data Processing (Memoized)

  // Enrich food banks with distance and status
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

      const sources: Source[] = [];

      if (bank.provenance?.sources && bank.provenance.sources.length > 0) {
        bank.provenance.sources.forEach(url => {
          sources.push({
            type: "aggregator",
            label: "External Source",
            url: url,
          });
        });
      }

      return {
        ...bank,
        phone: bank.phone ?? null,
        website: bank.website ?? null,
        description: bank.description ?? null,
        verificationStatus,
        lastVerified: bank.lastVerified,
        distanceMiles: distance,
        isOpen: hours ? isCurrentlyOpen(hours) : false,
        sources,
      };
    });
  }, [foodBanks, userLocation]);

  // Filter food banks based on search, service, distance, etc.
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

  // Identify selected items
  const selectedFoodBank =
    enrichedFoodBanks.find((bank) => bank.id === selectedId) ?? null;
  const selectedEvent = mapEvents.find((event) => event.id === selectedEventId) ?? null;
  // Posts feature temporarily disabled
  const selectedPost = null; // TODO: Re-enable when useMapPosts is implemented

  // Selection Handlers (Mutually Exclusive)
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



  // 6. Render

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
      {/* Mobile Header: Search, Filters, View Toggle (Always Visible on Mobile) */}
      <div className="flex flex-col gap-2 border-b border-border/60 bg-background p-2 lg:hidden">
        {/* Compact Search Bar */}
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
          className="rounded-xl p-2 shadow-sm"
        />

        {/* Additional Filters (Collapsible) */}
        {!selectedFoodBank && (
          <div className="overflow-x-auto pb-1">
            <MapFilterSection
              eventTypeFilter={eventTypeFilter}
              setEventTypeFilter={setEventTypeFilter}
              dateRangeFilter={dateRangeFilter}
              setDateRangeFilter={setDateRangeFilter}
              isLoadingEvents={isLoadingEvents}
            />
          </div>
        )}

        {/* View Toggle */}
        <div className="grid w-full grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "rounded-md py-1.5 text-sm font-medium transition-all",
              viewMode === "list"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            List
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={cn(
              "rounded-md py-1.5 text-sm font-medium transition-all",
              viewMode === "map"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Map
          </button>
        </div>
      </div>

      {/* Sidebar - Desktop: Left Panel, Mobile: List Content Only */}
      <div
        className={cn(
          "flex w-full flex-col gap-4 border-r border-border/60 bg-background lg:w-96 lg:overflow-y-auto lg:p-4",
          // Mobile: Show only if list mode. Desktop: Always flex.
          viewMode === "list" ? "flex flex-1 overflow-y-auto p-4" : "hidden lg:flex"
        )}
      >
        {/* Desktop Header (Hidden on Mobile) */}
        <div className="hidden space-y-3 rounded-3xl border border-border/60 bg-card/50 p-4 shadow-sm lg:block">
          {/* Search Bar & Main Filters */}
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

          {/* Additional Filters (Events) - Hidden when a resource is selected */}
          {!selectedFoodBank && (
            <MapFilterSection
              eventTypeFilter={eventTypeFilter}
              setEventTypeFilter={setEventTypeFilter}
              dateRangeFilter={dateRangeFilter}
              setDateRangeFilter={setDateRangeFilter}
              isLoadingEvents={isLoadingEvents}
            />
          )}
        </div>

        {/* Sidebar Content: Resource List OR Detailed View */}
        <div className="space-y-4">
          {selectedFoodBank ? (
            <SidebarResourceDetail
              foodBank={selectedFoodBank}
              distanceMiles={selectedFoodBank.distanceMiles}
              currentlyOpen={selectedFoodBank.isOpen}
              onBack={() => setSelectedId(null)}
              isAdmin={isAdmin}
            />
          ) : (
            <>
              <h2 className="text-sm font-semibold text-muted-foreground">
                {filteredFoodBanks.length} Resources Found
              </h2>
              <div className="space-y-3">
                {filteredFoodBanks.map((bank) => (
                  <div
                    key={bank.id}
                    onClick={() => handleSelectFoodBank(bank.id)}
                    className={cn(
                      "cursor-pointer transition-all hover:scale-[1.01]",
                      selectedId === bank.id && "ring-2 ring-primary"
                    )}
                  >
                    <LocationCard
                      location={bank}
                      isOpen={bank.isOpen}
                      distanceMiles={bank.distanceMiles ?? undefined}
                      className="border-border/60 hover:border-primary/50"
                      actionSlot={
                        <Button size="sm" variant="secondary" className="w-full" asChild>
                          <Link href={`/resources/${bank.id}`}>View Details</Link>
                        </Button>
                      }
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div
        className={cn(
          "relative h-full flex-1 lg:h-full",
          viewMode === "list" ? "hidden lg:block" : "block"
        )}
      >
        <MapView
          foodBanks={filteredFoodBanks}
          userLocation={userLocation}
          selectedFoodBankId={selectedId}
          onSelectFoodBank={handleSelectFoodBank}
          events={mapEvents}
          selectedEventId={selectedEventId}
          onSelectEvent={handleSelectEvent}
          posts={[]} // Posts hidden from map as per user request
          selectedPostId={null}
          onSelectPost={() => { }}
        />

        {/* Popups for Events and Posts (Resources use Sidebar) */}
        {selectedEvent ? (
          <EventPopup event={selectedEvent} onClose={() => setSelectedEventId(null)} />
        ) : null}

        {selectedPost ? (
          <PostPopup post={selectedPost} onClose={() => setSelectedPostId(null)} />
        ) : null}
      </div>
    </div>
  );
}
