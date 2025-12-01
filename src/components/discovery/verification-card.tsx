/**
 * Verification Card
 *
 * A swipeable/interactive card for verifying a single resource.
 * Presents key data (Hours, Address) and asks for "Thumbs Up/Down".
 */

"use client";

import { useState } from "react";
import { Check, X, Flag, MapPin, Clock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FoodBank } from "@/lib/schema";

interface VerificationCardProps {
  resource: FoodBank;
  onVerify: (vote: "up" | "down" | "flag") => void;
  className?: string;
}

export function VerificationCard({
  resource,
  onVerify,
  className,
}: VerificationCardProps) {
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (vote: "up" | "down" | "flag") => {
    setIsVoting(true);
    // Simulate network delay for better UX feel or just wait for parent
    await new Promise((resolve) => setTimeout(resolve, 300));
    onVerify(vote);
    setIsVoting(false);
  };

  return (
    <Card className={cn("overflow-hidden border-2", className)}>
      {/* Header / Map Placeholder */}
      <div className="h-32 bg-muted relative flex items-center justify-center">
        <MapPin className="w-8 h-8 text-muted-foreground/50" />
        {resource.website && (
          <a
            href={resource.website}
            target="_blank"
            rel="noreferrer"
            className="absolute top-2 right-2 text-xs bg-background/80 px-2 py-1 rounded hover:bg-background"
          >
            Visit Website
          </a>
        )}
      </div>

      <div className="p-4 space-y-4">
        <div>
          <h3 className="font-bold text-lg leading-tight">{resource.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {resource.address}, {resource.city}
          </p>
        </div>

        {/* Key Data Points to Verify */}
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2 p-2 bg-muted/30 rounded-md">
            <Clock className="w-4 h-4 mt-0.5 text-primary" />
            <div>
              <span className="font-medium block">Hours</span>
              {resource.hours ? (
                // Simple render for now, ideally parse HoursType
                <span className="text-muted-foreground">
                  See schedule on website
                </span>
              ) : (
                <span className="text-yellow-600">Not listed</span>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2 p-2 bg-muted/30 rounded-md">
            <Globe className="w-4 h-4 mt-0.5 text-primary" />
            <div>
              <span className="font-medium block">Services</span>
              <span className="text-muted-foreground">
                {resource.services?.join(", ") || "General Food Assistance"}
              </span>
            </div>
          </div>
        </div>

        {/* Verification Actions */}
        <div className="pt-2">
          <p className="text-center text-xs font-medium text-muted-foreground mb-3">
            Is this information accurate?
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full border-red-200 hover:bg-red-50 hover:text-red-600 text-red-500"
              onClick={() => handleVote("down")}
              disabled={isVoting}
            >
              <X className="w-6 h-6" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full mt-1 border-orange-200 hover:bg-orange-50 text-orange-400"
              onClick={() => handleVote("flag")}
              disabled={isVoting}
            >
              <Flag className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full border-green-200 hover:bg-green-50 hover:text-green-600 text-green-500"
              onClick={() => handleVote("up")}
              disabled={isVoting}
            >
              <Check className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
