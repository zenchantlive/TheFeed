import { LoginClient } from "./login-client";

export const metadata = {
  title: "Sign in | TheFeed",
  description: "Sign in to join events, post updates, and save nearby food resources.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const rawReturn =
    params.returnUrl || params.callbackUrl || params.callbackURL || params.redirect;
  const normalizedReturn = Array.isArray(rawReturn) ? rawReturn[0] : rawReturn;
  const trimmedReturn =
    typeof normalizedReturn === "string" && normalizedReturn.trim().length > 0
      ? normalizedReturn.trim()
      : null;
  const callbackPath = trimmedReturn?.startsWith("/") ? trimmedReturn : "/";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-5xl flex-col gap-10 px-4 py-10">
      <div className="max-w-2xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Account</p>
        <h1 className="text-3xl font-bold text-foreground">Sign in to keep sharing</h1>
        <p className="text-muted-foreground">
          Use your Google account to RSVP for events, save your favorite resources, and
          stay in sync across devices.
        </p>
      </div>

      <LoginClient callbackPath={callbackPath} />
    </div>
  );
}
