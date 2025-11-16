"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { getChatStyles } from "../../lib/theme-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Phone,
  Globe,
  Clock,
  Navigation,
  Loader2
} from "lucide-react";

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
    type?: string;
    description?: string;
  };
  userLocation?: { lat: number; lng: number } | null;
  className?: string;
  isLoading?: boolean;
}

interface ResourceActionsProps {
  resource: ResourceCardProps["resource"];
  userLocation: ResourceCardProps["userLocation"];
  onAction?: (action: string, value: unknown) => void;
}

/**
 * Enhanced Resource Card Actions Component
 * 
 * A theme-aware action button group for resource interactions
 */
function ResourceActions({ resource, userLocation, onAction }: ResourceActionsProps) {
  const styles = getChatStyles();
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const handleGetDirections = async () => {
    setActionLoading("directions");
    onAction?.("directions", resource);
    
    try {
      if (userLocation) {
        const origin = `${userLocation.lat},${userLocation.lng}`;
        const destination = `${resource.latitude},${resource.longitude}`;
        window.open(
          `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`,
          "_blank"
        );
      } else {
        window.open(
          `https://www.google.com/maps/search/?api=1&query=${resource.latitude},${resource.longitude}`,
          "_blank"
        );
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleCall = () => {
    if (resource.phone) {
      onAction?.("call", resource.phone);
      window.location.href = `tel:${resource.phone}`;
    }
  };

  const handleVisitWebsite = () => {
    if (resource.website) {
      onAction?.("website", resource.website);
      window.open(resource.website, "_blank");
    }
  };

  if (!resource.phone && !resource.website) {
    return (
      <Button
        onClick={handleGetDirections}
        className={cn(
          "w-full",
          styles.primaryButton
        )}
        disabled={actionLoading === "directions"}
      >
        {actionLoading === "directions" ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Opening Maps...
          </>
        ) : (
          <>
            <Navigation className="w-4 h-4 mr-2" />
            Get Directions
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleGetDirections}
        variant="outline"
        className="flex-1"
        disabled={actionLoading === "directions"}
      >
        <Navigation className="w-4 h-4 mr-1" />
        Directions
      </Button>
      
      {resource.phone && (
        <Button
          onClick={handleCall}
          variant="outline"
          size="icon"
          title="Call"
          aria-label={`Call ${resource.name}`}
        >
          <Phone className="w-4 h-4" />
        </Button>
      )}
      
      {resource.website && (
        <Button
          onClick={handleVisitWebsite}
          variant="outline"
          size="icon"
          title="Visit website"
          aria-label={`Visit ${resource.name} website`}
        >
          <Globe className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

/**
 * Enhanced Resource Card Component
 * 
 * A theme-aware resource card that leverages Shadcn UI components
 * and maintains consistency with the existing design system
 */
export function EnhancedResourceCard({ 
  resource, 
  userLocation,
  className,
  isLoading = false
}: ResourceCardProps) {
  const styles = getChatStyles();

  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader className="space-y-3">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="h-6 bg-muted rounded-md w-48" />
              <div className="h-4 bg-muted rounded-md w-32" />
            </div>
            <div className="h-6 bg-muted rounded-md w-16" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 bg-muted rounded-full w-20" />
            <div className="h-4 bg-muted rounded-md w-24" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-4 bg-muted rounded-md w-full" />
          <div className="h-4 bg-muted rounded-md w-3/4" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 bg-muted rounded-md w-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "overflow-hidden",
        "transition-all duration-300 ease-in-out",
        "hover:shadow-lg hover:shadow-primary/20",
        "hover:-translate-y-1",
        styles.card,
        className
      )}
    >
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold leading-tight">
              {resource.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 flex-shrink-0 text-primary" />
              <span className="truncate">{resource.address}</span>
            </CardDescription>
          </div>
          
          {/* Distance */}
          {resource.distanceMiles !== null && (
            <div className="flex-shrink-0 text-right">
              <p className="text-sm font-medium text-primary">
                {typeof resource.distanceMiles === 'number' 
                  ? `${resource.distanceMiles.toFixed(1)} mi`
                  : resource.distanceMiles
                }
              </p>
            </div>
          )}
        </div>

        {/* Type and Status */}
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {resource.type && (
            <Badge variant="secondary" className="text-xs">
              {resource.type}
            </Badge>
          )}
          
          {/* Open/Closed Status */}
          <Badge 
            className={cn(
              "text-xs",
              resource.isOpen 
                ? "bg-green-500/10 text-green-700 dark:text-green-400" 
                : "bg-red-500/10 text-red-700 dark:text-red-400"
            )}
          >
            <div className="flex items-center gap-1">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  resource.isOpen ? "bg-green-500" : "bg-red-500"
                )}
              />
              {resource.isOpen ? "Open now" : "Closed"}
            </div>
          </Badge>
          
          {/* Hours */}
          {resource.hours && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span className="truncate">{formatHours(resource.hours)}</span>
            </div>
          )}
        </div>
      </CardHeader>

      {/* Description */}
      {resource.description && (
        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground">
            {resource.description}
          </p>
        </CardContent>
      )}

      {/* Services */}
      {resource.services && resource.services.length > 0 && (
        <CardContent className="border-t border-border/50 pt-3">
          <div className="flex flex-wrap gap-1.5">
            {resource.services.slice(0, 4).map((service, index) => (
              <Badge 
                key={index}
                variant="outline"
                className="text-xs bg-muted/50"
              >
                {service}
              </Badge>
            ))}
            {resource.services.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{resource.services.length - 4} more
              </Badge>
            )}
          </div>
        </CardContent>
      )}

      {/* Actions */}
      <CardContent className="border-t border-border/50 pt-3">
        <ResourceActions 
          resource={resource}
          userLocation={userLocation}
          onAction={(action, value) => {
            console.log(`Resource action: ${action}`, value);
          }}
        />
      </CardContent>
    </Card>
  );
}
