/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar as CalendarIcon, Info } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface DateTimeData {
  date: Date | undefined;
  startTime: string;
  endTime: string;
}

interface EventDateTimeStepProps {
  data: DateTimeData;
  onChange: (data: Partial<DateTimeData>) => void;
}

export function EventDateTimeStep({ data, onChange }: EventDateTimeStepProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Helper to validate time format (HH:MM in 24-hour or 12-hour with AM/PM)
  const isValidTime = (time: string): boolean => {
    if (!time) return false;
    // Accept formats like "2:00 PM", "14:00", "2:00pm", "02:00 PM"
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM|am|pm)$|^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time.trim());
  };

  const isStartTimeValid = isValidTime(data.startTime);
  const isEndTimeValid = isValidTime(data.endTime);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">When is it happening?</h2>
        <p className="text-muted-foreground">
          Pick a date and time for your event
        </p>
      </div>

      {/* Date Picker */}
      <div className="space-y-2">
        <Label>
          Date <span className="text-destructive">*</span>
        </Label>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !data.date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {data.date ? format(data.date, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={data.date}
              onSelect={(date) => {
                onChange({ date });
                setIsCalendarOpen(false);
              }}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <p className="text-sm text-muted-foreground">
          Events must be scheduled for today or in the future
        </p>
      </div>

      {/* Start Time */}
      <div className="space-y-2">
        <Label htmlFor="startTime">
          Start time <span className="text-destructive">*</span>
        </Label>
        <Input
          id="startTime"
          type="text"
          placeholder="e.g., 6:00 PM or 18:00"
          value={data.startTime}
          onChange={(e) => onChange({ startTime: e.target.value })}
        />
        {data.startTime && !isStartTimeValid && (
          <p className="text-sm text-destructive">
            Please use format like "6:00 PM" or "18:00"
          </p>
        )}
        {data.startTime && isStartTimeValid && (
          <p className="text-sm text-muted-foreground">✓ Valid time format</p>
        )}
      </div>

      {/* End Time */}
      <div className="space-y-2">
        <Label htmlFor="endTime">
          End time <span className="text-destructive">*</span>
        </Label>
        <Input
          id="endTime"
          type="text"
          placeholder="e.g., 8:00 PM or 20:00"
          value={data.endTime}
          onChange={(e) => onChange({ endTime: e.target.value })}
        />
        {data.endTime && !isEndTimeValid && (
          <p className="text-sm text-destructive">
            Please use format like "8:00 PM" or "20:00"
          </p>
        )}
        {data.endTime && isEndTimeValid && (
          <p className="text-sm text-muted-foreground">✓ Valid time format</p>
        )}
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Tip:</strong> Give yourself buffer time for setup. If the meal is at 6:30 PM,
          you might want to set start time to 6:00 PM for arrivals and setup.
        </AlertDescription>
      </Alert>
    </div>
  );
}
