/* eslint-disable react/no-unescaped-entities */
"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export interface CapacityData {
  hasCapacityLimit: boolean;
  capacity: number | null;
}

interface EventCapacityStepProps {
  data: CapacityData;
  onChange: (data: Partial<CapacityData>) => void;
}

export function EventCapacityStep({ data, onChange }: EventCapacityStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Set attendance limit</h2>
        <p className="text-muted-foreground">
          Control how many neighbors can join your event
        </p>
      </div>

      {/* Capacity Option */}
      <div className="space-y-3">
        <Label>Attendance limit</Label>
        <RadioGroup
          value={data.hasCapacityLimit ? "limited" : "unlimited"}
          onValueChange={(value) => {
            const hasLimit = value === "limited";
            onChange({
              hasCapacityLimit: hasLimit,
              capacity: hasLimit ? data.capacity || 20 : null,
            });
          }}
        >
          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
            <RadioGroupItem value="unlimited" id="unlimited" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="unlimited" className="text-base font-medium cursor-pointer">
                Unlimited
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Anyone can RSVP. Great for open community gatherings.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
            <RadioGroupItem value="limited" id="limited" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="limited" className="text-base font-medium cursor-pointer">
                Set a maximum
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Cap attendance at a specific number. Extra RSVPs go to a waitlist.
              </p>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Capacity Number Input (conditional) */}
      {data.hasCapacityLimit && (
        <div className="space-y-2">
          <Label htmlFor="capacity">
            Maximum attendees <span className="text-destructive">*</span>
          </Label>
          <Input
            id="capacity"
            type="number"
            min={1}
            max={500}
            placeholder="e.g., 20"
            value={data.capacity || ""}
            onChange={(e) => {
              const value = e.target.value;
              onChange({
                capacity: value ? parseInt(value, 10) : null,
              });
            }}
          />
          <p className="text-sm text-muted-foreground">
            Include yourself in the count. Guests (like "+1") count separately.
          </p>
        </div>
      )}

      {/* Info Alerts */}
      {data.hasCapacityLimit && data.capacity && data.capacity > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Waitlist enabled:</strong> When {data.capacity} people RSVP, new RSVPs will
            go to a waitlist. If someone cancels, the first person on the waitlist automatically
            gets their spot.
          </AlertDescription>
        </Alert>
      )}

      {!data.hasCapacityLimit && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Open event:</strong> With no attendance limit, you can expect more flexibility
            but less predictability in headcount.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
