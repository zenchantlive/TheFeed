import { useCallback, useEffect, useRef, useState } from "react";
import { getUserLocation, type Coordinates } from "@/lib/geolocation";

type LocationStatus = "idle" | "loading" | "ready" | "error";

type LocationState = {
  coords: Coordinates | null;
  label: string | null;
  status: LocationStatus;
  error?: string;
};

type LocationResult = LocationState & {
  refresh: () => void;
};

type IpApiResponse = {
  latitude?: number;
  longitude?: number;
  city?: string;
  region?: string;
  country_name?: string;
};

const IP_LOOKUP_URL = "https://ipapi.co/json/";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

/**
 * Attempts a lightweight IP-based lookup before falling back to GPS geolocation.
 * Returns coordinates (for tool calls) plus a human friendly label for the UI.
 */
async function fetchIpLocation(signal?: AbortSignal) {
  try {
    const response = await fetch(IP_LOOKUP_URL, { signal });
    if (!response.ok) return null;
    const data = (await response.json()) as IpApiResponse;
    if (typeof data.latitude !== "number" || typeof data.longitude !== "number") {
      return null;
    }

    return {
      coords: { lat: data.latitude, lng: data.longitude },
      label: data.city || data.region || data.country_name || null,
    };
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      return null;
    }
    return null;
  }
}

async function reverseGeocode(
  coords: Coordinates,
  signal?: AbortSignal
): Promise<string | null> {
  try {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set("format", "json");
    url.searchParams.set("lat", String(coords.lat));
    url.searchParams.set("lon", String(coords.lng));
    url.searchParams.set("zoom", "14");

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "TheFeed Sous-Chef",
      },
      signal,
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      address?: Record<string, string>;
    };
    const address = data.address ?? {};
    return (
      address.neighbourhood ||
      address.suburb ||
      address.city ||
      address.town ||
      address.village ||
      null
    );
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      return null;
    }
    return null;
  }
}

export function useResolvedLocation(): LocationResult {
  const [state, setState] = useState<LocationState>({
    coords: null,
    label: null,
    status: "idle",
  });
  const controllerRef = useRef<AbortController | null>(null);

  const resolveLocation = useCallback(async () => {
    if (typeof window === "undefined") return;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setState((previous) => ({
      ...previous,
      status: "loading",
      error: undefined,
    }));

    try {
      // First attempt: quick IP lookup (works without user permission, great for approximate area)
      const ipResult = await fetchIpLocation(controller.signal);
      if (ipResult) {
        setState({
          coords: ipResult.coords,
          label: ipResult.label ?? "Your area",
          status: "ready",
        });
        return;
      }

      // Fallback: precise browser geolocation + reverse geocoding for a friendly label
      const coords = await getUserLocation();
      const label = await reverseGeocode(coords, controller.signal);
      setState({
        coords,
        label: label ?? "Your area",
        status: "ready",
      });
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return;
      }
      setState({
        coords: null,
        label: null,
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "Unable to determine location.",
      });
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    void resolveLocation();
    return () => {
      controllerRef.current?.abort();
    };
  }, [resolveLocation]);

  const refresh = useCallback(() => {
    void resolveLocation();
  }, [resolveLocation]);

  return {
    ...state,
    refresh,
  };
}
