import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getPosts, createPost, type PostCursor } from "@/lib/post-queries";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/posts
 * Fetch posts with cursor-based pagination and filters
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    // Parse cursor
    const cursorParam = searchParams.get("cursor");
    const cursor: PostCursor | null = cursorParam
      ? JSON.parse(cursorParam)
      : null;

    // Parse filters
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const kind = searchParams.get("kind") as
      | "share"
      | "request"
      | "update"
      | "resource"
      | null;
    const mood = searchParams.get("mood") as "hungry" | "full" | null;
    const userId = searchParams.get("userId");
    const followingFilter = searchParams.get("following") === "true";
    const includeExpired = searchParams.get("includeExpired") === "true";

    // Fetch posts
    const result = await getPosts({
      cursor,
      limit,
      kind: kind || undefined,
      mood: mood || undefined,
      userId: userId || undefined,
      followingUserId: followingFilter ? session.user.id : undefined,
      includeExpired,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/posts
 * Create a new post
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      content,
      mood,
      kind,
      location,
      locationCoords,
      expiresAt,
      urgency,
      photoUrl,
      metadata,
    } = body;

    // Validate required fields
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: "Content exceeds maximum length of 5000 characters" },
        { status: 400 }
      );
    }

    // Validate optional fields
    if (
      kind &&
      !["share", "request", "update", "resource"].includes(kind)
    ) {
      return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
    }

    if (mood && !["hungry", "full"].includes(mood)) {
      return NextResponse.json({ error: "Invalid mood" }, { status: 400 });
    }

    if (urgency && !["asap", "today", "this_week"].includes(urgency)) {
      return NextResponse.json({ error: "Invalid urgency" }, { status: 400 });
    }

    // Ensure user profile exists (create if needed)
    let profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, session.user.id),
    });

    if (!profile) {
      [profile] = await db
        .insert(userProfiles)
        .values({
          userId: session.user.id,
        })
        .returning();
    }

    // Create the post
    const post = await createPost({
      userId: session.user.id,
      content: content.trim(),
      mood: mood || null,
      kind: kind || "update",
      location: location || undefined,
      locationCoords: locationCoords || undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      urgency: urgency || undefined,
      photoUrl: photoUrl || undefined,
      metadata: metadata || undefined,
    });

    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
