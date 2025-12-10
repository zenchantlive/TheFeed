"use client";

import { useState } from "react";
import { CreateEventModal } from "@/components/events/create-event-modal";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";

/**
 * Schema matches the output of `create_draft_event` tool
 */
export interface DraftEvent {
    title: string;
    description: string;
    eventType: "potluck" | "volunteer" | "social" | "workshop";
    startTime?: string;
    endTime?: string;
    location?: string;
    itemsNeeded?: string[];
    isPublicLocation?: boolean;
}

interface DraftEventCardProps {
    draft: DraftEvent;
}

/**
 * Draft Event Card
 * 
 * Renders a preview of the event the AI has drafted.
 * Allows user to click "Review & Host" to open the real form with data pre-filled.
 */
export function DraftEventCard({ draft }: DraftEventCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Format date for display if present
    const date = draft.startTime ? new Date(draft.startTime) : null;
    const displayDate = date && !isNaN(date.getTime())
        ? format(date, "EEE, MMM d @ h:mm a")
        : "Date TBD";

    return (
        <>
            <div className="mt-3 overflow-hidden rounded-2xl border border-indigo-500/30 bg-indigo-950/20 backdrop-blur-sm">
                {/* Header Preview */}
                <div className="bg-indigo-500/10 px-4 py-3 border-b border-indigo-500/10">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center justify-center rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-300">
                            {draft.eventType}
                        </span>
                        <span className="text-xs text-indigo-200/60 uppercase tracking-widest">Draft</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white">{draft.title}</h3>
                </div>

                {/* Details Grid */}
                <div className="p-4 space-y-3">
                    <p className="text-sm text-indigo-100/80 line-clamp-2">
                        {draft.description}
                    </p>

                    <div className="grid gap-2 text-sm text-indigo-200">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-indigo-400" />
                            <span>{displayDate}</span>
                        </div>
                        {draft.location && (
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-indigo-400" />
                                <span>{draft.location}</span>
                            </div>
                        )}
                        {draft.itemsNeeded && draft.itemsNeeded.length > 0 && (
                            <div className="flex items-start gap-2">
                                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                                <span className="text-xs opacity-80">
                                    Suggested items: {draft.itemsNeeded.slice(0, 3).join(", ")}
                                    {draft.itemsNeeded.length > 3 && "..."}
                                </span>
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/20"
                    >
                        Edit & Host Event
                    </Button>
                </div>
            </div>

            {/* Actual Form Modal - Hydrated with Draft Data */}
            <CreateEventModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                initialData={{
                    title: draft.title,
                    description: draft.description,
                    eventType: draft.eventType,
                    startTime: draft.startTime,
                    endTime: draft.endTime,
                    location: draft.location,
                    isPublicLocation: draft.isPublicLocation ?? true,
                    // Map itemsNeeded to slots
                    slots: draft.itemsNeeded,
                }}
            />
        </>
    );
}
