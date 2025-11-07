"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Map, {
  Marker,
  NavigationControl,
  ViewState,
  GeolocateControl,
} from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin, LocateFixed } from "lucide-react";
import type { Coordinates } from "@/lib/geolocation";
import { cn } from "@/lib/utils";

type FoodBankOnMap = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  services: string[] | null;
  phone: string | null;
  website: string | null;
  description: string | null;
  hours: Record<string, { open: string; close: string; closed?: boolean }> | null;
  distanceMiles?: number | null;
  isOpen?: boolean;
};

type MapViewProps = {
  foodBanks: FoodBankOnMap[];
  userLocation: Coordinates | null;
  selectedFoodBankId: string | null;
  onSelectFoodBank: (id: string | null) => void;
};

const MAPBOX_STYLE = "mapbox://styles/mapbox/streets-v12";

export function MapView({
  foodBanks,
  userLocation,
  selectedFoodBankId,
  onSelectFoodBank,
}: MapViewProps) {
  const [viewState, setViewState] = useState<ViewState | null>(null);

  useEffect(() => {
    if (!viewState) {
      const initial: ViewState = userLocation
        ? {
            latitude: userLocation.lat,
            longitude: userLocation.lng,
            zoom: 12,
            bearing: 0,
            pitch: 0,
            padding: { top: 0, bottom: 0, left: 0, right: 0 },
          }
        : foodBanks.length > 0
        ? {
            latitude: foodBanks[0].latitude,
            longitude: foodBanks[0].longitude,
            zoom: 11,
            bearing: 0,
            pitch: 0,
            padding: { top: 0, bottom: 0, left: 0, right: 0 },
          }
        : {
            latitude: 37.7749,
            longitude: -122.4194,
            zoom: 10,
            bearing: 0,
            pitch: 0,
            padding: { top: 0, bottom: 0, left: 0, right: 0 },
          };
      setViewState(initial);
    }
  }, [foodBanks, userLocation, viewState]);

  const selected = useMemo(
    () => foodBanks.find((bank) => bank.id === selectedFoodBankId) ?? null,
    [foodBanks, selectedFoodBankId]
  );

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const handleMarkerClick = useCallback(
    (id: string) => {
      onSelectFoodBank(id === selectedFoodBankId ? null : id);
    },
    [onSelectFoodBank, selectedFoodBankId]
  );

  if (!mapboxToken) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border text-center text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Map unavailable</span>
        <p>Set NEXT_PUBLIC_MAPBOX_TOKEN to unlock TheFeed’s map experience.</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl">
      {viewState ? (
        <Map
          {...viewState}
          onMove={(event) => setViewState(event.viewState)}
          mapStyle={MAPBOX_STYLE}
          mapboxAccessToken={mapboxToken}
          attributionControl={false}
          dragRotate={false}
        >
          <NavigationControl position="bottom-right" />
          <GeolocateControl position="bottom-right" />

          {foodBanks.map((bank) => (
            <Marker
              key={bank.id}
              latitude={bank.latitude}
              longitude={bank.longitude}
              anchor="bottom"
              onClick={(event) => {
                event.originalEvent.stopPropagation();
                handleMarkerClick(bank.id);
              }}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-md transition-transform",
                  selected?.id === bank.id ? "scale-110" : "scale-100",
                  bank.isOpen ? "bg-primary" : "bg-muted text-muted-foreground"
                )}
              >
                <MapPin className="h-4 w-4 text-white" />
              </span>
            </Marker>
          ))}

          {userLocation ? (
            <Marker
              latitude={userLocation.lat}
              longitude={userLocation.lng}
              anchor="center"
            >
              <span className="flex h-3 w-3 items-center justify-center rounded-full border-4 border-white bg-primary shadow">
                <LocateFixed className="h-3 w-3 text-white" />
              </span>
            </Marker>
          ) : null}
        </Map>
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          Initializing map…
        </div>
      )}
    </div>
  );
}
