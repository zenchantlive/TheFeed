"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";

import type { FoodBank } from "@/lib/schema";

interface EditResourceFormProps {
    resource: FoodBank;
}

export function EditResourceForm({ resource }: EditResourceFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Basic Information
    const [name, setName] = useState(resource.name || "");
    const [description, setDescription] = useState(resource.description || "");
    const [bannerImage, setBannerImage] = useState(resource.bannerImage || "");

    // Location
    const [address, setAddress] = useState(resource.address || "");
    const [city, setCity] = useState(resource.city || "");
    const [state, setState] = useState(resource.state || "");
    const [zipCode, setZipCode] = useState(resource.zipCode || "");

    // Contact
    const [phone, setPhone] = useState(resource.phone || "");
    const [website, setWebsite] = useState(resource.website || "");

    // Services
    const [services, setServices] = useState<string[]>(resource.services || []);
    const [newService, setNewService] = useState("");

    // Hours (simplified as JSON string for now)
    const [hours, setHours] = useState(
        resource.hours ? JSON.stringify(resource.hours, null, 2) : ""
    );

    const handleAddService = () => {
        if (newService.trim() && !services.includes(newService.trim())) {
            setServices([...services, newService.trim()]);
            setNewService("");
        }
    };

    const handleRemoveService = (service: string) => {
        setServices(services.filter((s) => s !== service));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // Parse hours JSON
            let parsedHours = null;
            if (hours.trim()) {
                try {
                    parsedHours = JSON.parse(hours);
                } catch (e) {
                    throw new Error("Invalid hours JSON format");
                }
            }

            const response = await fetch(`/api/provider/resources/${resource.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    description,
                    bannerImage: bannerImage || null,
                    address,
                    city,
                    state,
                    zipCode,
                    phone: phone || null,
                    website: website || null,
                    services,
                    hours: parsedHours,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to update resource");
            }

            router.refresh();
            alert("Resource updated successfully!");
            // Close dialog by triggering parent state change
            window.location.reload(); // Simple way to refresh the page
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold">Basic Information</h3>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Resource Name *</Label>
                        <Input
                            id="name"
                            placeholder="e.g., Sacramento Food Bank"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Tell the community about your organization..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="bannerImage">Banner Image URL</Label>
                        <Input
                            id="bannerImage"
                            type="url"
                            placeholder="https://example.com/banner.jpg"
                            value={bannerImage}
                            onChange={(e) => setBannerImage(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Optional: Add a banner image to appear on your resource detail page
                        </p>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Location */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold">Location</h3>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="address">Street Address *</Label>
                        <Input
                            id="address"
                            placeholder="123 Main St"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="city">City *</Label>
                            <Input
                                id="city"
                                placeholder="Sacramento"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="state">State *</Label>
                            <Input
                                id="state"
                                placeholder="CA"
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                maxLength={2}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="zipCode">Zip Code *</Label>
                            <Input
                                id="zipCode"
                                placeholder="95814"
                                value={zipCode}
                                onChange={(e) => setZipCode(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Note: Changing the address will require re-geocoding. The map location will update automatically.
                    </p>
                </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="(555) 123-4567"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                            id="website"
                            type="url"
                            placeholder="https://example.org"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <Separator />

            {/* Services */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold">Services Offered</h3>
                <div className="grid gap-2">
                    <Label>Add Services</Label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="e.g., Food Pantry, Hot Meals, etc."
                            value={newService}
                            onChange={(e) => setNewService(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddService();
                                }
                            }}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleAddService}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    {services.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {services.map((service) => (
                                <div
                                    key={service}
                                    className="flex items-center gap-1 px-3 py-1 bg-muted rounded-full text-sm"
                                >
                                    <span>{service}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveService(service)}
                                        className="ml-1 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Separator />

            {/* Hours */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold">Operating Hours</h3>
                <div className="grid gap-2">
                    <Label htmlFor="hours">Hours (JSON Format)</Label>
                    <Textarea
                        id="hours"
                        placeholder='{"monday": "9:00 AM - 5:00 PM", "tuesday": "9:00 AM - 5:00 PM"}'
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        className="min-h-[120px] font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                        Enter hours in JSON format. Example: {'{'}&#34;monday&#34;: &#34;9:00 AM - 5:00 PM&#34;{'}'}
                    </p>
                </div>
            </div>

            {error && (
                <div className="rounded-md bg-red-50 dark:bg-red-950 p-3">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save All Changes
                </Button>
            </div>
        </form>
    );
}
