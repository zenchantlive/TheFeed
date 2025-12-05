/**
 * Resource Editor Component
 *
 * Full-featured editor for food bank resources with:
 * - Inline editing of all fields
 * - AI-powered field enhancement
 * - Validation and geocoding
 * - Save/discard changes
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Save, X, Plus } from "lucide-react";
import { ConfidenceBadge } from "./confidence-badge";
import { Badge } from "@/components/ui/badge";
import type { VerificationResource } from "../types";

interface ResourceEditorProps {
  /** Resource ID to edit */
  resourceId: string;

  /** Initial resource data */
  initialResource: VerificationResource;

  /** Callback when save is successful */
  onSave: () => void;

  /** Callback when editor is closed */
  onClose: () => void;
}

export function ResourceEditor({
  resourceId,
  initialResource,
  onSave,
  onClose,
}: ResourceEditorProps) {
  // Form state
  const [formData, setFormData] = useState({
    name: initialResource.name,
    address: initialResource.address,
    city: initialResource.city,
    state: initialResource.state,
    zipCode: initialResource.zipCode,
    phone: initialResource.phone || "",
    website: initialResource.website || "",
    description: initialResource.description || "",
    services: initialResource.services || [],
    hours: initialResource.hours,
  });

  const [newService, setNewService] = useState("");

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [enhancing, setEnhancing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle field change
   */
  const handleChange = (field: string, value: string | string[] | Record<string, unknown>) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddService = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmed = newService.trim();
      if (trimmed && !formData.services.includes(trimmed)) {
        handleChange("services", [...formData.services, trimmed]);
        setNewService("");
      }
    }
  };

  const removeService = (serviceToRemove: string) => {
    handleChange(
      "services",
      formData.services.filter((s) => s !== serviceToRemove)
    );
  };

  /**
   * Enhance a specific field with AI
   */
  const handleEnhanceField = async (field: string) => {
    setEnhancing(field);
    setError(null);

    try {
      console.log(`[Enhancement] Starting enhancement for field: ${field}`);
      console.log(`[Enhancement] Resource ID: ${resourceId}`);

      const response = await fetch(
        `/api/admin/resources/${resourceId}/enhance?field=${field}`,
        { method: "POST" }
      );

      console.log(`[Enhancement] Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[Enhancement] Error response:", errorData);
        throw new Error(errorData.error || `Enhancement failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log("[Enhancement] Success data:", data);

      // Show summary message to user
      if (data.summary) {
        if (data.confidence === 0) {
          // No results found
          setError(data.summary);
          return;
        }
      }

      // Update form with enhanced data
      if (data.proposed) {
        // Handle hours specially since it's an object
        if (field === "hours" && data.proposed.hours) {
          console.log("[Enhancement] Updating hours:", data.proposed.hours);
          setFormData((prev) => ({ ...prev, hours: data.proposed.hours }));
        } else if (data.proposed[field]) {
          console.log(`[Enhancement] Updating ${field}:`, data.proposed[field]);
          setFormData((prev) => ({ ...prev, [field]: data.proposed[field] }));
        } else {
          console.warn(`[Enhancement] No data found for field ${field} in response`);
          setError(`AI couldn't find ${field} information. No updates made.`);
        }
      } else {
        console.warn("[Enhancement] No 'proposed' object in response");
        setError("Enhancement returned no data");
      }
    } catch (err) {
      console.error("[Enhancement] Full error:", err);
      setError(err instanceof Error ? err.message : `Failed to enhance ${field}`);
    } finally {
      setEnhancing(null);
    }
  };

  /**
   * Save changes
   */
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/resources/${resourceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          services: formData.services,
          hours: formData.hours,
        }),
      });

      if (!response.ok) {
        throw new Error("Save failed");
      }

      onSave();
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Check if form has changes
   */
  const hasChanges = () => {
    return (
      formData.name !== initialResource.name ||
      formData.address !== initialResource.address ||
      formData.city !== initialResource.city ||
      formData.state !== initialResource.state ||
      formData.zipCode !== initialResource.zipCode ||
      formData.phone !== (initialResource.phone || "") ||
      formData.website !== (initialResource.website || "") ||
      formData.description !== (initialResource.description || "") ||
      formData.description !== (initialResource.description || "") ||
      JSON.stringify(formData.services) !== JSON.stringify(initialResource.services || []) ||
      JSON.stringify(formData.hours) !== JSON.stringify(initialResource.hours)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with confidence badge */}
      <div className="flex items-center justify-between">
        <ConfidenceBadge
          score={initialResource.confidenceScore || 0}
          showTooltip={false}
        />
        <span className="text-xs text-muted-foreground">
          ID: {resourceId.slice(0, 8)}...
        </span>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-500/10 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Form fields */}
      <div className="space-y-4">
        {/* Name */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="name">Resource Name *</Label>
          </div>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />
        </div>

        {/* Address */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="address">Address *</Label>
          </div>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
          />
        </div>

        {/* City / State / Zip */}
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => handleChange("state", e.target.value)}
              maxLength={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zipCode">Zip *</Label>
            <Input
              id="zipCode"
              value={formData.zipCode}
              onChange={(e) => handleChange("zipCode", e.target.value)}
            />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="phone">Phone</Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEnhanceField("phone")}
              disabled={enhancing !== null}
            >
              {enhancing === "phone" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              <span className="ml-1 text-xs">Enhance</span>
            </Button>
          </div>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="(555) 555-5555"
          />
        </div>

        {/* Website */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="website">Website</Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEnhanceField("website")}
              disabled={enhancing !== null}
            >
              {enhancing === "website" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              <span className="ml-1 text-xs">Enhance</span>
            </Button>
          </div>
          <Input
            id="website"
            value={formData.website}
            onChange={(e) => handleChange("website", e.target.value)}
            placeholder="https://..."
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="description">Description</Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEnhanceField("description")}
              disabled={enhancing !== null}
            >
              {enhancing === "description" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              <span className="ml-1 text-xs">Enhance</span>
            </Button>
          </div>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={4}
            placeholder="Description of services..."
          />
        </div>

        {/* Hours of Operation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Hours of Operation</Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEnhanceField("hours")}
              disabled={enhancing !== null}
            >
              {enhancing === "hours" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              <span className="ml-1 text-xs">Find Hours</span>
            </Button>
          </div>
          {formData.hours ? (
            <div className="rounded-lg border p-3 space-y-1">
              {Object.entries(formData.hours).map(([day, hours]) => (
                <div
                  key={day}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-medium capitalize">{day}</span>
                  <span className="text-muted-foreground">
                    {hours
                      ? hours.closed
                        ? "Closed"
                        : `${hours.open} - ${hours.close}`
                      : "—"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground p-3 border rounded-lg border-dashed">
              No hours available. Click &quot;Find Hours&quot; to search automatically.
            </div>
          )}
        </div>

        {/* Services */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="services">Services (comma-separated)</Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEnhanceField("services")}
              disabled={enhancing !== null}
            >
              {enhancing === "services" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              <span className="ml-1 text-xs">Enhance</span>
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.services.map((service) => (
              <Badge key={service} variant="secondary" className="gap-1">
                {service}
                <button
                  onClick={() => removeService(service)}
                  className="ml-1 hover:text-destructive focus:outline-none"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              id="services"
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              onKeyDown={handleAddService}
              placeholder="Add a service (press Enter)..."
              className="flex-1"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const trimmed = newService.trim();
                if (trimmed && !formData.services.includes(trimmed)) {
                  handleChange("services", [...formData.services, trimmed]);
                  setNewService("");
                }
              }}
              disabled={!newService.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="ghost" onClick={onClose} disabled={isSaving}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>

        <Button
          onClick={handleSave}
          disabled={!hasChanges() || isSaving}
          className="bg-primary text-primary-foreground"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
