import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getEventsWithinRange } from "@/lib/event-queries";
import {
  addMonths,
  format,
  startOfMonth,
} from "date-fns";
import { parseMonthParam } from "./utils";
import { CalendarView, type EventTypeFilter } from "./calendar-view";

type PageProps = {
  searchParams: Promise<{
    month?: string;
    type?: EventTypeFilter;
  }>;
};

export default async function CalendarPage({ searchParams }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/");
  }

  const params = await searchParams;
  const focusedMonth = parseMonthParam(params.month);
  const eventTypeFilter: EventTypeFilter =
    params.type === "potluck" || params.type === "volunteer"
      ? params.type
      : "all";

  const rangeStart = startOfMonth(focusedMonth);
  const rangeEnd = addMonths(rangeStart, 1);

  // Fetch all events for the month (we filter by radius on the client)
  const events = await getEventsWithinRange({
    start: rangeStart,
    end: rangeEnd,
    eventType: eventTypeFilter === "all" ? undefined : eventTypeFilter,
    onlyWithCoords: true, // We only want events that can be placed on a map/have a radius
  });

  const prevMonth = format(addMonths(rangeStart, -1), "yyyy-MM");
  const nextMonth = format(addMonths(rangeStart, 1), "yyyy-MM");
  const currentMonthLabel = format(rangeStart, "MMMM yyyy");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-20 pt-8">
      <CalendarView
        initialEvents={events}
        focusedMonth={focusedMonth}
        eventTypeFilter={eventTypeFilter}
        currentMonthLabel={currentMonthLabel}
        prevMonth={prevMonth}
        nextMonth={nextMonth}
      />
    </div>
  );
}
