import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { foodBanks } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { geocodeAddress } from "@/lib/server-geocoding";

const updateSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    bannerImage: z.string().url().optional().nullable().or(z.literal("")),
    address: z.string().min(1).optional(),
    city: z.string().min(1).optional(),
    state: z.string().length(2).optional(),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/).optional(),
    phone: z.string().optional().nullable().or(z.literal("")),
    website: z.string().url().optional().nullable().or(z.literal("")),
    services: z.array(z.string()).optional(),
    hours: z.record(z.string(), z.string()).optional().nullable(),
});



export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
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

        // Prepare update data
        const updateData: any = {
            ...validation.data,
            updatedAt: new Date(),
        };

        // Handle empty strings for nullable fields
        if (updateData.phone === "") updateData.phone = null;
        if (updateData.website === "") updateData.website = null;
        if (updateData.bannerImage === "") updateData.bannerImage = null;
        if (updateData.description === "") updateData.description = null;

        // Check if address changed - if so, re-geocode
        const addressChanged =
            (validation.data.address && validation.data.address !== resource.address) ||
            (validation.data.city && validation.data.city !== resource.city) ||
            (validation.data.state && validation.data.state !== resource.state) ||
            (validation.data.zipCode && validation.data.zipCode !== resource.zipCode);

        if (addressChanged) {
            const address = validation.data.address || resource.address;
            const city = validation.data.city || resource.city;
            const state = validation.data.state || resource.state;
            const zipCode = validation.data.zipCode || resource.zipCode;

            const coords = await geocodeAddress(address, city, state, zipCode);

            if (coords) {
                updateData.latitude = coords.latitude;
                updateData.longitude = coords.longitude;
                // Update PostGIS geometry column
                updateData.geom = sql`ST_SetSRID(ST_MakePoint(${coords.longitude}, ${coords.latitude}), 4326)`;
            } else {
                return NextResponse.json(
                    { error: "Failed to geocode the new address. Please check the address and try again." },
                    { status: 400 }
                );
            }
        }

        // Perform update
        await db
            .update(foodBanks)
            .set(updateData)
            .where(eq(foodBanks.id, id));

        return NextResponse.json({
            success: true,
            message: "Resource updated successfully",
            geocoded: addressChanged
        });
    } catch (error) {
        console.error("Error updating resource:", error);
        return NextResponse.json(
            { error: "Failed to update resource" },
            { status: 500 }
        );
    }
}
