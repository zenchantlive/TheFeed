import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { communityPosts, postComments } from "@/lib/schema";
import { desc, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";

// GET /api/community/posts - Fetch posts with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get("filter") || "all"; // "all" | "shares" | "requests" | "updates"
    const includeDemo = searchParams.get("includeDemo") === "true";

    // Build where conditions using SQL builder
    const whereConditions = [];

    if (filter === "shares") {
      whereConditions.push(eq(communityPosts.kind, "share"));
    } else if (filter === "requests") {
      whereConditions.push(eq(communityPosts.kind, "request"));
    } else if (filter === "updates") {
      whereConditions.push(sql`${communityPosts.kind} IN ('update', 'resource')`);
    }

    if (!includeDemo) {
      whereConditions.push(eq(communityPosts.isDemo, false));
    }

    // Build the final where clause
    const whereClause =
      whereConditions.length > 0
        ? sql`${sql.join(whereConditions, sql` AND `)}`
        : undefined;

    // Use relational queries to eager-load comments and reactions
    // This avoids N+1 queries by fetching everything in 3 efficient queries
    const posts = await db.query.communityPosts.findMany({
      where: whereClause,
      orderBy: [desc(communityPosts.createdAt)],
      limit: 50,
      with: {
        comments: {
          orderBy: [postComments.createdAt],
          with: {
            reactions: true,
          },
        },
        reactions: true,
      },
    });

    // Transform the data to match the expected format
    const postsWithDetails = posts.map((post) => ({
      id: post.id,
      userId: post.userId,
      authorName: post.authorName,
      mood: post.mood,
      kind: post.kind,
      body: post.body,
      location: post.location,
      availableUntil: post.availableUntil,
      tags: post.tags,
      status: post.status,
      latitude: post.latitude,
      longitude: post.longitude,
      isDemo: post.isDemo,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      comments: post.comments.map((comment) => ({
        id: comment.id,
        authorName: comment.authorName,
        body: comment.body,
        createdAt: comment.createdAt,
        helpfulCount:
          comment.reactions?.filter((r) => r.type === "helpful").length || 0,
      })),
      reactions: {
        onIt: post.reactions.filter((r) => r.type === "on-it").length,
      },
    }));

    return NextResponse.json({ posts: postsWithDetails });
  } catch (error) {
    console.error("Error fetching community posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// POST /api/community/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      mood,
      kind,
      body: postBody,
      location,
      availableUntil,
      tags,
      latitude,
      longitude,
    } = body;

    // Validate required fields
    if (!mood || !kind || !postBody) {
      return NextResponse.json(
        { error: "Missing required fields: mood, kind, body" },
        { status: 400 }
      );
    }

    // Validate mood and kind values
    const validMoods = ["hungry", "full", "update"];
    const validKinds = ["share", "request", "update", "resource"];

    if (!validMoods.includes(mood)) {
      return NextResponse.json(
        { error: `Invalid mood. Must be one of: ${validMoods.join(", ")}` },
        { status: 400 }
      );
    }

    if (!validKinds.includes(kind)) {
      return NextResponse.json(
        { error: `Invalid kind. Must be one of: ${validKinds.join(", ")}` },
        { status: 400 }
      );
    }

    // Create the post
    const [newPost] = await db
      .insert(communityPosts)
      .values({
        userId: session.user.id,
        authorName: session.user.name,
        mood,
        kind,
        body: postBody,
        location: location || null,
        availableUntil: availableUntil || null,
        tags: tags || null,
        latitude: latitude || null,
        longitude: longitude || null,
        status: "community",
        isDemo: false,
      })
      .returning();

    return NextResponse.json({ post: newPost }, { status: 201 });
  } catch (error) {
    console.error("Error creating community post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
