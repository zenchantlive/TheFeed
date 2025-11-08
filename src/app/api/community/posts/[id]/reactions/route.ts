import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { communityPosts, postReactions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/community/posts/[id]/reactions - Toggle a reaction on a post
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = context.params;
    const body = await request.json();
    const { type } = body;

    // Validate reaction type
    const validTypes = ["on-it", "helpful"];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid reaction type. Must be one of: ${validTypes.join(", ")}` },
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

    // Check if user already has this reaction
    const existingReaction = await db.query.postReactions.findFirst({
      where: and(
        eq(postReactions.postId, postId),
        eq(postReactions.userId, session.user.id),
        eq(postReactions.type, type)
      ),
    });

    if (existingReaction) {
      // Remove the reaction (toggle off)
      await db
        .delete(postReactions)
        .where(eq(postReactions.id, existingReaction.id));

      return NextResponse.json({
        message: "Reaction removed",
        action: "removed",
      });
    } else {
      // Add the reaction (toggle on)
      const [newReaction] = await db
        .insert(postReactions)
        .values({
          postId,
          userId: session.user.id,
          type,
        })
        .returning();

      return NextResponse.json({
        message: "Reaction added",
        action: "added",
        reaction: newReaction,
      }, { status: 201 });
    }
  } catch (error) {
    console.error("Error toggling reaction:", error);
    return NextResponse.json(
      { error: "Failed to toggle reaction" },
      { status: 500 }
    );
  }
}
