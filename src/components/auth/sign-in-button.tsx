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
          await signIn.social({
            provider: "google",
            callbackURL: "/profile",
          });
        } catch (error) {
          console.error("Sign in error:", error);
          // TODO: Implement a user-friendly error notification (e.g., a toast)
        }
      }}
    >
      Sign in
    </Button>
  );
}
