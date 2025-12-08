"use client";

import { useAuthModal } from "./auth-modal-context";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";
import { Loader2, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export function AuthModal() {
    const { isOpen, closeLogin, returnUrl } = useAuthModal();
    const [isLoading, setIsLoading] = useState(false);

    const handleSignIn = async () => {
        setIsLoading(true);
        try {
            await signIn.social({
                provider: "google",
                callbackURL: returnUrl || "/profile",
            });
            // Note: Redirect will happen, so we might not need to close explicitly, 
            // but good practice to reset state if navigation is client-side or delayed.
            closeLogin();
        } catch (error) {
            console.error("Login error:", error);
            toast.error("Failed to sign in. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && closeLogin()}>
            <DialogContent className="sm:max-w-md border-white/20 bg-background/60 backdrop-blur-xl shadow-2xl">
                <VisuallyHidden>
                    <DialogTitle>Sign in to TheFeed</DialogTitle>
                </VisuallyHidden>

                <div className="flex flex-col items-center justify-center space-y-6 py-8 text-center">
                    {/* Logo / Icon */}
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-inner">
                        <UtensilsCrossed className="h-8 w-8" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight">
                            Join the neighborhood
                        </h2>
                        <p className="text-sm text-muted-foreground mx-auto max-w-xs">
                            Sign in to share leftovers, find food, and connect with your community.
                        </p>
                    </div>

                    <div className="w-full max-w-xs space-y-4">
                        <Button
                            onClick={handleSignIn}
                            className="w-full h-11 text-base font-semibold shadow-lg transition-all hover:scale-[1.02]"
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
                        <p className="text-[10px] text-muted-foreground">
                            By continuing, you agree to our Terms of Service and Privacy Policy.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
