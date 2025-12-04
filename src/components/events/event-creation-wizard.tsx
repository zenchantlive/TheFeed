"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { EventBasicInfoStep, type BasicInfoData } from "./event-basic-info-step";
import { EventDateTimeStep, type DateTimeData } from "./event-datetime-step";
import { EventLocationStep, type LocationData } from "./event-location-step";
import { EventCapacityStep, type CapacityData } from "./event-capacity-step";
import { EventSignUpSheetStep, type SignUpSheetData } from "./event-signup-sheet-step";
import { generateEventDetails } from "@/app/actions/generate-event";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";

interface WizardData extends BasicInfoData, DateTimeData, LocationData, CapacityData, SignUpSheetData { }

interface EventCreationWizardProps {
  onClose?: () => void;
}

const INITIAL_DATA: WizardData = {
  // Step 1
  title: "",
  eventType: "potluck",
  description: "",
  // Step 2
  date: undefined,
  startTime: "",
  endTime: "",
  // Step 3
  location: "",
  locationCoords: null,
  isPublicLocation: true,
  // Step 4
  hasCapacityLimit: false,
  capacity: null,
  // Step 5
  useSignUpSheet: true,
  slots: [],
};

export function EventCreationWizard({ onClose }: EventCreationWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0 = Start Choice, 1 = Basic Info, etc.
  const [data, setData] = useState<WizardData>(INITIAL_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 5;
  // Progress bar calculation (step 0 doesn't count towards progress)
  const progress = step === 0 ? 0 : (step / totalSteps) * 100;

  // Update data from step components
  const updateData = (updates: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  // Validation for each step
  const canProceed = (): boolean => {
    switch (step) {
      case 0: // Start Choice
        return true;
      case 1: // Basic info
        return Boolean(data.title.trim() && data.description.trim());
      case 2: // Date/time
        return Boolean(data.date && data.startTime.trim() && data.endTime.trim());
      case 3: // Location
        return Boolean(data.location.trim());
      case 4: // Capacity
        if (data.hasCapacityLimit) {
          return Boolean(data.capacity && data.capacity > 0);
        }
        return true;
      case 5: // Sign-up sheet
        return true; // Optional for potlucks
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateEventDetails(aiPrompt);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to generate details");
      }

      const generated = result.data;

      setData(prev => ({
        ...prev,
        title: generated.title,
        description: generated.description,
        eventType: generated.eventType as any, // Cast to match our type
      }));

      // Move to step 1 (Basic Info) to review
      setStep(1);
    } catch (err) {
      console.error("AI Generation error:", err);
      setError("Couldn't generate event details. Please try again or start manually.");
    } finally {
      setIsGenerating(false);
    }
  };

  const parseTime = (time: string, date: Date): Date => {
    const cleaned = time.trim().toUpperCase();
    let hours = 0;
    let minutes = 0;

    // Try 12-hour format first (6:00 PM)
    const twelveHourMatch = cleaned.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/);
    if (twelveHourMatch) {
      hours = parseInt(twelveHourMatch[1], 10);
      minutes = parseInt(twelveHourMatch[2], 10);
      if (twelveHourMatch[3] === "PM" && hours !== 12) hours += 12;
      if (twelveHourMatch[3] === "AM" && hours === 12) hours = 0;
    } else {
      // Try 24-hour format (18:00)
      const twentyFourHourMatch = cleaned.match(/^(\d{1,2}):(\d{2})$/);
      if (twentyFourHourMatch) {
        hours = parseInt(twentyFourHourMatch[1], 10);
        minutes = parseInt(twentyFourHourMatch[2], 10);
      }
    }

    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  };

  const handleSubmit = async () => {
    if (!canProceed() || !data.date) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Parse start and end times
      const startTime = parseTime(data.startTime, data.date);
      const endTime = parseTime(data.endTime, data.date);

      // Prepare event payload
      const eventPayload = {
        title: data.title.trim(),
        description: data.description.trim(),
        eventType: data.eventType,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        location: data.location.trim(),
        locationCoords: data.locationCoords || undefined,
        isPublicLocation: data.isPublicLocation,
        capacity: data.hasCapacityLimit ? data.capacity : null,
      };

      // Create event
      const eventResponse = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventPayload),
      });

      if (!eventResponse.ok) {
        const errorData = await eventResponse.json();
        throw new Error(errorData.error || "Failed to create event");
      }

      const { event } = await eventResponse.json();

      // Create sign-up slots if potluck and slots exist
      if (data.eventType === "potluck" && data.slots.length > 0) {
        for (const slot of data.slots) {
          if (slot.slotName.trim()) {
            await fetch(`/api/events/${event.id}/slots`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                slotName: slot.slotName.trim(),
                maxClaims: slot.maxClaims,
                description: slot.description?.trim() || undefined,
                sortOrder: slot.sortOrder,
              }),
            });
          }
        }
      }

      // Redirect to event detail page
      if (onClose) {
        onClose();
      }
      router.push(`/community/events/${event.id}`);
    } catch (err) {
      console.error("Event creation error:", err);
      setError(err instanceof Error ? err.message : "Failed to create event");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 px-1">
      {/* Progress Bar - Only show after step 0 */}
      {step > 0 && (
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">
              Step {step} of {totalSteps}
            </span>
            <span className="text-sm text-muted-foreground">
              {step === 1 && "Basic info"}
              {step === 2 && "Date & time"}
              {step === 3 && "Location"}
              {step === 4 && "Capacity"}
              {step === 5 && "Sign-up sheet"}
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Step Content */}
      <Card className="p-6 mb-6 border-none shadow-none sm:border sm:shadow-sm">
        {step === 0 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Let's get this party started! 🎉</h2>
              <p className="text-muted-foreground">How would you like to create your event?</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* AI Option */}
              <button
                onClick={() => { }} // No-op, we use the input below
                className="group relative flex flex-col items-start p-6 rounded-xl border-2 border-primary/20 hover:border-primary/50 bg-primary/5 hover:bg-primary/10 transition-all text-left"
              >
                <div className="mb-4 p-3 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Quick Start with AI</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Describe your event and we'll fill in the details for you.
                </p>

                <div className="w-full space-y-2" onClick={(e) => e.stopPropagation()}>
                  <Textarea
                    placeholder="e.g., A potluck at Fremont Park next Saturday at 2pm for the neighborhood..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="bg-background/50 resize-none"
                    rows={3}
                  />
                  <Button
                    onClick={handleGenerate}
                    disabled={!aiPrompt.trim() || isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Draft
                      </>
                    )}
                  </Button>
                </div>
              </button>

              {/* Manual Option */}
              <button
                onClick={() => setStep(1)}
                className="group flex flex-col items-start p-6 rounded-xl border-2 border-muted hover:border-foreground/20 hover:bg-muted/50 transition-all text-left"
              >
                <div className="mb-4 p-3 rounded-full bg-muted text-foreground group-hover:scale-110 transition-transform">
                  <ArrowRight className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Start from Scratch</h3>
                <p className="text-sm text-muted-foreground">
                  Fill out the form manually step-by-step. Best for specific details.
                </p>
              </button>
            </div>
          </div>
        )}

        {step === 1 && <EventBasicInfoStep data={data} onChange={updateData} />}
        {step === 2 && <EventDateTimeStep data={data} onChange={updateData} />}
        {step === 3 && <EventLocationStep data={data} onChange={updateData} />}
        {step === 4 && <EventCapacityStep data={data} onChange={updateData} />}
        {step === 5 && (
          <EventSignUpSheetStep eventType={data.eventType} data={data} onChange={updateData} />
        )}
      </Card>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Navigation Buttons - Hide on Step 0 */}
      {step > 0 && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {step < totalSteps ? (
            <Button onClick={handleNext} disabled={!canProceed() || isSubmitting}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canProceed() || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating event...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Create Event
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
