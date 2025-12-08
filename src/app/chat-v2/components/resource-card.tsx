"use client";

import { MapPin, Phone, Globe, Clock, Navigation } from "lucide-react";

type HoursType = Record<
  string,
  {
    open: string;
    close: string;
    closed?: boolean;
  }
>;

function formatHours(hours: HoursType | string | null | undefined): string {
  if (!hours) return "";
  if (typeof hours === "string") return hours;

  // Get today's day name
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todayHours = hours[today];

  if (!todayHours) {
    return "Hours vary";
  }

  if (todayHours.closed) {
    return "Closed today";
  }

  return `Open ${todayHours.open} - ${todayHours.close}`;
}

interface ResourceCardProps {
  resource: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    distanceMiles: number | null;
    isOpen: boolean;
    phone?: string | null;
    website?: string | null;
    services?: string[];
    hours?: HoursType | string | null;
  };
  userLocation?: { lat: number; lng: number } | null;
}

export function ResourceCard({ resource, userLocation }: ResourceCardProps) {
  const handleGetDirections = () => {
    if (userLocation) {
      const origin = `${userLocation.lat},${userLocation.lng}`;
      const destination = `${resource.latitude},${resource.longitude}`;
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`,
        "_blank"
      );
    } else {
      // Fallback: just show the location
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${resource.latitude},${resource.longitude}`,
        "_blank"
      );
    }
  };

  const handleCall = () => {
    if (resource.phone) {
      window.location.href = `tel:${resource.phone}`;
    }
  };

  const handleVisitWebsite = () => {
    if (resource.website) {
      window.open(resource.website, "_blank");
    }
  };

  return (
    <div className="my-0 rounded-xl border border-border/40 bg-card shadow-sm overflow-hidden w-full">
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base text-foreground mb-1 truncate">
              {resource.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{resource.address}</span>
            </div>
          </div>
          {resource.distanceMiles !== null && (
            <div className="flex-shrink-0 text-right">
              <div className="text-sm font-medium text-primary">
                {resource.distanceMiles} mi
              </div>
            </div>
          )}
        </div>

        {/* Open/Closed Status */}
        <div className="mt-2 flex items-center gap-2">
          <div
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${resource.isOpen
                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                : "bg-red-500/10 text-red-700 dark:text-red-400"
              }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${resource.isOpen ? "bg-green-500" : "bg-red-500"}`}
            />
            {resource.isOpen ? "Open now" : "Closed"}
          </div>
          {resource.hours && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span className="truncate">{formatHours(resource.hours)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Services */}
      {resource.services && resource.services.length > 0 && (
        <div className="px-4 py-3 border-b border-border/30">
          <div className="flex flex-wrap gap-1.5">
            {resource.services.slice(0, 4).map((service, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md bg-muted/50 text-xs text-muted-foreground"
              >
                {service}
              </span>
            ))}
            {resource.services.length > 4 && (
              <span className="inline-flex items-center px-2 py-1 text-xs text-muted-foreground">
                +{resource.services.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-3 bg-muted/20 flex gap-2">
        <button
          onClick={handleGetDirections}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Navigation className="w-4 h-4" />
          Directions
        </button>
        <button
          onClick={() => window.open(`/map?resource=${resource.id}`, "_blank")}
          className="px-3 py-2 rounded-lg border border-border/40 bg-card hover:bg-muted/50 transition-colors text-sm font-medium"
        >
          View Details
        </button>
        {resource.phone && (
          <button
            onClick={handleCall}
            className="px-3 py-2 rounded-lg border border-border/40 bg-card hover:bg-muted/50 transition-colors"
            title="Call"
          >
            <Phone className="w-4 h-4 text-foreground" />
          </button>
        )}
        {resource.website && (
          <button
            onClick={handleVisitWebsite}
            className="px-3 py-2 rounded-lg border border-border/40 bg-card hover:bg-muted/50 transition-colors"
            title="Visit website"
          >
            <Globe className="w-4 h-4 text-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
