"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Sparkles, Loader2, Plus, X, Calendar as CalendarIcon, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

import { createEventSchema, type CreateEventInput } from "@/lib/schemas/event";
import { createEventAction, updateEventAction } from "@/app/actions/event";
import { generateEventDetails } from "@/app/actions/generate-event";
import { useRouter } from "next/navigation";

interface CreateEventModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: Partial<CreateEventInput>;
    eventId?: string; // If present, we are in EDIT mode
    userLocation?: string;
}

export function CreateEventModal({
    open,
    onOpenChange,
    initialData,
    eventId,
    userLocation,
}: CreateEventModalProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isGenerating, setIsGenerating] = useState(false);

    // Schema with slots included (optional)
    const form = useForm<CreateEventInput>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(createEventSchema) as any,
        defaultValues: {
            title: initialData?.title || "",
            description: initialData?.description || "",
            eventType: initialData?.eventType || "potluck",
            startTime: initialData?.startTime || "",
            endTime: initialData?.endTime || "",
            location: initialData?.location || "",
            isPublicLocation: initialData?.isPublicLocation ?? true,
            capacity: initialData?.capacity || null,
            locationCoords: initialData?.locationCoords || undefined,
            slots: initialData?.slots || [],
        },
    });

    // Reset form when initialData changes or modal opens/closes
    useEffect(() => {
        if (open) {
            form.reset({
                title: initialData?.title || "",
                description: initialData?.description || "",
                eventType: initialData?.eventType || "potluck",
                startTime: initialData?.startTime || "",
                endTime: initialData?.endTime || "",
                location: initialData?.location || "",
                isPublicLocation: initialData?.isPublicLocation ?? true,
                capacity: initialData?.capacity || null,
                locationCoords: initialData?.locationCoords || undefined,
                slots: initialData?.slots || [],
            });
        }
    }, [open, initialData, form]);

    // Manual slot management using form.watch
    const slots = form.watch("slots") || [];

    const addSlot = () => {
        const current = form.getValues("slots") || [];
        form.setValue("slots", [...current, ""]); // Add empty string
    };

    const removeSlotByIndex = (index: number) => {
        const current = form.getValues("slots") || [];
        form.setValue("slots", current.filter((_, i) => i !== index));
    };

    const updateSlot = (index: number, val: string) => {
        const current = form.getValues("slots") || [];
        const next = [...current];
        next[index] = val;
        form.setValue("slots", next);
    };

    async function onGenerate(prompt: string) {
        if (!prompt.trim() || prompt.length < 5) {
            toast.error("Input required", {
                description: "Please enter a topic or idea for the AI to generate details.",
            });
            return;
        }

        setIsGenerating(true);
        try {
            const result = await generateEventDetails(prompt, userLocation);
            if (result.success && result.data) {
                const { title, description, eventType, startTime, endTime, location, capacity, slots: suggestedSlots } = result.data;

                form.setValue("title", title);
                form.setValue("description", description);
                if (eventType) form.setValue("eventType", eventType as any);
                if (location) form.setValue("location", location);
                if (capacity) form.setValue("capacity", capacity);

                if (startTime && !isNaN(Date.parse(startTime))) {
                    form.setValue("startTime", new Date(startTime).toISOString().slice(0, 16));
                }
                if (endTime && !isNaN(Date.parse(endTime))) {
                    form.setValue("endTime", new Date(endTime).toISOString().slice(0, 16));
                }

                if (suggestedSlots && suggestedSlots.length > 0) {
                    form.setValue("slots", suggestedSlots);
                }

                toast.success("✨ Magic!", {
                    description: "Event details generated. Please review and adjust.",
                });
            }
        } catch {
            toast.error("Error", {
                description: "Failed to generate details. Please try again.",
            });
        } finally {
            setIsGenerating(false);
        }
    }

    function onSubmit(data: CreateEventInput) {
        startTransition(async () => {
            let result;
            if (eventId) {
                result = await updateEventAction(eventId, data);
            } else {
                result = await createEventAction(data);
            }

            if (result.success) {
                toast.success(eventId ? "Event Updated! ✅" : "Event Created! 🎉", {
                    description: eventId ? "Your changes have been saved." : "Your community event is now live.",
                });
                onOpenChange(false);
                form.reset();
                router.refresh();
                if (!eventId) {
                    router.push(`/community?tab=events`);
                }
            } else {
                toast.error("Error", {
                    description: result.error || "Failed to save event",
                });
            }
        });
    }

    const isEditMode = !!eventId;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] h-[90vh] sm:h-auto overflow-hidden flex flex-col p-0 gap-0 bg-background/60 backdrop-blur-xl border-white/20 shadow-2xl">
                <DialogHeader className="px-6 py-4 border-b border-white/10 shrink-0">
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        {isEditMode ? "Edit Event" : "Host an Event"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditMode ? "Modify event details and saving changes." : "Plan a potluck, volunteer drive, or gathering."}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 px-6 py-4 overflow-y-auto">
                    {/* AI Generator - Only in Create Mode for now to avoid overwriting existing data accidentally, or maybe allow it? Allowed for "Re-generate" */}
                    {!isEditMode && (
                        <div className="mb-6 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-4 border border-indigo-500/20 backdrop-blur-sm">
                            <div className="flex items-start gap-3">
                                <Sparkles className="mt-1 h-5 w-5 text-indigo-500" />
                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-semibold text-sm text-indigo-700 dark:text-indigo-300">
                                            AI Assistant
                                        </h4>
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="e.g. 'Thanksgiving Potluck at Central Park'"
                                            className="h-9 bg-white/50 dark:bg-black/20 border-indigo-200/50"
                                            id="ai-prompt-modal"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    const val = (e.currentTarget as HTMLInputElement).value;
                                                    onGenerate(val);
                                                }
                                            }}
                                        />
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            disabled={isGenerating}
                                            onClick={() => {
                                                const el = document.getElementById("ai-prompt-modal") as HTMLInputElement;
                                                onGenerate(el.value);
                                            }}
                                            className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300"
                                        >
                                            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fill"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <Form {...form}>
                        <form id="event-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 px-1">

                            {/* Title & Type */}
                            <div className="grid gap-4">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Event Title</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Community Potluck" {...field} className="bg-background/40" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="eventType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Type</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-background/40">
                                                            <SelectValue placeholder="Select type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="potluck">🍲 Potluck</SelectItem>
                                                        <SelectItem value="volunteer">🤝 Volunteer</SelectItem>
                                                        <SelectItem value="workshop">📚 Workshop</SelectItem>
                                                        <SelectItem value="social">👋 Social</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="capacity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Capacity</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="Unlimited"
                                                        {...field}
                                                        value={field.value || ""}
                                                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                                        className="bg-background/40"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Date & Time */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="startTime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Start</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input type="datetime-local" {...field} className="pl-9 bg-background/40" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="endTime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>End</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input type="datetime-local" {...field} className="pl-9 bg-background/40" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Location */}
                            <FormField
                                control={form.control}
                                name="location"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Location</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="123 Community St" {...field} className="pl-9 bg-background/40" />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Description */}
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Details about the event..."
                                                className="min-h-[100px] bg-background/40"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* What to Bring / Slots Section */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <FormLabel className="text-base">What to Bring / Slots</FormLabel>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addSlot}
                                        className="h-8 text-xs"
                                    >
                                        <Plus className="h-3 w-3 mr-1" /> Add Item
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {slots.length === 0 && (
                                        <div className="text-sm text-muted-foreground italic p-2 border border-dashed rounded-md text-center bg-background/20">
                                            No items needed yet. Add things guests should bring!
                                        </div>
                                    )}
                                    {slots.map((slot, index) => (
                                        <div key={index} className="flex gap-2">
                                            <Input
                                                value={slot}
                                                onChange={(e) => updateSlot(index, e.target.value)}
                                                placeholder={`Item ${index + 1}`}
                                                className="bg-background/40 h-9"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeSlotByIndex(index)}
                                                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </form>
                    </Form>
                </ScrollArea>

                <DialogFooter className="px-6 py-4 border-t border-white/10 bg-background/40 backdrop-blur-md shrink-0">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        type="submit"
                        form="event-form"
                        className="bg-primary/90 hover:bg-primary shadow-lg shadow-primary/20"
                        disabled={isPending}
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditMode ? "Save Changes" : "Create Event"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
