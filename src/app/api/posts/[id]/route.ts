import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getPostById, updatePost, deletePost } from "@/lib/post-queries";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/posts/[id]
 * Fetch a single post by ID
 */
export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const post = await getPostById(id);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post, { status: 200 });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/posts/[id]
 * Update a post (only by the author)
 */
export async function PATCH(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Check if post exists and user is the author
    const existingPost = await getPostById(id);

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (existingPost.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only edit your own posts" },
        { status: 403 }
      );
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

    // Validate fields if provided
    if (content !== undefined) {
      if (typeof content !== "string" || content.trim().length === 0) {
        return NextResponse.json(
          { error: "Content cannot be empty" },
          { status: 400 }
        );
      }
      if (content.length > 5000) {
        return NextResponse.json(
          { error: "Content exceeds maximum length of 5000 characters" },
          { status: 400 }
        );
      }
    }

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

    // Update the post
    const updated = await updatePost(id, {
      content: content ? content.trim() : undefined,
      mood,
      kind,
      location,
      locationCoords,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      urgency,
      photoUrl,
      metadata,
    });

    return NextResponse.json({ success: true, post: updated }, { status: 200 });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/posts/[id]
 * Delete a post (only by the author)
 */
export async function DELETE(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Check if post exists and user is the author
    const existingPost = await getPostById(id);

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (existingPost.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only delete your own posts" },
        { status: 403 }
      );
    }

    // Delete the post
    await deletePost(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
