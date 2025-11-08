/* eslint-disable react/no-unescaped-entities */
"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Info, Plus, Trash2, GripVertical } from "lucide-react";

export interface SignUpSlot {
  slotName: string;
  maxClaims: number;
  description: string;
  sortOrder: number;
}

export interface SignUpSheetData {
  useSignUpSheet: boolean;
  slots: SignUpSlot[];
}

interface EventSignUpSheetStepProps {
  eventType: "potluck" | "volunteer";
  data: SignUpSheetData;
  onChange: (data: Partial<SignUpSheetData>) => void;
}

const DEFAULT_POTLUCK_SLOTS: SignUpSlot[] = [
  { slotName: "Main dish", maxClaims: 3, description: "Serves 8-10 people", sortOrder: 0 },
  { slotName: "Side dish or salad", maxClaims: 3, description: "", sortOrder: 1 },
  { slotName: "Dessert", maxClaims: 2, description: "", sortOrder: 2 },
  { slotName: "Drinks or beverages", maxClaims: 2, description: "", sortOrder: 3 },
];

export function EventSignUpSheetStep({
  eventType,
  data,
  onChange,
}: EventSignUpSheetStepProps) {
  // Only show for potlucks
  if (eventType !== "potluck") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">All set!</h2>
          <p className="text-muted-foreground">
            Volunteer events don't need a sign-up sheet. You're ready to publish!
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Neighbors can RSVP to your volunteer event, and you'll be able to check them in when
            they arrive.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleAddSlot = () => {
    const newSlot: SignUpSlot = {
      slotName: "",
      maxClaims: 1,
      description: "",
      sortOrder: data.slots.length,
    };
    onChange({ slots: [...data.slots, newSlot] });
  };

  const handleRemoveSlot = (index: number) => {
    const newSlots = data.slots.filter((_, i) => i !== index);
    // Re-index sortOrder
    newSlots.forEach((slot, i) => {
      slot.sortOrder = i;
    });
    onChange({ slots: newSlots });
  };

  const handleUpdateSlot = (index: number, updates: Partial<SignUpSlot>) => {
    const newSlots = [...data.slots];
    newSlots[index] = { ...newSlots[index], ...updates };
    onChange({ slots: newSlots });
  };

  const handleLoadDefaults = () => {
    onChange({ slots: DEFAULT_POTLUCK_SLOTS, useSignUpSheet: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Sign-up sheet</h2>
        <p className="text-muted-foreground">
          Create categories so neighbors know what to bring
        </p>
      </div>

      {/* Enable/Disable Sign-up Sheet */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Potluck coordination:</strong> Sign-up sheets help prevent everyone from
          bringing the same thing. Neighbors can claim slots like "Main dish" or "Dessert".
        </AlertDescription>
      </Alert>

      {/* Quick Start with Defaults */}
      {data.slots.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">No sign-up categories yet</p>
          <Button onClick={handleLoadDefaults} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Load default categories
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Or add your own custom categories below
          </p>
        </div>
      )}

      {/* Existing Slots */}
      {data.slots.length > 0 && (
        <div className="space-y-3">
          {data.slots.map((slot, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start gap-3">
                <div className="mt-2 text-muted-foreground cursor-move">
                  <GripVertical className="h-5 w-5" />
                </div>

                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={`slot-name-${index}`} className="text-sm">
                        Category name
                      </Label>
                      <Input
                        id={`slot-name-${index}`}
                        type="text"
                        placeholder="e.g., Main dish"
                        value={slot.slotName}
                        onChange={(e) =>
                          handleUpdateSlot(index, { slotName: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`slot-max-${index}`} className="text-sm">
                        Max people
                      </Label>
                      <Input
                        id={`slot-max-${index}`}
                        type="number"
                        min={1}
                        max={20}
                        value={slot.maxClaims}
                        onChange={(e) =>
                          handleUpdateSlot(index, {
                            maxClaims: parseInt(e.target.value, 10) || 1,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`slot-desc-${index}`} className="text-sm">
                      Instructions (optional)
                    </Label>
                    <Textarea
                      id={`slot-desc-${index}`}
                      placeholder="e.g., Serves 8-10 people"
                      value={slot.description}
                      onChange={(e) =>
                        handleUpdateSlot(index, { description: e.target.value })
                      }
                      rows={2}
                    />
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveSlot(index)}
                  className="text-destructive hover:text-destructive mt-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Slot Button */}
      {data.slots.length > 0 && (
        <Button onClick={handleAddSlot} variant="outline" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add another category
        </Button>
      )}

      {/* Summary */}
      {data.slots.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You have {data.slots.length} categories. Neighbors can claim slots after they RSVP.
            You can always edit this later!
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
