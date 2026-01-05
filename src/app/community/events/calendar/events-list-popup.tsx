"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EventCard } from "@/components/events/event-card";
import type { Event } from "@/lib/schema";

export type CalendarEvent = Event & {
    host: {
        id: string;
        name: string;
        image: string | null;
        role: string;
    };
};

export type EventsListPopupProps = {
    isOpen: boolean;
    onClose: () => void;
    dateLabel: string;
    events: CalendarEvent[];
    className?: string;
};

export function EventsListPopup({
    isOpen,
    onClose,
    dateLabel,
    events,
    className,
}: EventsListPopupProps) {
    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-all duration-100 ease-in-out"
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                className={cn(
                    "fixed inset-x-0 bottom-0 z-50 flex h-[85vh] flex-col rounded-t-[2rem] border-t border-border/60 bg-background shadow-2xl transition-transform duration-300 ease-in-out md:inset-auto md:left-1/2 md:top-1/2 md:h-auto md:max-h-[85vh] md:w-full md:max-w-xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:border",
                    isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
                    className
                )}
                role="dialog"
                aria-label={`Events on ${dateLabel}`}
            >
                <div className="flex-none border-b border-border/40 p-4">
                    <div className="relative flex items-center justify-center">
                        <h2 className="text-lg font-semibold">{dateLabel}</h2>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full text-muted-foreground hover:bg-muted"
                        >
                            <X className="h-5 w-5" />
                            <span className="sr-only">Close</span>
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {events.length === 0 ? (
                        <div className="flex h-40 items-center justify-center text-muted-foreground">
                            No events found.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {events.map((event) => (
                                <EventCard
                                    key={event.id}
                                    id={event.id}
                                    title={event.title}
                                    eventType={event.eventType as "potluck" | "volunteer"}
                                    hostName={event.host.name}
                                    startTime={event.startTime}
                                    location={event.location}
                                    rsvpCount={event.rsvpCount}
                                    capacity={event.capacity}
                                    isVerified={event.isVerified}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
