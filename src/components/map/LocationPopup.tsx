"use client";

import { useMemo, useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { LocationCard } from "@/components/foodshare/location-card";
import type { HoursType } from "@/lib/schema";
import { X, Bookmark, BookmarkCheck, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSavedLocation } from "@/hooks/use-saved-locations";

export type LocationPopupProps = {
  isOpen: boolean;
  onClose: () => void;
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
  };
  distanceMiles?: number | null;
  currentlyOpen?: boolean;
  onDirections?: () => void;
  className?: string;
};

export function LocationPopup({
  isOpen,
  onClose,
  foodBank,
  distanceMiles,
  currentlyOpen,
  onDirections,
  className,
}: LocationPopupProps) {
  const {
    isSaved,
    isLoading,
    toggleSave,
    checkSaved,
    isSignedIn,
  } = useSavedLocation(foodBank.id);

  useEffect(() => {
    if (isOpen && isSignedIn) {
      checkSaved();
    }
  }, [isOpen, checkSaved, isSignedIn]);

  const handleToggleSave = async () => {
    const result = await toggleSave();
    if (!result.success && result.error) {
      alert(result.error);
    }
  };

  const directionsAction = useMemo(() => {
    if (!onDirections) {
      const destination = encodeURIComponent(
        `${foodBank.address}, ${foodBank.city}, ${foodBank.state} ${foodBank.zipCode}`
      );
      return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    }
    return null;
  }, [foodBank.address, foodBank.city, foodBank.state, foodBank.zipCode, onDirections]);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-[calc(80px+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 transition-all duration-200 ease-in-out",
        isOpen ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        className
      )}
      aria-hidden={!isOpen}
    >
      <div className="pointer-events-auto w-full max-w-xl">
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 h-8 w-8 rounded-full bg-white/80 text-muted-foreground hover:bg-white"
            aria-label="Close details"
          >
            <X className="h-4 w-4" />
          </Button>
          <LocationCard
            location={foodBank}
            distanceMiles={typeof distanceMiles === "number" ? distanceMiles : undefined}
            isOpen={Boolean(currentlyOpen)}
            onDirections={onDirections}
            actionSlot={
              <>
                {isSignedIn && (
                  <Button
                    onClick={handleToggleSave}
                    disabled={isLoading}
                    variant={isSaved ? "default" : "outline"}
                    className="w-full"
                  >
                    {isSaved ? (
                      <>
                        <BookmarkCheck className="mr-2 h-4 w-4" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Bookmark className="mr-2 h-4 w-4" />
                        Save Location
                      </>
                    )}
                  </Button>
                )}
                {directionsAction && (
                  <Button asChild variant="outline" className="w-full">
                    <a href={directionsAction} target="_blank" rel="noreferrer">
                      Open in Maps
                    </a>
                  </Button>
                )}
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/community" className="flex items-center justify-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Ask neighbors about this spot
                  </Link>
                </Button>
              </>
            }
          />
        </div>
      </div>
    </div>
  );
}
