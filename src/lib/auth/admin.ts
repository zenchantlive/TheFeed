import { NextRequest, NextResponse } from "next/server";
import { auth } from "../auth";
import { db } from "../db";
import { userProfiles } from "../schema";

type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;

export type AdminSession = {
  userId: string;
  session: NonNullable<AuthSession>;
  profile: typeof userProfiles.$inferSelect | null;
};

/**
 * Validates that the incoming request belongs to an authenticated admin.
 * Returns the session plus the associated user profile for downstream checks.
 */
export async function validateAdminSession(
  req: NextRequest | Request
): Promise<AdminSession | null> {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session?.user?.id) {
    return null;
  }

  const envAdminId = process.env.ADMIN_USER_ID;
  const profile = await db.query.userProfiles.findFirst({
    where: (profiles, { eq }) => eq(profiles.userId, session.user.id),
  });

  const isEnvAdmin = Boolean(envAdminId && envAdminId === session.user.id);
  const isRoleAdmin = profile?.role === "admin";

  if (!isEnvAdmin && !isRoleAdmin) {
    return null;
  }

  return {
    userId: session.user.id,
    session: session as NonNullable<AuthSession>,
    profile: profile ?? null,
  };
}

/**
 * Middleware wrapper for API routes that require admin privileges.
 * Returns a new handler that validates admin access before calling the original handler.
 */
export function withAdminAuth<T extends NextRequest | Request, C = any>(
  handler: (req: T, context: AdminSession & C) => Promise<Response>
) {
  return async (req: T, context: C): Promise<Response> => {
    const adminSession = await validateAdminSession(req);

    if (!adminSession) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Merge the route context (params) with the admin session
    const mergedContext = { ...context, ...adminSession };

    return handler(req, mergedContext);
  };
}
