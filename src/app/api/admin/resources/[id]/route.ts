import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { withAdminAuth } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { foodBanks, type HoursType } from "@/lib/schema";
import { geocodeAddress } from "@/lib/server-geocoding";
import { createResourceVersion } from "@/lib/versioning";
import { logAdminAction } from "@/lib/audit";

const updateResourceSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(2).optional(),
  zipCode: z.string().min(5).optional(),
  phone: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  services: z.array(z.string()).nullable().optional(),
  hours: z
    .record(
      z.string(),
      z
        .object({
          open: z.string(),
          close: z.string(),
          closed: z.boolean().optional(),
        })
        .nullable()
    )
    .nullable()
    .optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const PUT = withAdminAuth(async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> } & import("@/lib/auth/admin").AdminSession
) => {
  try {
    const { id } = await context.params;
    const { userId } = context;
    const body = await req.json();
    const validation = updateResourceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const updates = validation.data;
    const hasUpdates = Object.keys(updates).length > 0;

    if (!hasUpdates) {
      return NextResponse.json(
        { error: "No updates provided" },
        { status: 400 }
      );
    }

    // Fetch current record to check for address changes
    const currentRecord = await db.query.foodBanks.findFirst({
      where: eq(foodBanks.id, id),
    });

    if (!currentRecord) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    // Determine changed fields for versioning
    const changedFields = Object.keys(updates).filter(key => {
      const new_value = updates[key as keyof typeof updates];
      const old_value = currentRecord[key as keyof typeof currentRecord];

      if (typeof new_value === 'object' && new_value !== null && typeof old_value === 'object' && old_value !== null) {
        // For objects and arrays, a simple stringify is unreliable.
        // A more robust deep-equal check is needed. For now, we'll stick to stringify but acknowledge its limitations.
        // A proper deep-equal function would be the best solution.
        // As a pragmatic improvement, we can at least sort object keys before stringifying for simple objects.
        const sortObjectKeys = (obj: unknown): unknown => {
          if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
            return obj;
          }
          return Object.keys(obj as Record<string, unknown>).sort().reduce((acc, key) => {
            acc[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
            return acc;
          }, {} as Record<string, unknown>);
        };
        return JSON.stringify(sortObjectKeys(new_value)) !== JSON.stringify(sortObjectKeys(old_value));
      }

      return new_value !== old_value;
    });

    // Handle automatic geocoding if address fields change but coords aren't provided
    let newCoords = {};
    const addressChanged =
      (updates.address && updates.address !== currentRecord.address) ||
      (updates.city && updates.city !== currentRecord.city) ||
      (updates.state && updates.state !== currentRecord.state);

    const manualCoordsProvided =
      updates.latitude !== undefined || updates.longitude !== undefined;

    if (addressChanged && !manualCoordsProvided) {
      const address = updates.address ?? currentRecord.address;
      const city = updates.city ?? currentRecord.city;
      const state = updates.state ?? currentRecord.state;

      const geocoded = await geocodeAddress(address, city, state);
      if (geocoded) {
        newCoords = {
          latitude: geocoded.latitude,
          longitude: geocoded.longitude,
        };
      }
    }

    const [updatedRecord] = await db
      .update(foodBanks)
      .set({
        ...updates,
        ...newCoords,
        updatedAt: new Date(),
        // Cast explicit nulls or undefined correctly for Drizzle
        hours: updates.hours as HoursType | null | undefined,
      })
      .where(eq(foodBanks.id, id))
      .returning();

    // Create version snapshot
    await createResourceVersion(
      id,
      userId,
      "admin_edit",
      changedFields,
      []
    );

    // Log admin action
    await logAdminAction({
      adminId: userId,
      action: "edit",
      resourceId: id,
      changes: changedFields.reduce((acc, field) => {
        acc[field] = {
          old: currentRecord[field as keyof typeof currentRecord],
          new: updates[field as keyof typeof updates]
        };
        return acc;
      }, {} as Record<string, { old: unknown; new: unknown }>),
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      userAgent: req.headers.get("user-agent"),
    });

    return NextResponse.json({ resource: updatedRecord });
  } catch (err) {
    console.error("Error updating resource:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
