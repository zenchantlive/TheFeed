"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { getChatStyles } from "../../lib/theme-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users, Eye, ExternalLink, Loader2, Navigation } from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate?: string;
    location: string;
    latitude?: number;
    longitude?: number;
    distanceMiles?: number | null;
    organizer?: string;
    category: "potluck" | "volunteer" | "food-distribution" | "community-meal" | "workshop";
    isVerified: boolean;
    attendees?: number;
    maxAttendees?: number;
    registrationRequired: boolean;
    registrationUrl?: string;
    imageUrl?: string;
  };
  userLocation?: { lat: number; lng: number } | null;
  className?: string;
  onRsvp?: (eventId: string) => void;
}

/**
 * Enhanced Event Card Component
 * 
 * A theme-aware event card that leverages Shadcn UI components
 * with proper date formatting and RSVP functionality
 */
export function EnhancedEventCard({ 
  event, 
  userLocation,
  className,
  onRsvp 
}: EventCardProps) {
  const styles = getChatStyles();
  const [isRsvping, setIsRsvping] = React.useState(false);

  // Format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const timeStr = format(date, 'h:mm a');
    
    if (isToday(date)) {
      return `Today at ${timeStr}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow at ${timeStr}`;
    } else {
      return format(date, 'MMM d, yyyy \'at\' h:mm a');
    }
  };

  // Event category configuration
  const categoryConfig = {
    "potluck": {
      color: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
      icon: "🥘",
      borderColor: "border-orange-500/20"
    },
    "volunteer": {
      color: "bg-blue-500/10 text-blue-700 dark:text-blue-400", 
      icon: "🤝",
      borderColor: "border-blue-500/20"
    },
    "food-distribution": {
      color: "bg-green-500/10 text-green-700 dark:text-green-400",
      icon: "🍎",
      borderColor: "border-green-500/20"
    },
    "community-meal": {
      color: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
      icon: "🍽️",
      borderColor: "border-purple-500/20"
    },
    "workshop": {
      color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
      icon: "🎓",
      borderColor: "border-indigo-500/20"
    }
  };

  const category = categoryConfig[event.category];

  const handleRsvp = async () => {
    if (event.registrationRequired && event.registrationUrl) {
      window.open(event.registrationUrl, "_blank");
      return;
    }

    setIsRsvping(true);
    try {
      onRsvp?.(event.id);
    } finally {
      setIsRsvping(false);
    }
  };

  const handleGetDirections = () => {
    if (event.latitude && event.longitude) {
      const destination = `${event.latitude},${event.longitude}`;
      const origin = userLocation 
        ? `${userLocation.lat},${userLocation.lng}`
        : "";
      
      const url = origin
        ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`
        : `https://www.google.com/maps/search/?api=1&query=${destination}`;
      
      window.open(url, "_blank");
    }
  };

  return (
    <Card 
      className={cn(
        "overflow-hidden",
        "transition-all duration-300 ease-in-out",
        "hover:shadow-lg hover:shadow-primary/20",
        "hover:-translate-y-1",
        "border-l-4",
        category.borderColor,
        styles.card,
        className
      )}
    >
      {/* Event Header with Category Badge */}
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs font-medium",
                  category.color
                )}
              >
                <span className="mr-1">{category.icon}</span>
                {event.category.replace('-', ' ')}
              </Badge>
              {event.isVerified && (
                <Badge variant="outline" className="text-xs">
                  ✅ Verified
                </Badge>
              )}
            </div>
            
            <CardTitle className="text-base font-semibold leading-tight">
              {event.title}
            </CardTitle>
          </div>
          
          {/* Distance */}
          {event.distanceMiles !== null && (
            <div className="flex-shrink-0 text-right">
              <p className="text-sm font-medium text-primary">
                {typeof event.distanceMiles === 'number' 
                  ? `${event.distanceMiles.toFixed(1)} mi`
                  : event.distanceMiles
                }
              </p>
            </div>
          )}
        </div>

        {/* Date and Time */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(event.startDate)}</span>
          {event.endDate && (
            <>
              <span>•</span>
              <span>Ends {formatDate(event.endDate)}</span>
            </>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span className="truncate">{event.location}</span>
        </div>

        {/* Organizer */}
        {event.organizer && (
          <div className="text-xs text-muted-foreground">
            by {event.organizer}
          </div>
        )}
      </CardHeader>

      {/* Event Description */}
      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {event.description}
        </p>
      </CardContent>

      {/* Event Stats */}
      {(event.attendees || event.maxAttendees) && (
        <CardContent className="border-t border-border/50 pt-3 pb-3">
          <div className="flex items-center gap-4 text-sm">
            {event.attendees && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="w-3 h-3" />
                <span>{event.attendees} attending</span>
              </div>
            )}
            {event.maxAttendees && (
              <div className="text-muted-foreground">
                {event.attendees}/{event.maxAttendees} spots
              </div>
            )}
          </div>
        </CardContent>
      )}

      {/* Actions */}
      <CardContent className="border-t border-border/50 pt-3">
        <div className="flex gap-2">
          <Button
            onClick={handleRsvp}
            className={cn(
              "flex-1",
              styles.primaryButton
            )}
            disabled={isRsvping}
          >
            {isRsvping ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                {event.registrationRequired ? "Register" : "RSVP"}
              </>
            )}
          </Button>
          
          <Button
            onClick={handleGetDirections}
            variant="outline"
            size="icon"
            title="Get directions"
            aria-label={`Get directions to ${event.title}`}
          >
            <Navigation className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to format dates (moved outside component)
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const timeStr = format(date, 'h:mm a');
  
  if (isToday(date)) {
    return `Today at ${timeStr}`;
  } else if (isTomorrow(date)) {
    return `Tomorrow at ${timeStr}`;
  } else {
    return format(date, 'MMM d, yyyy \'at\' h:mm a');
  }
};

interface EventPreviewCardProps {
  event: EventCardProps["event"];
  userLocation?: EventCardProps["userLocation"];
  className?: string;
  onClick?: () => void;
}

export function EventPreviewCard({ 
  event, 
  userLocation,
  className,
  onClick 
}: EventPreviewCardProps) {
  const styles = getChatStyles();
  const category = {
    "potluck": { color: "text-orange-600", icon: "🥘" },
    "volunteer": { color: "text-blue-600", icon: "🤝" },
    "food-distribution": { color: "text-green-600", icon: "🍎" },
    "community-meal": { color: "text-purple-600", icon: "🍽️" },
    "workshop": { color: "text-indigo-600", icon: "🎓" }
  }[event.category];

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-all duration-200",
        styles.card,
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", 
            "bg-primary/10 text-primary", "flex-shrink-0")}>
            <span className="text-lg">{category.icon}</span>
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-1 line-clamp-1">
              {event.title}
            </h4>
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {formatDate(event.startDate)} • {event.location}
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {event.category.replace('-', ' ')}
              </Badge>
              {event.isVerified && (
                <Badge variant="outline" className="text-xs">
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
