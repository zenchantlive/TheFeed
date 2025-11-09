"use client";

import { useState, useCallback, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, MapPin } from "lucide-react";
import Map, { Marker, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export interface LocationData {
  location: string;
  locationCoords: { lat: number; lng: number } | null;
  isPublicLocation: boolean;
}

interface EventLocationStepProps {
  data: LocationData;
  onChange: (data: Partial<LocationData>) => void;
}

const SACRAMENTO_CENTER = { lat: 38.5816, lng: -121.4944 };
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export function EventLocationStep({ data, onChange }: EventLocationStepProps) {
  const [viewport, setViewport] = useState({
    latitude: data.locationCoords?.lat || SACRAMENTO_CENTER.lat,
    longitude: data.locationCoords?.lng || SACRAMENTO_CENTER.lng,
    zoom: 13,
  });

  // Update marker when clicking on map
  const handleMapClick = useCallback(
    (event: { lngLat: { lng: number; lat: number } }) => {
      const { lng, lat } = event.lngLat;
      onChange({
        locationCoords: { lat, lng },
      });
    },
    [onChange]
  );

  // Center map on marker when coords change
  useEffect(() => {
    if (data.locationCoords) {
      setViewport((prev) => ({
        ...prev,
        latitude: data.locationCoords!.lat,
        longitude: data.locationCoords!.lng,
      }));
    }
  }, [data.locationCoords]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Where will it be?</h2>
        <p className="text-muted-foreground">
          Share the location so neighbors can find you
        </p>
      </div>

      {/* Location Text Input */}
      <div className="space-y-2">
        <Label htmlFor="location">
          Location address <span className="text-destructive">*</span>
        </Label>
        <Input
          id="location"
          type="text"
          placeholder="e.g., Fremont Park, 15th & P St, Sacramento"
          value={data.location}
          onChange={(e) => onChange({ location: e.target.value })}
        />
        <p className="text-sm text-muted-foreground">
          Enter a recognizable address or landmark
        </p>
      </div>

      {/* Map Picker */}
      <div className="space-y-2">
        <Label>
          Pin exact location on map{" "}
          <span className="text-muted-foreground text-sm">(optional)</span>
        </Label>
        <div className="rounded-lg overflow-hidden border">
          {MAPBOX_TOKEN ? (
            <Map
              {...viewport}
              onMove={(evt) => setViewport(evt.viewState)}
              onClick={handleMapClick}
              mapboxAccessToken={MAPBOX_TOKEN}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              style={{ width: "100%", height: "300px" }}
            >
              <NavigationControl position="top-right" />

              {data.locationCoords && (
                <Marker
                  latitude={data.locationCoords.lat}
                  longitude={data.locationCoords.lng}
                  anchor="bottom"
                >
                  <div className="relative">
                    <MapPin className="h-8 w-8 text-primary fill-primary/20" />
                  </div>
                </Marker>
              )}
            </Map>
          ) : (
            <div className="w-full h-[300px] bg-muted flex items-center justify-center">
              <p className="text-muted-foreground text-sm">
                Map not available (Mapbox token missing)
              </p>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Click on the map to drop a pin, or leave blank to use text address only
        </p>
        {data.locationCoords && (
          <p className="text-sm text-muted-foreground">
            📍 Coordinates: {data.locationCoords.lat.toFixed(4)},{" "}
            {data.locationCoords.lng.toFixed(4)}
          </p>
        )}
      </div>

      {/* Public Location Toggle */}
      <div className="flex items-start space-x-3 p-4 border rounded-lg">
        <Checkbox
          id="isPublicLocation"
          checked={data.isPublicLocation}
          onCheckedChange={(checked) =>
            onChange({ isPublicLocation: checked === true })
          }
        />
        <div className="flex-1">
          <Label htmlFor="isPublicLocation" className="text-base font-medium cursor-pointer">
            This is a public location (recommended)
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Parks, community centers, libraries, and other public spaces
          </p>
        </div>
      </div>

      {/* Safety Alert */}
      {!data.isPublicLocation && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Safety tip:</strong> We recommend hosting events in public spaces like parks
            and community centers. This helps everyone feel safe and welcome.
          </AlertDescription>
        </Alert>
      )}

      {data.isPublicLocation && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Great choice! Public spaces help build trust and make everyone feel welcome.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
