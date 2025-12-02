"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, X } from "lucide-react";

interface LocationDialogProps {
  currentLocation: string | null;
  onLocationChange: (city: string, state: string, coords?: { lat: number; lng: number }) => void;
}

type Suggestion = {
  id: string;
  place_name: string;
  text: string; // City
  context?: { id: string; text: string; short_code?: string }[]; // Contains region (state)
  center?: [number, number]; // [lng, lat]
};

export function LocationDialog({ currentLocation, onLocationChange }: LocationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(currentLocation || "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!token) return;

      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          value
        )}.json?types=place&country=us&access_token=${token}`
      );
      const data = await res.json();
      setSuggestions(data.features || []);
    } catch (error) {
      console.error("Autocomplete error:", error);
    }
  };

  const handleSelect = (suggestion: Suggestion) => {
    const city = suggestion.text;
    // Extract state code (e.g., "New York" -> "NY" or just use name if we can't map it)
    // Mapbox 'region' context usually gives full state name. We need code for Tavily.
    // For simplicity MVP, we'll try to find a 2-letter code in the context or just pass the full name
    // and let the backend/Tavily handle it (Tavily is flexible).

    // Actually, route.ts validation expects 2 chars for state.
    // We need a mapping or extract the code. 
    // Mapbox context looks like: [{id: "region.123", text: "California", short_code: "US-CA"}]
    const region = suggestion.context?.find((c) => c.id.startsWith("region"));
    let state = ""; // Default

    if (region) {
      // Mapbox often provides short_code like "US-CA"
      const shortCode = region.short_code || "";
      if (shortCode.startsWith("US-")) {
        state = shortCode.replace("US-", "");
      } else {
        // Fallback: extract from text if possible, or map logic needed.
        // For now, defaulting/assuming mapbox returns US-XX code.
      }
    }

    const center = suggestion.center;
    const coords = center ? { lat: center[1], lng: center[0] } : undefined;

    onLocationChange(city, state, coords);
    setIsOpen(false);
    setQuery(suggestion.place_name);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="ml-1 text-xs text-primary hover:underline"
      >
        Change
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => setIsOpen(false)}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Change Location</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1 hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="location" className="text-sm font-medium text-foreground">
              Search for your city
            </label>
            <Input
              id="location"
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="e.g. Sacramento, Boston..."
              className="mt-1"
              autoFocus
              autoComplete="off"
            />

            {/* Suggestions List */}
            {suggestions.length > 0 && (
              <ul className="mt-2 max-h-48 overflow-y-auto rounded-md border border-border bg-card shadow-sm">
                {suggestions.map((s) => (
                  <li key={s.id}>
                    <button
                      className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors"
                      onClick={() => handleSelect(s)}
                    >
                      <span className="font-medium">{s.text}</span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        {s.context?.find(c => c.id.startsWith('region'))?.text}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
