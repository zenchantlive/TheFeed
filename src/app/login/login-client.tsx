"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn } from "lucide-react";
import { toast } from "sonner";

function normalizeCallbackPath(path: string) {
  if (!path.startsWith("/")) return "/";
  return path;
}

export function LoginClient({ callbackPath }: { callbackPath: string }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const targetPath = useMemo(() => normalizeCallbackPath(callbackPath || "/"), [callbackPath]);

  useEffect(() => {
    if (session) {
      router.replace(targetPath);
    }
  }, [session, router, targetPath]);

  const handleSignIn = async () => {
    try {
      await signIn.social({
        provider: "google",
        callbackURL: targetPath,
      });
    } catch (error) {
      toast.error("Sign in failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg">
      <Card className="border-border/60 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <LogIn className="h-5 w-5" />
            Sign in to continue
          </CardTitle>
          <CardDescription>
            Access community posting, RSVP to events, and save nearby food resources.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You&apos;ll be redirected back to {targetPath === "/" ? "the home page" : targetPath} after signing in.
          </p>
          <Button
            className="w-full justify-center gap-2"
            onClick={handleSignIn}
            disabled={isPending && !session}
          >
            <LogIn className="h-4 w-4" />
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
