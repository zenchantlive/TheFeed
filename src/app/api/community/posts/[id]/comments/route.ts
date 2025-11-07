import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { communityPosts, postComments } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/community/posts/[id]/comments - Add a comment to a post
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = await context.params;
    const body = await request.json();
    const { body: commentBody } = body;

    // Validate required fields
    if (!commentBody || typeof commentBody !== "string" || commentBody.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment body is required" },
        { status: 400 }
      );
    }

    // Check if post exists
    const post = await db.query.communityPosts.findFirst({
      where: eq(communityPosts.id, postId),
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Create the comment
    const [newComment] = await db
      .insert(postComments)
      .values({
        postId,
        userId: session.user.id,
        authorName: session.user.name,
        body: commentBody.trim(),
      })
      .returning();

    return NextResponse.json({ comment: newComment }, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
