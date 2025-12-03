import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth, AdminSession } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { providerClaims, foodBanks, adminAuditLog } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const POST = withAdminAuth(async (req: NextRequest, context: AdminSession & { params: { id: string } }) => {
    try {
        const claimId = context.params.id;
        const adminUser = context; // context is the AdminSession

        // 1. Get the claim and its associated resource
        const claim = await db.query.providerClaims.findFirst({
            where: eq(providerClaims.id, claimId),
            with: {
                resource: true,
            },
        });

        if (!claim) {
            return NextResponse.json({ error: "Claim not found" }, { status: 404 });
        }

        // Check if the resource is already claimed
        if (claim.resource.claimedBy) {
            return NextResponse.json({ error: "Resource is already claimed by another user" }, { status: 409 });
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
                    status: "approved",
                    reviewedBy: adminUser.userId,
                    reviewedAt: new Date(),
                })
                .where(eq(providerClaims.id, claimId));

            // 3. Update resource ownership
            await tx
                .update(foodBanks)
                .set({
                    claimedBy: claim.userId,
                    claimedAt: new Date(),
                    providerRole: "owner",
                    providerVerified: true,
                    providerCanEdit: true,
                    verificationStatus: "community_verified", // Upgrade verification status
                })
                .where(eq(foodBanks.id, claim.resourceId));

            // 4. Log audit event
            await tx.insert(adminAuditLog).values({
                adminId: adminUser.userId,
                action: "approve_claim",
                resourceId: claim.resourceId,
                changes: {
                    claimId: { old: null, new: claimId },
                    status: { old: "pending", new: "approved" },
                },
                reason: "Provider claim approved",
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error approving claim:", error);
        return NextResponse.json(
            { error: "Failed to approve claim" },
            { status: 500 }
        );
    }
});
