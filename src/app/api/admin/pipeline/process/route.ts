import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { foodBanks } from "@/lib/schema";
import { enhanceResource } from "@/lib/admin-enhancer";
import { and, eq, sql } from "drizzle-orm";
import { isTrustedSource } from "@/lib/resource-normalizer";

export const POST = async (req: NextRequest) => {
  return withAdminAuth(req, async () => {
    const body = await req.json().catch(() => ({}));
    const batchSize = Number(body.batchSize) || 3;

    // Find unverified resources that haven't been processed (confidenceScore = 0 or null)
    const queue = await db
      .select({ id: foodBanks.id })
      .from(foodBanks)
      .where(
        and(
          eq(foodBanks.verificationStatus, "unverified"),
          sql`${foodBanks.confidenceScore} = 0 OR ${foodBanks.confidenceScore} IS NULL`
        )
      )
      .limit(batchSize);

    if (queue.length === 0) {
      return NextResponse.json({ processed: 0, message: "Queue empty" });
    }

    const results = [];

    for (const item of queue) {
      try {
        const proposal = await enhanceResource(item.id);
        
        // Determine new status based on confidence
        // > 0.8 => high_confidence (but still unverified until human approves? Or we add a new status?)
        // The user schema doesn't have "high_confidence" status yet. It has "unverified".
        // We added buckets in UI, but DB status is still "unverified".
        // We can use confidenceScore to sort/filter in UI.
        
        // Save the findings
        const primarySource = proposal.sources[0] ?? null;
        const trustedSource = isTrustedSource(primarySource);
        const shouldAutoApprove = trustedSource && proposal.confidence >= 0.9;

        await db
          .update(foodBanks)
          .set({
            confidenceScore: proposal.confidence,
            aiSummary: proposal.summary,
            sourceUrl: primarySource,
            rawHours: proposal.rawHours,
            updatedAt: new Date(),
            verificationStatus: shouldAutoApprove ? "community_verified" : undefined,
            communityVerifiedAt: shouldAutoApprove ? new Date() : undefined,
          })
          .where(eq(foodBanks.id, item.id));

        results.push({ id: item.id, status: "success", confidence: proposal.confidence });
      } catch (error) {
        console.error(`Pipeline error for ${item.id}:`, error);
        results.push({ id: item.id, status: "error", error: String(error) });
      }
    }

    return NextResponse.json({ processed: results.length, results });
  });
};
