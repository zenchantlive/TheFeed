/* eslint-disable react/no-unescaped-entities */
"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export interface BasicInfoData {
  title: string;
  eventType: "potluck" | "volunteer";
  description: string;
}

interface EventBasicInfoStepProps {
  data: BasicInfoData;
  onChange: (data: Partial<BasicInfoData>) => void;
}

export function EventBasicInfoStep({ data, onChange }: EventBasicInfoStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Event basics</h2>
        <p className="text-muted-foreground">
          Let's start with the essentials about your event
        </p>
      </div>

      {/* Event Type */}
      <div className="space-y-3">
        <Label htmlFor="eventType">Event type</Label>
        <RadioGroup
          value={data.eventType}
          onValueChange={(value) =>
            onChange({ eventType: value as "potluck" | "volunteer" })
          }
        >
          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
            <RadioGroupItem value="potluck" id="potluck" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="potluck" className="text-base font-medium cursor-pointer">
                🎉 Community Potluck
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Shared meal where everyone brings a dish. Includes sign-up sheet.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
            <RadioGroupItem value="volunteer" id="volunteer" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="volunteer" className="text-base font-medium cursor-pointer">
                🤝 Volunteer Opportunity
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Food bank shifts, community kitchen help, and other volunteer events.
              </p>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Event Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Event title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          type="text"
          placeholder={
            data.eventType === "potluck"
              ? "e.g., Midtown Monthly Potluck"
              : "e.g., City Harvest Saturday Volunteers"
          }
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          maxLength={100}
        />
        <p className="text-sm text-muted-foreground">
          {data.title.length}/100 characters
        </p>
      </div>

      {/* Event Description */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder={
            data.eventType === "potluck"
              ? "Share what neighbors can expect: vibe, who should come, what makes it special..."
              : "Describe the volunteer work: what tasks, what to bring, who to contact..."
          }
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={6}
          maxLength={1000}
        />
        <p className="text-sm text-muted-foreground">
          {data.description.length}/1000 characters
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {data.eventType === "potluck"
            ? "Potlucks include a sign-up sheet so neighbors can coordinate what to bring (main dishes, sides, desserts, drinks)."
            : "This event will appear in the community feed and on the map for neighbors to discover."}
        </AlertDescription>
      </Alert>
    </div>
  );
}
