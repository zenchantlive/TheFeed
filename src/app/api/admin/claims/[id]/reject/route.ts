import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth, AdminSession } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { providerClaims, adminAuditLog } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const POST = withAdminAuth(async (req: NextRequest, context: AdminSession & { params: { id: string } }) => {
    try {
        const claimId = context.params.id;
        const adminUser = context;

        let payload: { reason?: string };
        try {
            payload = await req.json();
        } catch (e) {
            return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
        }
        const { reason } = payload;

        if (!reason) {
            return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
        }

        // 1. Get the claim
        const claim = await db.query.providerClaims.findFirst({
            where: eq(providerClaims.id, claimId),
        });

        if (!claim) {
            return NextResponse.json({ error: "Claim not found" }, { status: 404 });
        }

        if (claim.status !== "pending") {
            return NextResponse.json(
                { error: `Claim is already ${claim.status}` },
                { status: 400 }
            );
        }

        // 2. Update claim status
        await db.transaction(async (tx) => {
            await tx
                .update(providerClaims)
                .set({
                    status: "rejected",
                    reviewedBy: adminUser.userId,
                    reviewedAt: new Date(),
                    reviewNotes: reason,
                })
                .where(eq(providerClaims.id, claimId));

            // 3. Log audit event
            await tx.insert(adminAuditLog).values({
                adminId: adminUser.userId,
                action: "reject_claim",
                resourceId: claim.resourceId,
                changes: {
                    claimId: { old: null, new: claimId },
                    status: { old: "pending", new: "rejected" },
                },
                reason: reason,
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error rejecting claim:", error);
        return NextResponse.json(
            { error: "Failed to reject claim" },
            { status: 500 }
        );
    }
});
