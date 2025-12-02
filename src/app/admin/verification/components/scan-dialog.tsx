"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, CheckCircle2, AlertCircle } from "lucide-react";

interface ScanDialogProps {
  onScanComplete: () => void;
}

export function ScanDialog({ onScanComplete }: ScanDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [status, setStatus] = useState<"idle" | "scanning" | "complete" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [foundCount, setFoundCount] = useState(0);

  const handleScan = async () => {
    if (!city || !state) return;
    setStatus("scanning");
    setProgress(0);
    setMessage("Initializing...");

    try {
      const response = await fetch("/api/discovery/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, state }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Scan failed");
      }

      // Handle cached response (non-streaming)
      const contentType = response.headers.get("Content-Type");
      if (contentType?.includes("application/json")) {
        const data = await response.json();
        if (data.status === "cached") {
          setStatus("complete");
          setMessage(data.message || "Already scanned recently.");
          setFoundCount(data.resourcesFound || 0);
          onScanComplete(); // Refresh anyway to show existing items
          return;
        }
      }

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
              setMessage(update.message);
              if (update.total && update.current) {
                setProgress((update.current / update.total) * 100);
              }
            } else if (update.type === "complete") {
              setStatus("complete");
              setFoundCount(update.resourcesFound);
              onScanComplete();
            } else if (update.type === "error") {
              throw new Error(update.message);
            }
          } catch (e) {
            console.warn("Stream parse error", e);
          }
        }
      }
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unknown error");
    }
  };

  const reset = () => {
    setStatus("idle");
    setProgress(0);
    setMessage("");
    setFoundCount(0);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    // Only reset if we are fully done or idle. If scanning, keep state.
    if (!open && status !== "scanning") {
      reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant={status === "scanning" ? "default" : "secondary"}
          size="sm"
          className={status === "scanning" ? "animate-pulse" : ""}
        >
          {status === "scanning" ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              Scanning... {Math.round(progress)}%
            </>
          ) : status === "complete" ? (
            <>
              <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-green-600" />
              Scan Complete
            </>
          ) : (
            <>
              <Search className="mr-2 h-3.5 w-3.5" />
              Scan Area
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Scan for Resources</DialogTitle>
          <DialogDescription>
            Run a live Tavily search to find and import new resources for a specific area.
          </DialogDescription>
        </DialogHeader>

        {status === "idle" && (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Sacramento"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. CA or California"
              />
            </div>
          </div>
        )}

        {status === "scanning" && (
          <div className="py-6 space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm font-medium">{message}</p>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all duration-500 ease-in-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {status === "complete" && (
          <div className="py-6 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-green-900">Scan Complete</h3>
              <p className="text-sm text-green-700">
                Found {foundCount} new resources. They have been added to the queue.
              </p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="py-6 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-medium text-red-900">Scan Failed</h3>
              <p className="text-sm text-red-700">{message}</p>
            </div>
          </div>
        )}

        <DialogFooter>
          {status === "idle" ? (
            <Button onClick={handleScan} disabled={!city || !state}>
              Start Scan
            </Button>
          ) : (
            <Button onClick={() => setIsOpen(false)}>
              {status === "scanning" ? "Run in Background" : "Close"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
