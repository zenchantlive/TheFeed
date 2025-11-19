/**
 * Discovery Scanner Notification
 *
 * A UI component that informs the user about the background discovery process.
 * It manages the state of the "Just-in-Time" search and displays results.
 */

"use client";

import { useState } from "react";
import { Loader2, Search, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FoodBank } from "@/lib/schema";
import { VerificationCard } from "./verification-card";

interface ScannerNotificationProps {
  city: string;
  state: string;
  onDiscoveryComplete?: (count: number) => void;
  className?: string;
}

type DiscoveryStatus = "idle" | "scanning" | "completed" | "cached" | "error";

export function ScannerNotification({
  city,
  state,
  onDiscoveryComplete,
  className,
}: ScannerNotificationProps) {
  const [status, setStatus] = useState<DiscoveryStatus>("idle");
  const [foundCount, setFoundCount] = useState(0);
  const [samples, setSamples] = useState<FoodBank[]>([]);
  const [currentSampleIndex, setCurrentSampleIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [progressMessage, setProgressMessage] = useState("Starting discovery...");
  const [progressValue, setProgressValue] = useState(0);

  const handleScan = async (e: React.MouseEvent) => {
    const isDevMode = e.shiftKey;
    setStatus("scanning");
    setErrorMessage("");
    setProgressValue(0);
    setProgressMessage("Initializing...");

    try {
      const response = await fetch("/api/discovery/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city,
          state,
          force: isDevMode,
          isTest: isDevMode,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Scan failed");
      }

      if (response.headers.get("Content-Type")?.includes("application/json")) {
        // Handle legacy/cached/error JSON responses
        const data = await response.json();
        if (data.status === "cached") {
          setStatus("cached");
          return;
        }
      }

      // Handle Streaming Response
      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          try {
            const update = JSON.parse(line);
            
            if (update.type === "progress") {
              setProgressMessage(update.message);
              if (update.total && update.current) {
                setProgressValue((update.current / update.total) * 100);
              }
            } else if (update.type === "complete") {
              setStatus("completed");
              setFoundCount(update.resourcesFound);
              if (update.samples) setSamples(update.samples);
              if (onDiscoveryComplete) onDiscoveryComplete(update.resourcesFound);
            } else if (update.type === "error") {
              throw new Error(update.message);
            }
          } catch (e) {
            console.warn("Failed to parse stream chunk", e);
          }
        }
      }
    } catch (error) {
      console.error("Scan error:", error);
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleVerify = async (vote: "up" | "down" | "flag") => {
    const resource = samples[currentSampleIndex];
    if (!resource) return;

    try {
      await fetch("/api/discovery/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId: resource.id,
          vote,
        }),
      });

      // Move to next sample
      if (currentSampleIndex < samples.length - 1) {
        setCurrentSampleIndex((prev) => prev + 1);
      } else {
        setShowVerification(false); // Done with all samples
      }
    } catch (error) {
      console.error("Verification failed:", error);
    }
  };

  if (status === "idle") {
    return (
      <Card className={cn("p-4 bg-muted/50 border-dashed", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-background rounded-full shadow-sm">
              <Search className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm">New to {city}?</h4>
              <p className="text-xs text-muted-foreground">
                We can scan for local food resources in real-time.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleScan}
            title="Shift+Click to force rescan (Dev Mode)"
          >
            Scan Neighborhood
          </Button>
        </div>
      </Card>
    );
  }

  if (status === "scanning") {
    return (
      <Card className={cn("p-4 border-primary/20 bg-primary/5", className)}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            <div className="relative p-2 bg-background rounded-full shadow-sm border border-primary/20">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          </div>
          <div className="space-y-1 w-full">
            <div className="flex justify-between">
              <h4 className="font-medium text-sm text-primary">Scanning {city}...</h4>
              <span className="text-xs text-primary">{Math.round(progressValue)}%</span>
            </div>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {progressMessage}
            </p>
            <div className="h-1 w-full bg-primary/10 rounded-full mt-1 overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500" 
                style={{ width: `${progressValue}%` }}
              />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (status === "completed") {
    if (showVerification && samples.length > 0) {
      return (
        <div className={className}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Verify {currentSampleIndex + 1} of {samples.length}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowVerification(false)}
            >
              Skip
            </Button>
          </div>
          <VerificationCard
            resource={samples[currentSampleIndex]}
            onVerify={handleVerify}
          />
        </div>
      );
    }

    return (
      <Card className={cn("p-4 bg-green-50 border-green-200", className)}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-full shadow-sm text-green-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-sm text-green-900">
              Found {foundCount} new resources!
            </h4>
            <p className="text-xs text-green-700 mb-2">
              They are marked as "Unverified". Help us check them?
            </p>
            {samples.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="bg-white border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800 w-full h-8 text-xs"
                onClick={() => setShowVerification(true)}
              >
                Verify {samples.length} Resources
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  if (status === "cached") {
    return (
      <Card className={cn("p-4 bg-muted/50", className)}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-background rounded-full shadow-sm">
            <MapPin className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h4 className="font-medium text-sm">Up to date</h4>
            <p className="text-xs text-muted-foreground">
              We scanned {city} recently. No new resources found yet.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card className={cn("p-4 bg-red-50 border-red-200", className)}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-full shadow-sm text-red-600">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-medium text-sm text-red-900">Scan failed</h4>
            <p className="text-xs text-red-700">{errorMessage}</p>
            <Button
              variant="link"
              className="p-0 h-auto text-xs text-red-800 underline"
              onClick={handleScan}
            >
              Try again
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return null;
}
