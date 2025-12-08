"use client";

import { useSearchParams } from "next/navigation";
import { SignInButton } from "@/components/auth/sign-in-button";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";

function LoginContent() {
  const searchParams = useSearchParams();
  const rawReturnUrl = searchParams.get("returnUrl") || searchParams.get("callbackUrl");

  // Validate returnUrl to prevent open redirects
  // Only allow relative URLs (starting with /)
  const returnUrl = rawReturnUrl && rawReturnUrl.startsWith("/") ? rawReturnUrl : "/profile";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/60 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Sign in required</CardTitle>
          <CardDescription>
            Please sign in to access this page and continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-8">
          <SignInButton callbackURL={returnUrl} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
