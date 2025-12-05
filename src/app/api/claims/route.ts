import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { providerClaims, foodBanks } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const claimSchema = z.object({
    resourceId: z.string().min(1),
    claimReason: z.string().min(10, "Reason must be at least 10 characters"),
    verificationInfo: z.object({
        jobTitle: z.string().min(2, "Job title is required"),
        workEmail: z.string().email().optional().or(z.literal("")),
        workPhone: z.string().min(10, "Valid phone number is required"),
        verificationMethod: z.enum(["phone_call", "email_domain", "website_access", "other"]),
    }),
});

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validation = claimSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid request data", details: validation.error.flatten() },
                { status: 400 }
            );
        }

        const { resourceId, claimReason, verificationInfo } = validation.data;

        // Check if resource exists
        const resource = await db.query.foodBanks.findFirst({
            where: eq(foodBanks.id, resourceId),
        });

        if (!resource) {
            return NextResponse.json({ error: "Resource not found" }, { status: 404 });
        }

        // Check if already claimed by ANYONE (approved)
        if (resource.claimedBy) {
            return NextResponse.json(
                { error: "This resource is already claimed and managed by another user." },
                { status: 409 }
            );
        }

        // Check if THIS user already has a pending claim for this resource
        const existingClaim = await db.query.providerClaims.findFirst({
            where: and(
                eq(providerClaims.resourceId, resourceId),
                eq(providerClaims.userId, session.user.id),
                eq(providerClaims.status, "pending")
            ),
        });

        if (existingClaim) {
            return NextResponse.json(
                { error: "You already have a pending claim for this resource." },
                { status: 409 }
            );
        }

        // Create the claim
        await db.insert(providerClaims).values({
            resourceId,
            userId: session.user.id,
            status: "pending",
            claimReason,
            verificationInfo,
        });

        return NextResponse.json({ success: true, message: "Claim submitted successfully" });
    } catch (error) {
        console.error("Error submitting claim:", error);
        return NextResponse.json(
            { error: "Failed to submit claim" },
            { status: 500 }
        );
    }
}
