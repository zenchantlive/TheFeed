import { notFound } from "next/navigation";
import { getNormalizedResources } from "@/lib/resource-feed";
import { LocationCard } from "@/components/foodshare/location-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Share2, Flag, Edit, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { isCurrentlyOpen } from "@/lib/geolocation";
import { Badge } from "@/components/ui/badge";

interface PageProps {
    params: { id: string };
}

export default async function ResourcePage({ params }: PageProps) {
    const { id } = params;
    const resources = await getNormalizedResources({ id });
    const resource = resources[0];

    if (!resource) {
        notFound();
    }

    const isOpen = resource.hours ? isCurrentlyOpen(resource.hours) : false;

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Hero Section */}
            <div className="relative h-64 w-full bg-muted overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20" />
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <MapPin className="h-32 w-32" />
                </div>
                <div className="absolute top-4 left-4">
                    <Button asChild variant="secondary" size="sm" className="shadow-sm">
                        <Link href="/map">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Map
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="mx-auto max-w-4xl px-4 -mt-20 relative z-10">
                <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
                    {/* Main Content */}
                    <div className="space-y-6">
                        <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-lg">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight">{resource.name}</h1>
                                    <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                                        <MapPin className="h-4 w-4" />
                                        <span>{resource.address}, {resource.city}, {resource.state} {resource.zipCode}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    {resource.verificationStatus === "official" && (
                                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                            <CheckCircle2 className="mr-1 h-3 w-3" /> Verified
                                        </Badge>
                                    )}
                                    <Button asChild variant="outline" size="sm" className="gap-2">
                                        <Link href={`/map?resource=${resource.id}`}>
                                            <MapPin className="h-4 w-4" />
                                            View on Map
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                <Button className="w-full" size="lg">
                                    Get Directions
                                </Button>
                                <Button variant="outline" className="w-full" size="lg">
                                    <Share2 className="mr-2 h-4 w-4" /> Share
                                </Button>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
                            <h2 className="text-xl font-semibold mb-4">Details</h2>
                            <LocationCard
                                location={resource}
                                isOpen={isOpen}
                                className="border-0 shadow-none p-0"
                            />
                        </div>

                        {resource.aiSummary && (
                            <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
                                <h2 className="text-xl font-semibold mb-4">About this location</h2>
                                <p className="text-muted-foreground leading-relaxed">{resource.aiSummary}</p>
                                <div className="mt-4 text-xs text-muted-foreground">
                                    Generated by AI based on available data.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar / Actions */}
                    <div className="space-y-6">
                        <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
                            <h3 className="font-semibold mb-4">Community Actions</h3>
                            <div className="space-y-3">
                                <Button variant="outline" className="w-full justify-start" size="sm">
                                    <Edit className="mr-2 h-4 w-4" /> Suggest an Edit
                                </Button>
                                <Button variant="outline" className="w-full justify-start" size="sm">
                                    <Flag className="mr-2 h-4 w-4" /> Report Issue
                                </Button>
                                <Button variant="outline" className="w-full justify-start" size="sm">
                                    Claim this Listing
                                </Button>
                            </div>
                            <p className="mt-4 text-xs text-muted-foreground text-center">
                                Help us keep this information accurate for everyone.
                            </p>
                        </div>

                        {/* Placeholder for "Nearby Events" or similar */}
                        <div className="rounded-3xl border border-border/60 bg-muted/30 p-6 text-center">
                            <h3 className="font-semibold mb-2">Have you visited?</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Leave a review or update the status to help others.
                            </p>
                            <Button variant="secondary" size="sm">
                                Write Review
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
