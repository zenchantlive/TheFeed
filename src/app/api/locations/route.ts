import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { savedLocations } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { foodBankId } = await req.json();

    if (!foodBankId || typeof foodBankId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid foodBankId" },
        { status: 400 }
      );
    }

    // Check if already saved
    const existing = await db.query.savedLocations.findFirst({
      where: and(
        eq(savedLocations.userId, session.user.id),
        eq(savedLocations.foodBankId, foodBankId)
      ),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Location already saved" },
        { status: 409 }
      );
    }

    // Save the location
    const [saved] = await db
      .insert(savedLocations)
      .values({
        userId: session.user.id,
        foodBankId,
      })
      .returning();

    return NextResponse.json({ success: true, saved }, { status: 201 });
  } catch (error) {
    console.error("Error saving location:", error);
    return NextResponse.json(
      { error: "Failed to save location" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const foodBankId = searchParams.get("foodBankId");

    if (!foodBankId) {
      return NextResponse.json(
        { error: "Missing foodBankId" },
        { status: 400 }
      );
    }

    // Delete the saved location
    await db
      .delete(savedLocations)
      .where(
        and(
          eq(savedLocations.userId, session.user.id),
          eq(savedLocations.foodBankId, foodBankId)
        )
      );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting location:", error);
    return NextResponse.json(
      { error: "Failed to delete location" },
      { status: 500 }
    );
  }
}

// GET endpoint to check if a location is saved
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const foodBankId = searchParams.get("foodBankId");

    if (!foodBankId) {
      return NextResponse.json(
        { error: "Missing foodBankId" },
        { status: 400 }
      );
    }

    const saved = await db.query.savedLocations.findFirst({
      where: and(
        eq(savedLocations.userId, session.user.id),
        eq(savedLocations.foodBankId, foodBankId)
      ),
    });

    return NextResponse.json({ isSaved: Boolean(saved) }, { status: 200 });
  } catch (error) {
    console.error("Error checking location:", error);
    return NextResponse.json(
      { error: "Failed to check location" },
      { status: 500 }
    );
  }
}
