/**
 * Discovery Verification API
 *
 * Handles user votes (up/down) on unverified resources.
 * Promotes resources to "community_verified" status when enough trust is established.
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { foodBanks, userVerifications, userProfiles } from "@/lib/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";

const VERIFICATION_THRESHOLD = 3; // Votes needed to promote
const KARMA_REWARD = 5;

const verifySchema = z.object({
  resourceId: z.string().uuid(),
  vote: z.enum(["up", "down", "flag"]),
  field: z.string().optional(), // e.g. "hours", "address"
});

export const POST = async (req: NextRequest) => {
  return withAuth(req, async (req, { userId }) => {
    try {
      const body = await req.json();
      const validation = verifySchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          { error: "Invalid verification data", details: validation.error },
          { status: 400 }
        );
      }

      const { resourceId, vote, field } = validation.data;

      // 1. Prevent duplicate votes (idempotency)
      const existingVote = await db
        .select()
        .from(userVerifications)
        .where(
          and(
            eq(userVerifications.userId, userId),
            eq(userVerifications.resourceId, resourceId)
          )
        )
        .limit(1);

      if (existingVote.length > 0) {
        return NextResponse.json(
          { message: "You have already verified this resource." },
          { status: 200 } // Idempotent success
        );
      }

      // 2. Record the vote
      await db.insert(userVerifications).values({
        userId,
        resourceId,
        vote,
        field,
      });

      // 3. Check for Promotion (only on upvotes)
      let statusUpdated = false;
      if (vote === "up") {
        const result = await db
          .select({ count: sql<number>`count(*)` })
          .from(userVerifications)
          .where(
            and(
              eq(userVerifications.resourceId, resourceId),
              eq(userVerifications.vote, "up")
            )
          );

        const upvotes = Number(result[0]?.count || 0);

        if (upvotes >= VERIFICATION_THRESHOLD) {
          await db
            .update(foodBanks)
            .set({
              verificationStatus: "community_verified",
              communityVerifiedAt: new Date(),
            })
            .where(eq(foodBanks.id, resourceId));
          statusUpdated = true;
        }
      }

      // 4. Reward Karma
      // Using SQL increment for atomic update
      await db
        .update(userProfiles)
        .set({
          karma: sql`${userProfiles.karma} + ${KARMA_REWARD}`,
        })
        .where(eq(userProfiles.userId, userId));

      return NextResponse.json({
        success: true,
        statusUpdated,
        karmaAwarded: KARMA_REWARD,
      });
    } catch (error) {
      console.error("Verification API Error:", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  });
};
