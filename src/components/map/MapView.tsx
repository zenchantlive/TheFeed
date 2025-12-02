"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Map, {
  Marker,
  NavigationControl,
  ViewState,
  GeolocateControl,
} from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin, LocateFixed, Calendar, MessageSquare } from "lucide-react";
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
  verificationStatus?: "unverified" | "community_verified" | "official" | "rejected" | "duplicate";
};

type MapViewProps = {
  foodBanks: FoodBankOnMap[];
  userLocation: Coordinates | null;
  selectedFoodBankId: string | null;
  onSelectFoodBank: (id: string | null) => void;
  events?: MapEventPin[];
  selectedEventId?: string | null;
  onSelectEvent?: (id: string | null) => void;
  posts?: MapPostPin[];
  selectedPostId?: string | null;
  onSelectPost?: (id: string | null) => void;
};

type MapEventPin = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  eventType: "potluck" | "volunteer";
};

type MapPostPin = {
  id: string;
  content: string;
  kind: "share" | "request" | "update" | "resource";
  latitude: number;
  longitude: number;
};

const MAPBOX_STYLE = "mapbox://styles/mapbox/streets-v12";

export function MapView({
  foodBanks,
  userLocation,
  selectedFoodBankId,
  onSelectFoodBank,
  events = [],
  selectedEventId = null,
  onSelectEvent,
  posts = [],
  selectedPostId = null,
  onSelectPost,
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

  const handleEventMarkerClick = useCallback(
    (id: string) => {
      if (!onSelectEvent) return;
      onSelectEvent(id === selectedEventId ? null : id);
    },
    [onSelectEvent, selectedEventId]
  );

  const handlePostMarkerClick = useCallback(
    (id: string) => {
      if (!onSelectPost) return;
      onSelectPost(id === selectedPostId ? null : id);
    },
    [onSelectPost, selectedPostId]
  );

  if (!mapboxToken) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border text-center text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Map unavailable</span>
        <p>Set NEXT_PUBLIC_MAPBOX_TOKEN to enable the TheFeed map experience.</p>
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
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-md transition-transform",
                  selected?.id === bank.id ? "scale-110" : "scale-100",
                  // Verified vs Unverified Logic
                  bank.verificationStatus === "unverified"
                    ? "border-yellow-400 bg-gray-400 text-white"
                    : bank.isOpen
                    ? "border-white bg-primary"
                    : "border-white bg-muted text-muted-foreground"
                )}
              >
                <MapPin className="h-4 w-4 text-white" />
              </span>
            </Marker>
          ))}

          {events.map((eventPin) => (
            <Marker
              key={`event-${eventPin.id}`}
              latitude={eventPin.latitude}
              longitude={eventPin.longitude}
              anchor="bottom"
              onClick={(evt) => {
                evt.originalEvent.stopPropagation();
                handleEventMarkerClick(eventPin.id);
              }}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-md transition-transform",
                  selectedEventId === eventPin.id ? "scale-110" : "scale-100",
                  eventPin.eventType === "potluck"
                    ? "bg-gradient-to-r from-full-start to-full-end"
                    : "bg-gradient-to-r from-primary-start to-primary-end"
                )}
              >
                <Calendar className="h-4 w-4 text-white" />
              </span>
            </Marker>
          ))}

          {posts.map((postPin) => (
            <Marker
              key={`post-${postPin.id}`}
              latitude={postPin.latitude}
              longitude={postPin.longitude}
              anchor="bottom"
              onClick={(evt) => {
                evt.originalEvent.stopPropagation();
                handlePostMarkerClick(postPin.id);
              }}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-md transition-transform",
                  selectedPostId === postPin.id ? "scale-110" : "scale-100",
                  postPin.kind === "share" && "bg-gradient-to-r from-full-start to-full-end",
                  postPin.kind === "request" && "bg-gradient-to-r from-hungry-start to-hungry-end",
                  (postPin.kind === "update" || postPin.kind === "resource") && "bg-muted-foreground"
                )}
              >
                <MessageSquare className="h-3.5 w-3.5 text-white" />
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
