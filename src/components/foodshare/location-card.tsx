import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Globe, Navigation2 } from "lucide-react";
import { StatusBadge } from "./status-badge";
import { VerificationBadge } from "./verification-badge";
import { SourcesSection, type Source } from "./sources-section";
import { formatHoursForDisplay } from "@/lib/geolocation";
import { cn } from "@/lib/utils";

type LocationCardProps = {
  location: {
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
    hours: Record<string, { open: string; close: string; closed?: boolean }> | null;
    verificationStatus?: string;
    lastVerified?: Date | string | null;
    sources?: Source[];
  };
  distanceMiles?: number;
  isOpen?: boolean;
  onDirections?: () => void;
  actionSlot?: React.ReactNode;
  className?: string;
};

export function LocationCard({
  location,
  distanceMiles,
  isOpen = false,
  onDirections,
  actionSlot,
  className,
}: LocationCardProps) {
  return (
    <Card className={cn("rounded-2xl border border-border/80 shadow-md", className)}>
      <CardHeader className="space-y-3 pb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-xl font-semibold">{location.name}</CardTitle>
              {location.verificationStatus && (
                <VerificationBadge
                  status={location.verificationStatus}
                  lastVerified={location.lastVerified}
                  size="sm"
                />
              )}
            </div>
            <p className="flex items-center text-sm text-muted-foreground">
              <MapPin className="mr-1.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                {location.address}, {location.city}, {location.state} {location.zipCode}
              </span>
            </p>
          </div>
          <StatusBadge isOpen={isOpen} />
        </div>
        {typeof distanceMiles === "number" && (
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {distanceMiles.toFixed(1)} miles away
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {location.sources && location.sources.length > 0 && (
          <SourcesSection sources={location.sources} className="mb-4" />
        )}
        {location.description ? (
          <p className="text-sm text-muted-foreground">{location.description}</p>
        ) : null}

        {location.services && location.services.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {location.services.map((service) => (
              <span
                key={service}
                className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
              >
                {service}
              </span>
            ))}
          </div>
        ) : null}

        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            {location.phone ? (
              <a className="underline-offset-2 hover:underline" href={`tel:${location.phone}`}>
                {location.phone}
              </a>
            ) : (
              <span>Phone unavailable</span>
            )}
          </p>
          <p className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            {location.website ? (
              <a
                className="truncate underline-offset-2 hover:underline"
                href={location.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit website
              </a>
            ) : (
              <span>Website unavailable</span>
            )}
          </p>
          <p className="flex items-center gap-2">
            <Navigation2 className="h-4 w-4 text-primary" />
            <span>{formatHoursForDisplay(location.hours?.[
              new Date().toLocaleDateString("en-US", { weekday: "long" })
            ])}</span>
          </p>
        </div>
      </CardContent>

      {(actionSlot || onDirections) && (
        <CardFooter className="flex flex-col gap-2 pt-0">
          {actionSlot}
          {onDirections ? (
            <Button
              variant="secondary"
              className="w-full"
              onClick={onDirections}
            >
              Get Directions
            </Button>
          ) : null}
        </CardFooter>
      )}
    </Card>
  );
}
