"use client";

import { useSession } from "@/lib/auth-client";
import { useAuthModal } from "./auth-modal-context";
import { Button } from "@/components/ui/button";

export function SignInButton() {
  const { data: session, isPending } = useSession();
  const { openLogin } = useAuthModal();

  if (isPending) {
    return <Button disabled>Loading...</Button>;
  }

  if (session) {
    return null;
  }

  return (
    <Button onClick={() => openLogin()}>
      Sign in
    </Button>
  );
}
