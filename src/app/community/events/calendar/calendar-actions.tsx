"use client";

import { useState } from "react";
import { CreateEventModal } from "@/components/events/create-event-modal";
import { HostEventButton } from "@/app/community/components/host-event-button";
import { Button } from "@/components/ui/button";

export function CalendarHostButton() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button variant="outline" onClick={() => setOpen(true)}>
                Host an event
            </Button>
            <CreateEventModal open={open} onOpenChange={setOpen} />
        </>
    );
}

export function CalendarHostLink() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="text-primary underline hover:text-primary/80"
            >
                Host one?
            </button>
            <CreateEventModal open={open} onOpenChange={setOpen} />
        </>
    );
}
