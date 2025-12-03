import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { foodBanks } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
    description: z.string().optional(),
    phone: z.string().optional(),
    website: z.string().url().optional().or(z.literal("")),
});

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const validation = updateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid request data", details: validation.error.flatten() },
                { status: 400 }
            );
        }

        // Verify ownership
        const resource = await db.query.foodBanks.findFirst({
            where: eq(foodBanks.id, id),
        });

        if (!resource) {
            return NextResponse.json({ error: "Resource not found" }, { status: 404 });
        }

        if (resource.claimedBy !== session.user.id) {
            return NextResponse.json(
                { error: "You do not have permission to edit this resource." },
                { status: 403 }
            );
        }

        // Perform update
        await db
            .update(foodBanks)
            .set({
                ...validation.data,
                updatedAt: new Date(),
            })
            .where(eq(foodBanks.id, id));

        return NextResponse.json({ success: true, message: "Resource updated successfully" });
    } catch (error) {
        console.error("Error updating resource:", error);
        return NextResponse.json(
            { error: "Failed to update resource" },
            { status: 500 }
        );
    }
}
