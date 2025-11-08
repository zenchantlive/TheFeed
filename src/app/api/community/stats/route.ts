import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { communityPosts, postComments } from "@/lib/schema";
import { sql } from "drizzle-orm";

// GET /api/community/stats - Get real-time community statistics
export async function GET() {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Run all queries in parallel for better performance
    const [
      [sharesResult],
      [recentPostsResult],
      [commentsResult],
    ] = await Promise.all([
      // Count active posts today (shares and requests, excluding demo)
      db
        .select({ count: sql<number>`count(*)` })
        .where(
          and(
            eq(communityPosts.kind, "share"),
            eq(communityPosts.isDemo, false),
            gte(communityPosts.createdAt, todayStart)
          )
        )
      // Count total posts in last 24 hours (excluding demo)
      db
        .select({ count: sql<number>`count(*)` })
        .from(communityPosts)
        .where(
          sql`${communityPosts.isDemo} = false AND ${communityPosts.createdAt} >= ${twentyFourHoursAgo}`
        ),
      // Count guide replies today (comments where author is a guide)
      // For now, we'll count all comments from the last 24 hours
      db
        .select({ count: sql<number>`count(*)` })
        .from(postComments)
        .where(sql`${postComments.createdAt} >= ${twentyFourHoursAgo}`),
    ]);

    // Get count of active food banks nearby (from existing food banks data)
    // This would ideally use geolocation, but for now we'll return a placeholder
    const activeFoodBanks = 0; // Will be enhanced later with actual geolocation

    const stats = {
      neighborsSharing: Number(sharesResult?.count || 0),
      recentPosts: Number(recentPostsResult?.count || 0),
      guideReplies: Number(commentsResult?.count || 0),
      openLocations: activeFoodBanks,
      lastUpdated: now.toISOString(),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching community stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
