"use client";

import { signIn, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SignInButtonProps {
  callbackURL?: string;
}

export function SignInButton({ callbackURL = "/profile" }: SignInButtonProps) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <Button disabled>Loading...</Button>;
  }

  if (session) {
    return null;
  }

  return (
    <Button
      onClick={async () => {
        try {
          await signIn.social({
            provider: "google",
            callbackURL,
          });
        } catch (error) {
          console.error("Sign in error (full):", error);
          console.error("Error type:", typeof error);
          console.error("Error constructor:", error?.constructor?.name);

          // Log more details for debugging
          if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
          }

          // User-friendly toast notification
          toast.error("Sign in failed", {
            description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
          });
        }
      }}
    >
      Sign in
    </Button>
  );
}
