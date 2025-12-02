import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { MapEventPin, MapPostPin } from "@/hooks/use-map-data";

/**
 * Popup component for displaying Event details on the map.
 * Includes Quick RSVP functionality.
 */
export function EventPopup({
    event,
    onClose,
}: {
    event: MapEventPin;
    onClose: () => void;
}) {
    const [isRsvping, setIsRsvping] = useState(false);
    const [guestCount, setGuestCount] = useState(1);
    const [rsvpSuccess, setRsvpSuccess] = useState(false);
    const [rsvpMessage, setRsvpMessage] = useState("");
    const abortControllerRef = useRef<AbortController | null>(null);

    // Cleanup abort controller on unmount
    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

    const handleQuickRsvp = async () => {
        // Cancel any pending requests
        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsRsvping(true);
        setRsvpMessage("");

        try {
            const response = await fetch(`/api/events/${event.id}/rsvp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ guestCount }),
                signal: controller.signal,
            });

            const data = await response.json();

            if (response.ok) {
                setRsvpSuccess(true);
                setRsvpMessage(data.message || "RSVP confirmed!");
            } else {
                setRsvpMessage(data.error || "Failed to RSVP");
            }
        } catch (error) {
            if ((error as Error).name !== "AbortError") {
                setRsvpMessage("Failed to RSVP. Please try again.");
            }
        } finally {
            if (!controller.signal.aborted) {
                setIsRsvping(false);
            }
        }
    };

    return (
        <div className="fixed bottom-4 left-1/2 z-30 w-full max-w-md -translate-x-1/2 rounded-3xl border border-border/60 bg-card/95 p-5 shadow-2xl backdrop-blur">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(event.startTime, "EEEE, MMM d")}
                    </div>
                    <h3 className="mt-1 text-lg font-semibold text-foreground">
                        {event.title}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {format(event.startTime, "h:mm a")}
                        </span>
                        <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {event.location}
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {event.rsvpCount} attending
                            {event.capacity && ` / ${event.capacity}`}
                        </span>
                    </div>
                    <Badge
                        variant="outline"
                        className="mt-2 inline-flex text-[0.65rem]"
                    >
                        {event.eventType === "potluck" ? "🎉 Potluck" : "🤝 Volunteer"}
                    </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                    ×
                </Button>
            </div>

            {rsvpSuccess ? (
                <div className="mt-4 rounded-lg bg-primary/10 p-3 text-sm text-primary">
                    ✓ {rsvpMessage}
                </div>
            ) : (
                <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3">
                        <label htmlFor="guestCount" className="text-sm font-medium">
                            Guests:
                        </label>
                        <select
                            id="guestCount"
                            value={guestCount}
                            onChange={(e) => setGuestCount(parseInt(e.target.value))}
                            className="rounded-lg border border-border bg-background px-3 py-1 text-sm"
                            disabled={isRsvping}
                        >
                            {[1, 2, 3, 4, 5].map((count) => (
                                <option key={count} value={count}>
                                    {count} {count === 1 ? "person" : "people"}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={handleQuickRsvp}
                            disabled={isRsvping}
                            className="flex-1"
                            size="sm"
                        >
                            {isRsvping ? "RSVPing..." : "Quick RSVP"}
                        </Button>
                        <Button asChild variant="secondary" size="sm">
                            <Link href={`/community/events/${event.id}`}>Full details</Link>
                        </Button>
                    </div>
                    {rsvpMessage && !rsvpSuccess && (
                        <p className="text-xs text-destructive">{rsvpMessage}</p>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Popup component for displaying Post details on the map.
 */
export function PostPopup({
    post,
    onClose,
}: {
    post: MapPostPin;
    onClose: () => void;
}) {
    // Truncate content to first 150 characters
    const truncatedContent =
        post.content.length > 150
            ? post.content.substring(0, 150) + "..."
            : post.content;

    return (
        <div className="fixed bottom-4 left-1/2 z-30 w-full max-w-md -translate-x-1/2 rounded-3xl border border-border/60 bg-card/95 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge
                            variant="outline"
                            className={cn(
                                "text-[0.65rem]",
                                post.kind === "share" && "border-full-end/40 bg-full-start/10 text-full-end",
                                post.kind === "request" && "border-hungry-end/40 bg-hungry-start/10 text-hungry-end"
                            )}
                        >
                            {post.kind === "share" && "🍽️ Share"}
                            {post.kind === "request" && "🙏 Request"}
                            {post.kind === "update" && "📢 Update"}
                            {post.kind === "resource" && "📍 Resource"}
                        </Badge>
                        {post.urgency && (
                            <Badge variant="outline" className="text-[0.65rem]">
                                {post.urgency === "asap" && "⚡ ASAP"}
                                {post.urgency === "today" && "📅 Today"}
                                {post.urgency === "this_week" && "📆 This week"}
                            </Badge>
                        )}
                    </div>
                    <p className="mt-2 text-sm text-foreground">{truncatedContent}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        {post.location && (
                            <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {post.location}
                            </span>
                        )}
                        <span>•</span>
                        <span>by {post.author.name}</span>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                    Close
                </Button>
            </div>
            <div className="mt-4 flex justify-end">
                <Button asChild variant="secondary">
                    <Link href="/community">View in community</Link>
                </Button>
            </div>
        </div>
    );
}
