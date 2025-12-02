import { auth } from "./auth";
import { NextRequest, NextResponse } from "next/server";

type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;
type ValidatedSession = {
  userId: string;
  session: NonNullable<AuthSession>;
};

/**
 * Middleware function to validate user sessions server-side.
 * Ensures that the user is authenticated and extracts user data from the session
 * instead of trusting client-provided headers.
 */
export async function validateSession(
  req: NextRequest | Request
): Promise<ValidatedSession | null> {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session?.user?.id) {
    return null;
  }

  const validSession = session as NonNullable<AuthSession>;
  return {
    userId: validSession.user.id,
    session: validSession,
  };
}

/**
 * Middleware wrapper for API routes that require authentication.
 * Returns 401 if user is not authenticated.
 */
export async function withAuth<T extends NextRequest | Request>(
  req: T,
  handler: (
    req: T,
    context: ValidatedSession
  ) => Promise<Response>
): Promise<Response> {
  const sessionData = await validateSession(req);

  if (!sessionData) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  return handler(req, sessionData);
}

export type { validateAdminSession as ValidateAdminSession } from "./auth/admin";
export { withAdminAuth } from "./auth/admin";
