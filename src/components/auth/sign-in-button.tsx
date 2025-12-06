"use client";

import { signIn, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignInButton() {
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
          console.log("Better Auth baseURL:", window.location.origin);
          console.log("Starting sign-in with Google...");

          await signIn.social({
            provider: "google",
            callbackURL: "/profile",
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

          alert(`Sign in failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }}
    >
      Sign in
    </Button>
  );
}
