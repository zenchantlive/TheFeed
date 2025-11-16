"use client";

import { Calendar, MapPin, Clock, CheckCircle, Navigation } from "lucide-react";
import { format, parseISO } from "date-fns";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string;
    eventType: string;
    distanceMiles: number | null;
    startsAt: string;
    location: string;
    isVerified: boolean;
  };
  userLocation?: { lat: number; lng: number } | null;
}

export function EventCard({ event, userLocation }: EventCardProps) {
  const eventDate = parseISO(event.startsAt);
  const formattedDate = format(eventDate, "EEE, MMM d");
  const formattedTime = format(eventDate, "h:mm a");

  const eventTypeStyles: Record<string, { bg: string; text: string; icon: string }> = {
    potluck: {
      bg: "bg-orange-500/10",
      text: "text-orange-700 dark:text-orange-400",
      icon: "🍲",
    },
    volunteer: {
      bg: "bg-blue-500/10",
      text: "text-blue-700 dark:text-blue-400",
      icon: "🤝",
    },
    "food-distribution": {
      bg: "bg-green-500/10",
      text: "text-green-700 dark:text-green-400",
      icon: "🍞",
    },
  };

  const typeStyle = eventTypeStyles[event.eventType] || {
    bg: "bg-muted/50",
    text: "text-muted-foreground",
    icon: "📅",
  };

  const handleViewEvent = () => {
    window.open(`/community/events/${event.id}`, "_blank");
  };

  return (
    <div className="w-full rounded-2xl border border-border/40 bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${typeStyle.bg} ${typeStyle.text}`}
              >
                <span>{typeStyle.icon}</span>
                {event.eventType.replace("-", " ")}
              </span>
              {event.isVerified && (
                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Verified
                </div>
              )}
            </div>
            <h3 className="font-semibold text-base text-foreground mb-1">
              {event.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {event.description}
            </p>
          </div>
          {event.distanceMiles !== null && (
            <div className="flex-shrink-0 text-right">
              <div className="text-sm font-medium text-primary">
                {event.distanceMiles} mi
              </div>
            </div>
          )}
        </div>

        {/* Event Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-foreground font-medium">{formattedDate}</span>
            <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
            <span className="text-muted-foreground">{formattedTime}</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <span className="text-muted-foreground truncate">
              {event.location}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-3 pb-3 flex gap-2">
        <button
          onClick={handleViewEvent}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Calendar className="w-4 h-4" />
          View & RSVP
        </button>
      </div>
    </div>
  );
}
