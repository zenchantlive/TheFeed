import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getEventsWithinRange } from "@/lib/event-queries";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type EventTypeFilter = "all" | "potluck" | "volunteer";

type PageProps = {
  searchParams: {
    month?: string;
    type?: EventTypeFilter;
  };
};

export default async function CalendarPage({ searchParams }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/");
  }

  const params = searchParams;
  const focusedMonth = parseMonthParam(params.month);
  const eventTypeFilter: EventTypeFilter =
    params.type === "potluck" || params.type === "volunteer"
      ? params.type
      : "all";

  const rangeStart = startOfMonth(focusedMonth);
  const rangeEnd = addMonths(rangeStart, 1);

  const events = await getEventsWithinRange({
    start: rangeStart,
    end: rangeEnd,
    eventType: eventTypeFilter === "all" ? undefined : eventTypeFilter,
  });

  const eventsByDay = events.reduce<Record<string, CalendarEvent[]>>(
    (acc, event) => {
      const key = format(event.startTime, "yyyy-MM-dd");
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(event);
      return acc;
    },
    {}
  );

  const calendarStart = startOfWeek(rangeStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(endOfMonth(focusedMonth), {
    weekStartsOn: 0,
  });
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const prevMonth = format(addMonths(rangeStart, -1), "yyyy-MM");
  const nextMonth = format(addMonths(rangeStart, 1), "yyyy-MM");
  const currentMonthLabel = format(rangeStart, "MMMM yyyy");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-20 pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Community events
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            Calendar
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse potlucks and volunteer shifts, then RSVP or host your own.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/community/events/new">Host an event</Link>
          </Button>
          <Button asChild>
            <Link href="/community">Back to community</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/95 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link
              href={`/community/events/calendar?month=${prevMonth}&type=${eventTypeFilter}`}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="text-lg font-semibold">{currentMonthLabel}</div>
          <Button variant="ghost" size="icon" asChild>
            <Link
              href={`/community/events/calendar?month=${nextMonth}&type=${eventTypeFilter}`}
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "potluck", "volunteer"] as EventTypeFilter[]).map(
            (type) => (
              <Button
                key={type}
                asChild
                variant={eventTypeFilter === type ? "default" : "secondary"}
                size="sm"
                className="rounded-full"
              >
                <Link
                  href={`/community/events/calendar?month=${format(
                    rangeStart,
                    "yyyy-MM"
                  )}&type=${type}`}
                >
                  {type === "all"
                    ? "All events"
                    : type === "potluck"
                    ? "Potlucks"
                    : "Volunteer"}
                </Link>
              </Button>
            )
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/95 p-4 shadow-sm">
        <div className="grid grid-cols-7 gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center">
              {day}
            </div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-2 text-sm">
          {calendarDays.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDay[key] || [];
            return (
              <div
                key={key}
                id={`day-${key}`}
                className={cn(
                  "min-h-[120px] rounded-xl border border-border/60 p-2",
                  !isSameMonth(day, rangeStart) && "bg-muted/30 text-muted-foreground"
                )}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>{format(day, "d")}</span>
                  {dayEvents.length > 0 && (
                    <span className="text-[0.65rem] text-primary">
                      {dayEvents.length}
                    </span>
                  )}
                </div>
                <div className="mt-2 space-y-2">
                  {dayEvents.slice(0, 3).map((event) => (
                    <Link
                      key={event.id}
                      href={`/community/events/${event.id}`}
                      className="block rounded-lg border border-border/60 bg-background/80 p-2 text-xs hover:border-primary/40"
                    >
                      <span className="block font-semibold text-foreground">
                        {event.title}
                      </span>
                      <span className="block text-muted-foreground">
                        {format(event.startTime, "h:mm a")}
                      </span>
                      <Badge
                        variant="outline"
                        className="mt-1 inline-flex text-[0.65rem]"
                      >
                        {event.eventType === "potluck" ? "🎉 Potluck" : "🤝 Volunteer"}
                      </Badge>
                    </Link>
                  ))}
                  {dayEvents.length > 3 && (
                    <Link
                      href={`/community/events/calendar?month=${format(
                        rangeStart,
                        "yyyy-MM"
                      )}&type=${eventTypeFilter}#day-${key}`}
                      className="block text-[0.7rem] text-primary"
                    >
                      +{dayEvents.length - 3} more
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 lg:hidden">
        <h2 className="text-lg font-semibold">Agenda</h2>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No events scheduled this month.{" "}
            <Link href="/community/events/new" className="text-primary underline">
              Host one?
            </Link>
          </p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/community/events/${event.id}`}
                className="block rounded-2xl border border-border/60 bg-card/95 p-4 shadow-sm"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(event.startTime, "EEEE, MMM d")}
                </div>
                <h3 className="mt-1 text-base font-semibold">{event.title}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {format(event.startTime, "h:mm a")}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {event.location}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="mt-2 inline-flex text-[0.65rem]"
                >
                  {event.eventType === "potluck" ? "🎉 Potluck" : "🤝 Volunteer"}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
