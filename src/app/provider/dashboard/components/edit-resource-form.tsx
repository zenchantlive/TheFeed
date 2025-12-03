"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import type { FoodBank } from "@/lib/schema";

interface EditResourceFormProps {
    resource: FoodBank;
}

export function EditResourceForm({ resource }: EditResourceFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Form State
    const [description, setDescription] = useState(resource.description || "");
    const [phone, setPhone] = useState(resource.phone || "");
    const [website, setWebsite] = useState(resource.website || "");
    // We'll add services and hours later as they require more complex UI

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`/api/provider/resources/${resource.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description,
                    phone,
                    website,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to update resource");
            }

            router.refresh();
            // We rely on the parent dialog to close, or we could add a success message here
            alert("Resource updated successfully!");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    placeholder="Tell the community about your organization..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[120px]"
                />
            </div>

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

            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>
        </form>
    );
}
