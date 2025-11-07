import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { postComments, commentReactions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/community/comments/[id]/reactions - Toggle a reaction on a comment
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: commentId } = await context.params;
    const body = await request.json();
    const { type } = body;

    // Validate reaction type (currently only "helpful" for comments)
    if (type !== "helpful") {
      return NextResponse.json(
        { error: 'Invalid reaction type. Comments only support "helpful"' },
        { status: 400 }
      );
    }

    // Check if comment exists
    const comment = await db.query.postComments.findFirst({
      where: eq(postComments.id, commentId),
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check if user already has this reaction
    const existingReaction = await db.query.commentReactions.findFirst({
      where: and(
        eq(commentReactions.commentId, commentId),
        eq(commentReactions.userId, session.user.id),
        eq(commentReactions.type, type)
      ),
    });

    if (existingReaction) {
      // Remove the reaction (toggle off)
      await db
        .delete(commentReactions)
        .where(eq(commentReactions.id, existingReaction.id));

      return NextResponse.json({
        message: "Reaction removed",
        action: "removed",
      });
    } else {
      // Add the reaction (toggle on)
      const [newReaction] = await db
        .insert(commentReactions)
        .values({
          commentId,
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
    console.error("Error toggling comment reaction:", error);
    return NextResponse.json(
      { error: "Failed to toggle reaction" },
      { status: 500 }
    );
  }
}
