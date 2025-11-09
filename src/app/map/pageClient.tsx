"use client";

import { useEffect, useMemo, useState } from "react";
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

type MapPageClientProps = {
  foodBanks: FoodBank[];
  services: string[];
};

type EnrichedFoodBank = FoodBank & {
  distanceMiles: number | null;
  isOpen: boolean;
};

export function MapPageClient({ foodBanks, services }: MapPageClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [openNow, setOpenNow] = useState(false);
  const [maxDistance, setMaxDistance] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  return (
    <div className="relative flex flex-col gap-4">
      <div className="sticky top-4 z-20">
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
      </div>

      <div className="relative h-[70vh] w-full">
        <MapView
          foodBanks={filteredFoodBanks}
          userLocation={userLocation}
          selectedFoodBankId={selectedId}
          onSelectFoodBank={setSelectedId}
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
    </div>
  );
}
