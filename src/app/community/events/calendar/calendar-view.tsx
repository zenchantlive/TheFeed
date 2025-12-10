"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
    endOfMonth,
    endOfWeek,
    eachDayOfInterval,
    format,
    isSameMonth,
    startOfWeek,
} from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CalendarHostButton, CalendarHostLink } from "./calendar-actions";
import { EventsListPopup, type CalendarEvent } from "./events-list-popup";
import { getUserLocation, type Coordinates } from "@/lib/geolocation";
import { filterEventsByRadius } from "@/lib/event-filtering";

export type EventTypeFilter = "all" | "potluck" | "volunteer";

type CalendarViewProps = {
    initialEvents: CalendarEvent[];
    focusedMonth: Date;
    eventTypeFilter: EventTypeFilter;
    currentMonthLabel: string;
    prevMonth: string;
    nextMonth: string;
};

const RADIUS_MILES = 10;

export function CalendarView({
    initialEvents,
    focusedMonth,
    eventTypeFilter,
    currentMonthLabel,
    prevMonth,
    nextMonth,
}: CalendarViewProps) {
    const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
    const [isLocating, setIsLocating] = useState(true);
    const [popupData, setPopupData] = useState<{
        isOpen: boolean;
        dateLabel: string;
        events: CalendarEvent[];
    }>({
        isOpen: false,
        dateLabel: "",
        events: [],
    });

    // Fetch user location on mount
    useEffect(() => {
        let mounted = true;
        getUserLocation()
            .then((coords) => {
                if (mounted) {
                    setUserLocation(coords);
                    setIsLocating(false);
                }
            })
            .catch((err) => {
                console.warn("Could not get user location", err);
                if (mounted) {
                    setIsLocating(false);
                }
            });

        return () => {
            mounted = false;
        };
    }, []);

    // Filter events based on location
    const filteredEvents = useMemo(() => {
        if (isLocating) return []; // Don't show anything while locating to avoid flash
        if (!userLocation) return initialEvents; // Fallback to all if no location
        return filterEventsByRadius(initialEvents, userLocation, RADIUS_MILES);
    }, [initialEvents, userLocation, isLocating]);

    // Group events by day
    const eventsByDay = useMemo(() => {
        return filteredEvents.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
            const key = format(event.startTime, "yyyy-MM-dd");
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(event);
            return acc;
        }, {});
    }, [filteredEvents]);

    // Calendar grid generation
    const calendarDays = useMemo(() => {
        const rangeStart = focusedMonth; // Already startOfMonth from parent
        const calendarStart = startOfWeek(rangeStart, { weekStartsOn: 0 });
        const calendarEnd = endOfWeek(endOfMonth(focusedMonth), {
            weekStartsOn: 0,
        });
        return eachDayOfInterval({
            start: calendarStart,
            end: calendarEnd,
        });
    }, [focusedMonth]);

    const handleDayClick = (date: Date, events: CalendarEvent[]) => {
        if (events.length > 0) {
            setPopupData({
                isOpen: true,
                dateLabel: format(date, "EEEE, MMMM d, yyyy"),
                events,
            });
        }
    };

    return (
        <>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        Community events
                    </p>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
                        Calendar
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Browse potlucks and volunteer shifts within {RADIUS_MILES} miles.
                    </p>
                </div>
                <div className="flex gap-2">
                    <CalendarHostButton />
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
                <div className="flex items-center gap-2">
                    {!isLocating && !userLocation && (
                        <span className="text-xs text-muted-foreground mr-2">Location unavailable. Showing all.</span>
                    )}
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
                                        focusedMonth,
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

            <div className="rounded-2xl border border-border/60 bg-card/95 p-4 shadow-sm min-h-[500px]">
                {isLocating ? (
                    <div className="flex h-full w-full items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p>Locating nearby events...</p>
                        </div>
                    </div>
                ) : (
                    <>
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
                                // Requirement: "number of events on the calendar view"
                                // If > 1, show count and make clickable.
                                // If 1, show details directly? Or just show 1 and click?
                                // The prompt says: "case where where are more than one evenet on a day... when they click it, a list of those events pops up".
                                // Current implementation lists up to 3.
                                // I will change it to:
                                // If dayEvents.length > 1: Show count badge + "View all". Click -> Popup.
                                // OR: List them as before, but if > X (maybe 2 so it fits), show popup trigger.

                                // Let's implement:
                                // Always clickable day cell if events > 0.
                                // If events > 0, show a summary.
                                // User requirement: "number of evenrs on the calendar view, and when they click it, a list of those events pops up"

                                // My interpretation:
                                // Instead of listing titles, just show "3 Events" or similar?
                                // Or maybe List 1-2 and then "+X more"?
                                // The prompt implies handling the CLUTTER of multiple events.
                                // I will implement:
                                // If <= 2 events: Show cards (link directly).
                                // If > 2 events: Show "X Events" button that opens popup.
                                // Actually, "number of events on the calendar view" sounds like a badge.

                                const hasMultiple = dayEvents.length > 1; // Strict "more than one" as per prompt.

                                return (
                                    <div
                                        key={key}
                                        id={`day-${key}`}
                                        className={cn(
                                            "min-h-[120px] rounded-xl border border-border/60 p-2 transition-colors",
                                            !isSameMonth(day, focusedMonth) && "bg-muted/30 text-muted-foreground",
                                            // If multiple, make the whole cell clickable or give a clear affordance?
                                            // I'll stick to inner content being clickable.
                                        )}
                                    >
                                        <div className="flex items-center justify-between text-xs font-semibold">
                                            <span>{format(day, "d")}</span>
                                            {dayEvents.length > 0 && (
                                                <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary/10 px-1 text-[0.65rem] text-primary">
                                                    {dayEvents.length}
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-2 space-y-2">
                                            {/* Strategy:
                           If > 1 event: Show "X Events / View All" button.
                           If 1 event: Show the single card.
                           User said: "case where where are more than one evenet... when they click it, a list pops up"
                       */}

                                            {hasMultiple ? (
                                                <button
                                                    onClick={() => handleDayClick(day, dayEvents)}
                                                    className="flex w-full flex-col items-center justify-center gap-1 rounded-lg border border-primary/20 bg-primary/5 p-3 text-center transition-colors hover:bg-primary/10"
                                                >
                                                    <span className="text-lg font-bold text-primary">{dayEvents.length}</span>
                                                    <span className="text-[0.65rem] font-medium text-muted-foreground uppercase tracking-wide">Events</span>
                                                    <span className="text-[0.65rem] text-primary underline">View List</span>
                                                </button>
                                            ) : (
                                                dayEvents.map((event) => (
                                                    <Link
                                                        key={event.id}
                                                        href={`/community/events/${event.id}`}
                                                        className="block rounded-lg border border-border/60 bg-background/80 p-2 text-xs hover:border-primary/40"
                                                    >
                                                        <span className="block font-semibold text-foreground truncate">
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
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Agenda View for Mobile (or alternate view) - also filtered */}
            <div className="space-y-4 lg:hidden">
                <h2 className="text-lg font-semibold">Agenda ({RADIUS_MILES}mi radius)</h2>
                {filteredEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        {isLocating ? "Locating..." : "No events found nearby."}{" "}
                        <CalendarHostLink />
                    </p>
                ) : (
                    <div className="space-y-3">
                        {/* Use same logic? Or just list them? Agenda usually lists all. */}
                        {filteredEvents.map((event) => (
                            <Link
                                key={event.id}
                                href={`/community/events/${event.id}`}
                                className="block rounded-2xl border border-border/60 bg-card/95 p-4 shadow-sm"
                            >
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <CalendarIcon className="h-3.5 w-3.5" />
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

            <EventsListPopup
                isOpen={popupData.isOpen}
                onClose={() => setPopupData((prev) => ({ ...prev, isOpen: false }))}
                dateLabel={popupData.dateLabel}
                events={popupData.events}
            />
        </>
    );
}
