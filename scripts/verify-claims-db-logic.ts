import { db } from "../src/lib/db";
import { user, foodBanks, providerClaims, adminAuditLog } from "../src/lib/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

async function main() {
    console.log("Starting verification of provider claims DB logic...");

    // 1. Setup: Create User and Resource
    const userId = randomUUID();
    const resourceId = randomUUID();
    const adminId = randomUUID();

    console.log("Creating test data...");

    await db.insert(user).values({
        id: userId,
        name: "Test User",
        email: `test-${userId}@example.com`,
    });

    await db.insert(user).values({
        id: adminId,
        name: "Admin User",
        email: `admin-${adminId}@example.com`,
    });

    await db.insert(foodBanks).values({
        id: resourceId,
        name: "Test Food Bank",
        address: "123 Test St",
        city: "Test City",
        state: "CA",
        zipCode: "12345",
        latitude: 0,
        longitude: 0,
        verificationStatus: "unverified",
    });

    // 2. Create Pending Claim
    const claimId = randomUUID();
    await db.insert(providerClaims).values({
        id: claimId,
        resourceId,
        userId,
        status: "pending",
        claimReason: "I am the owner",
    });

    console.log(`Created pending claim: ${claimId}`);

    // 3. Simulate Approval Transaction
    console.log("Simulating approval transaction...");

    await db.transaction(async (tx) => {
        // Update claim
        await tx
            .update(providerClaims)
            .set({
                status: "approved",
                reviewedBy: adminId,
                reviewedAt: new Date(),
            })
            .where(eq(providerClaims.id, claimId));

        // Update resource
        await tx
            .update(foodBanks)
            .set({
                claimedBy: userId,
                claimedAt: new Date(),
                providerRole: "owner",
                providerVerified: true,
                providerCanEdit: true,
                verificationStatus: "community_verified",
            })
            .where(eq(foodBanks.id, resourceId));

        // Log audit
        await tx.insert(adminAuditLog).values({
            adminId,
            action: "approve_claim",
            resourceId,
            changes: {
                claimId: { old: null, new: claimId },
                status: { old: "pending", new: "approved" },
            },
            reason: "Provider claim approved",
        });
    });

    // 4. Verify Results
    const updatedClaim = await db.query.providerClaims.findFirst({
        where: eq(providerClaims.id, claimId),
    });

    const updatedResource = await db.query.foodBanks.findFirst({
        where: eq(foodBanks.id, resourceId),
    });

    const auditLog = await db.query.adminAuditLog.findFirst({
        where: (log, { eq }) => eq(log.resourceId, resourceId),
    });

    console.log("\nVerification Results:");
    console.log("Claim Status:", updatedClaim?.status);
    console.log("Resource Claimed By:", updatedResource?.claimedBy);
    console.log("Resource Provider Role:", updatedResource?.providerRole);
    console.log("Resource Verification Status:", updatedResource?.verificationStatus);
    console.log("Audit Log Action:", auditLog?.action);

    if (
        updatedClaim?.status === "approved" &&
        updatedResource?.claimedBy === userId &&
        updatedResource?.providerRole === "owner" &&
        updatedResource?.verificationStatus === "community_verified" &&
        auditLog?.action === "approve_claim"
    ) {
        console.log("\n✅ SUCCESS: Approval logic verified correctly.");
    } else {
        console.error("\n❌ FAILURE: Verification failed.");
        process.exit(1);
    }

    // Cleanup (optional, but good for local dev)
    // await db.delete(providerClaims).where(eq(providerClaims.id, claimId));
    // await db.delete(foodBanks).where(eq(foodBanks.id, resourceId));
    // await db.delete(user).where(eq(user.id, userId));
    // await db.delete(user).where(eq(user.id, adminId));
}

main().catch((err) => {
    console.error("Error running verification script:", err);
    process.exit(1);
});
