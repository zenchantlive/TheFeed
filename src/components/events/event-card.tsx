import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Calendar, Clock, MapPin, Users, CheckCircle } from "lucide-react";

export type EventCardProps = {
  id: string;
  title: string;
  eventType: "potluck" | "volunteer";
  hostName: string;
  startTime: Date;
  location: string;
  rsvpCount: number;
  capacity: number | null;
  isVerified: boolean;
  href?: string;
  className?: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatRelativeDate(date: Date) {
  const now = new Date();
  const diffInHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 0) {
    return `Started ${dateFormatter.format(date)}`;
  }

  if (diffInHours < 24) {
    return `Today at ${date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }

  if (diffInHours < 48) {
    return `Tomorrow at ${date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }

  return dateFormatter.format(date);
}

export function EventCard({
  id,
  title,
  eventType,
  hostName,
  startTime,
  location,
  rsvpCount,
  capacity,
  isVerified,
  href = `/community/events/${id}`,
  className,
}: EventCardProps) {
  const relativeDate = formatRelativeDate(startTime);
  const capacityLabel =
    typeof capacity === "number" ? `${capacity} max` : "Open capacity";
  const isFull = typeof capacity === "number" && rsvpCount >= capacity;
  const statusTone = isFull
    ? "text-destructive border-destructive/40 bg-destructive/10"
    : "text-primary border-primary/30 bg-primary/5";

  const typeBadgeTone =
    eventType === "potluck"
      ? "bg-full-start/15 text-full-end border-full-end/30"
      : "bg-primary/15 text-primary border-primary/30";

  return (
    <Link
      href={href}
      className={cn(
        "group block rounded-2xl border border-border/50 bg-card/95 p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        className
      )}
      aria-label={`View ${eventType} ${title} on ${relativeDate}`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <Badge className={cn("rounded-full text-xs font-semibold", typeBadgeTone)}>
          {eventType === "potluck" ? "🎉 Potluck" : "🤝 Volunteer"}
        </Badge>
        {isVerified && (
          <Badge variant="default" className="rounded-full text-xs">
            <CheckCircle className="mr-1 h-3 w-3" />
            Verified
          </Badge>
        )}
      </div>

      <h3 className="mb-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
        {title}
      </h3>

      <div className="space-y-1.5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{relativeDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span className="truncate">{location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>
            {rsvpCount} attending • {capacityLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>Hosted by {hostName}</span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
            statusTone
          )}
        >
          <Clock className="h-3 w-3" />
          {isFull ? "Full" : "Spots open"}
        </span>
      </div>
    </Link>
  );
}
