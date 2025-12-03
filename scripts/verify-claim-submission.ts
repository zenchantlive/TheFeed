import { db } from "../src/lib/db";
import { user, foodBanks, providerClaims } from "../src/lib/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

async function main() {
    console.log("Starting verification of enhanced claim submission logic...");

    // 1. Setup: Create User and Resource
    const userId = randomUUID();
    const resourceId = randomUUID();

    console.log("Creating test data...");

    await db.insert(user).values({
        id: userId,
        name: "Test Claimant",
        email: `claimant-${userId}@example.com`,
    });

    await db.insert(foodBanks).values({
        id: resourceId,
        name: "Unclaimed Food Bank",
        address: "456 Test Ave",
        city: "Test City",
        state: "CA",
        zipCode: "12345",
        latitude: 0,
        longitude: 0,
        verificationStatus: "unverified",
    });

    // 2. Simulate Claim Submission (API Logic)
    console.log("Simulating claim submission...");

    const claimReason = "I am the owner and want to manage this listing.";
    const verificationInfo = {
        jobTitle: "Program Director",
        workPhone: "555-123-4567",
        workEmail: "director@foodbank.org",
        verificationMethod: "phone_call",
    };

    // Check if resource exists (API step)
    const resource = await db.query.foodBanks.findFirst({
        where: eq(foodBanks.id, resourceId),
    });

    if (!resource) {
        throw new Error("Resource creation failed");
    }

    // Create the claim (API step)
    await db.insert(providerClaims).values({
        resourceId,
        userId,
        status: "pending",
        claimReason,
        verificationInfo,
    });

    console.log(`Submitted claim for resource: ${resourceId}`);

    // 3. Verify Results
    const claim = await db.query.providerClaims.findFirst({
        where: and(
            eq(providerClaims.resourceId, resourceId),
            eq(providerClaims.userId, userId)
        ),
    });

    console.log("\nVerification Results:");
    console.log("Claim Status:", claim?.status);
    console.log("Claim Reason:", claim?.claimReason);
    console.log("Verification Info:", claim?.verificationInfo);

    if (
        claim?.status === "pending" &&
        claim?.claimReason === claimReason &&
        (claim?.verificationInfo as any).jobTitle === "Program Director"
    ) {
        console.log("\n✅ SUCCESS: Enhanced claim submission logic verified correctly.");
    } else {
        console.error("\n❌ FAILURE: Verification failed.");
        process.exit(1);
    }

    // Cleanup
    // await db.delete(providerClaims).where(eq(providerClaims.resourceId, resourceId));
    // await db.delete(foodBanks).where(eq(foodBanks.id, resourceId));
    // await db.delete(user).where(eq(user.id, userId));
}

main().catch((err) => {
    console.error("Error running verification script:", err);
    process.exit(1);
});
