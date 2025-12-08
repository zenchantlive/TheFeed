"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowRight, MapPin } from "lucide-react";
import { getUserLocation } from "@/lib/geolocation";

export default function OnboardingPage() {
    const [step, setStep] = useState(1);
    const [intent, setIntent] = useState("share");
    const [isLoadingLoc, setIsLoadingLoc] = useState(false);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [zipCode, setZipCode] = useState("");

    const router = useRouter();

    const handleNext = () => setStep(step + 1);

    const handleUseLocation = async () => {
        setIsLoadingLoc(true);
        try {
            const coords = await getUserLocation();
            setLocation(coords);
            console.log("Location acquired:", coords);
        } catch (error: unknown) {
            console.error("Failed to get location", error);
            alert("Could not access location. Please check permissions or enter zip code manually.");
        } finally {
            setIsLoadingLoc(false);
        }
    };

    const handleFinish = () => {
        const params = new URLSearchParams();
        if (intent) params.set("intent", intent);

        if (location) {
            params.set("lat", location.lat.toString());
            params.set("lng", location.lng.toString());
        } else if (zipCode) {
            params.set("zip", zipCode);
        }

        router.push(`/community?${params.toString()}`);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
            <Card className="w-full max-w-md">

                {step === 1 && (
                    <>
                        <CardHeader>
                            <CardTitle>Welcome to TheFeed! 👋</CardTitle>
                            <CardDescription>What brings you to the neighborhood today?</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RadioGroup defaultValue="share" onValueChange={setIntent} className="grid gap-4">
                                <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                                    <RadioGroupItem value="share" id="share" />
                                    <Label htmlFor="share" className="flex-1 cursor-pointer font-medium">I want to share food or host events</Label>
                                </div>
                                <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                                    <RadioGroupItem value="need" id="need" />
                                    <Label htmlFor="need" className="flex-1 cursor-pointer font-medium">I&apos;m looking for food resources</Label>
                                </div>
                                <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                                    <RadioGroupItem value="volunteer" id="volunteer" />
                                    <Label htmlFor="volunteer" className="flex-1 cursor-pointer font-medium">I want to volunteer</Label>
                                </div>
                            </RadioGroup>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" onClick={handleNext}>
                                Next <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </>
                )}

                {step === 2 && (
                    <>
                        <CardHeader>
                            <CardTitle>Where are you located?</CardTitle>
                            <CardDescription>We match you with your local neighborhood.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Button
                                    variant={location ? "default" : "outline"}
                                    className="w-full transition-all"
                                    onClick={handleUseLocation}
                                    disabled={isLoadingLoc || !!location}
                                >
                                    <MapPin className="mr-2 h-4 w-4" />
                                    {isLoadingLoc ? "Locating..." : location ? "Location Acquired ✔" : "Use Current Location"}
                                </Button>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Or enter zip code</span>
                                </div>
                            </div>
                            <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor="zip">Zip Code</Label>
                                <Input
                                    id="zip"
                                    placeholder="e.g. 95628"
                                    value={zipCode}
                                    onChange={(e) => setZipCode(e.target.value)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                onClick={handleFinish}
                                disabled={!location && !zipCode}
                            >
                                Finish Setup
                            </Button>
                        </CardFooter>
                    </>
                )}

            </Card>
        </div>
    );
}
