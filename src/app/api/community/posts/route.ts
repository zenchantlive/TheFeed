import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { communityPosts, postComments, postReactions } from "@/lib/schema";
import { desc, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";

// GET /api/community/posts - Fetch posts with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get("filter") || "all"; // "all" | "shares" | "requests" | "updates"
    const includeDemo = searchParams.get("includeDemo") === "true";

    // Build where conditions
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

    const baseQuery = db
      .select({
        id: communityPosts.id,
        userId: communityPosts.userId,
        authorName: communityPosts.authorName,
        mood: communityPosts.mood,
        kind: communityPosts.kind,
        body: communityPosts.body,
        location: communityPosts.location,
        availableUntil: communityPosts.availableUntil,
        tags: communityPosts.tags,
        status: communityPosts.status,
        latitude: communityPosts.latitude,
        longitude: communityPosts.longitude,
        isDemo: communityPosts.isDemo,
        createdAt: communityPosts.createdAt,
        updatedAt: communityPosts.updatedAt,
        // Aggregate comment and reaction counts
        commentCount: sql<number>`count(distinct ${postComments.id})`.as("comment_count"),
        reactionCount: sql<number>`count(distinct ${postReactions.id})`.as("reaction_count"),
      })
      .from(communityPosts)
      .leftJoin(postComments, eq(postComments.postId, communityPosts.id))
      .leftJoin(postReactions, eq(postReactions.postId, communityPosts.id))
      .where(whereConditions.length > 0 ? sql`${sql.join(whereConditions, sql` AND `)}` : undefined)
      .groupBy(communityPosts.id)
      .orderBy(desc(communityPosts.createdAt))
      .limit(50);

    const posts = await baseQuery;

    // Fetch comments and reactions for each post
    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        const comments = await db.query.postComments.findMany({
          where: eq(postComments.postId, post.id),
          orderBy: [postComments.createdAt],
          with: {
            reactions: true,
          },
        });

        const reactions = await db.query.postReactions.findMany({
          where: eq(postReactions.postId, post.id),
        });

        return {
          ...post,
          comments: comments.map((comment) => ({
            id: comment.id,
            authorName: comment.authorName,
            body: comment.body,
            createdAt: comment.createdAt,
            helpfulCount: comment.reactions?.filter((r) => r.type === "helpful").length || 0,
          })),
          reactions: {
            onIt: reactions.filter((r) => r.type === "on-it").length,
          },
        };
      })
    );

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
