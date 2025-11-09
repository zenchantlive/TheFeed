"use client";

import { useState } from "react";
import { LocationCard } from "@/components/foodshare/location-card";
import { Button } from "@/components/ui/button";
import { isCurrentlyOpen } from "@/lib/geolocation";
import { BookmarkX } from "lucide-react";
import Link from "next/link";
import type { HoursType } from "@/lib/schema";

type SavedLocationRecord = {
  id: string;
  createdAt: Date | null;
  foodBank: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string | null;
    website: string | null;
    description: string | null;
    services: string[] | null;
    hours: HoursType | null;
    latitude: number;
    longitude: number;
  } | null;
};

type SavedLocationsListProps = {
  savedLocations: SavedLocationRecord[];
};

export function SavedLocationsList({ savedLocations }: SavedLocationsListProps) {
  const [locations, setLocations] = useState(savedLocations);
  const [removing, setRemoving] = useState<string | null>(null);

  const handleUnsave = async (locationId: string, foodBankId: string) => {
    setRemoving(locationId);
    try {
      const response = await fetch(
        `/api/locations?foodBankId=${encodeURIComponent(foodBankId)}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setLocations((prev) => prev.filter((loc) => loc.id !== locationId));
      } else {
        alert("Failed to remove location. Please try again.");
      }
    } catch (error) {
      console.error("Error removing location:", error);
      alert("Failed to remove location. Please try again.");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {locations
        .filter((entry) => entry.foodBank)
        .map((entry) => {
          const bank = entry.foodBank!;
          const isOpen = bank.hours ? isCurrentlyOpen(bank.hours) : false;
          return (
            <LocationCard
              key={entry.id}
              location={bank}
              isOpen={isOpen}
              actionSlot={
                <>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/map?highlight=${bank.id}`}>
                      View on map
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleUnsave(entry.id, bank.id)}
                    disabled={removing === entry.id}
                  >
                    <BookmarkX className="mr-2 h-4 w-4" />
                    {removing === entry.id ? "Removing..." : "Remove"}
                  </Button>
                </>
              }
            />
          );
        })}
    </div>
  );
}
