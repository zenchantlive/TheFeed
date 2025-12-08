"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SignInActionsProps {
  callbackUrl: string;
}

export function SignInActions({ callbackUrl }: SignInActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Button
      className="w-full"
      size="lg"
      disabled={isLoading}
      onClick={async () => {
        setIsLoading(true);
        try {
          await signIn.social({ provider: "google", callbackURL: callbackUrl });
        } catch (error) {
          console.error("Sign-in error", error);
          toast.error("Unable to sign you in", {
            description:
              error instanceof Error
                ? error.message
                : "Please try again or choose a different sign-in method.",
          });
          setIsLoading(false);
        }
      }}
    >
      {isLoading ? "Redirecting to sign in..." : "Continue with Google"}
    </Button>
  );
}
