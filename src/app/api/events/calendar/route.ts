import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getEventsWithinRange } from "@/lib/event-queries";

function getMonthBounds(monthParam: string | null) {
  const now = new Date();
  if (!monthParam) {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { start, end };
  }

  const [yearStr, monthStr] = monthParam.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(monthIndex) ||
    monthIndex < 0 ||
    monthIndex > 11
  ) {
    return null;
  }

  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 1);
  return { start, end };
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month");
    const eventType = searchParams.get("eventType") as
      | "potluck"
      | "volunteer"
      | null;
    const onlyWithCoords = searchParams.get("onlyWithCoords") === "true";

    const bounds = getMonthBounds(monthParam);
    if (!bounds) {
      return NextResponse.json(
        { error: "Invalid month parameter. Expected YYYY-MM." },
        { status: 400 }
      );
    }

    const events = await getEventsWithinRange({
      start: bounds.start,
      end: bounds.end,
      eventType: eventType || undefined,
      onlyWithCoords,
    });

    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
}
