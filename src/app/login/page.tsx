import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { SignInActions } from "./sign-in-actions";

type LoginPageSearchParams = {
  returnUrl?: string;
  callbackUrl?: string;
};

const sanitizeCallback = (value?: string) => {
  if (!value) return "/profile";

  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith("/")) {
      return decoded;
    }
  } catch (error) {
    console.warn("Invalid callback URL provided to /login", error);
  }

  return "/profile";
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<LoginPageSearchParams>;
}) {
  const params = await searchParams;
  const callbackUrl = sanitizeCallback(params.callbackUrl ?? params.returnUrl);
  const session = await auth.api.getSession({ headers: await headers() });

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-border/60 bg-card p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Sign in to continue</h1>
          <p className="text-sm text-muted-foreground">
            You&apos;ll be returned to what you were doing once you finish signing in.
          </p>
        </div>

        <SignInActions callbackUrl={callbackUrl} />

        <p className="text-xs text-muted-foreground text-center">
          After signing in, we&apos;ll send you back to
          <span className="font-medium text-foreground"> {callbackUrl}</span>.
        </p>

        <div className="flex items-center justify-center gap-3 text-sm">
          <Link href="/" className="text-primary hover:underline">
            Back home
          </Link>
          <span className="text-muted-foreground">•</span>
          <Link href="/help" className="text-primary hover:underline">
            Need help signing in?
          </Link>
        </div>

        <Button asChild variant="ghost" className="w-full text-sm">
          <Link href={callbackUrl}>Continue without signing in</Link>
        </Button>
      </div>
    </div>
  );
}
