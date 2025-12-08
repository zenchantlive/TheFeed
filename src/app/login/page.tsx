"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UtensilsCrossed, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

function LoginContent() {
    const searchParams = useSearchParams();
    const returnUrl = searchParams.get("returnUrl") || "/profile";
    const [isLoading, setIsLoading] = useState(false);

    const handleSignIn = async () => {
        setIsLoading(true);
        try {
            await signIn.social({
                provider: "google",
                callbackURL: returnUrl,
            });
        } catch (error) {
            console.error("Login error:", error);
            toast.error("Failed to sign in. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md shadow-lg border-border/60 bg-card/95 backdrop-blur">
            <CardHeader className="text-center space-y-2">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary mb-2">
                    <UtensilsCrossed className="h-7 w-7" />
                </div>
                <CardTitle className="text-2xl font-bold">Welcome directly to TheFeed</CardTitle>
                <CardDescription className="text-base">
                    Sign in to connect with neighbors, share food, and host events.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button
                    onClick={handleSignIn}
                    className="w-full h-11 text-base font-semibold"
                    size="lg"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                        </>
                    ) : (
                        "Sign in with Google"
                    )}
                </Button>
                <p className="text-xs text-center text-muted-foreground px-4">
                    By continuing, you agree to our Community Guidelines and Privacy Policy.
                </p>
            </CardContent>
        </Card>
    );
}

export default function LoginPage() {
    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/30 p-4">
            <Suspense fallback={<div className="flex items-center gap-2"><Loader2 className="h-6 w-6 animate-spin text-primary" /><span>Loading...</span></div>}>
                <LoginContent />
            </Suspense>
        </div>
    );
}
