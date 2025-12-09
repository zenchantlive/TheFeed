"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createEventSchema } from "@/lib/schemas/event";
import { createPost } from "@/lib/post-queries";
import { createEvent, createSignUpSlot, updateEvent, deleteSignUpSlotsByEventId } from "@/lib/event-queries";
import { db } from "@/lib/db";
import { userProfiles, events } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type CreateEventResult =
    | { success: true; eventId: string; postId: string }
    | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createEventAction(
    data: z.infer<typeof createEventSchema>
): Promise<CreateEventResult> {
    try {
        // 1. Authentication
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        // 2. Validation
        const validated = createEventSchema.safeParse(data);
        if (!validated.success) {
            return {
                success: false,
                error: "Invalid input",
                fieldErrors: validated.error.flatten().fieldErrors,
            };
        }

        const {
            title,
            description,
            eventType,
            startTime,
            endTime,
            location,
            locationCoords,
            isPublicLocation,
            capacity,
        } = validated.data;

        // 3. Ensure User Profile
        const profile = await db.query.userProfiles.findFirst({
            where: eq(userProfiles.userId, session.user.id),
        });

        if (!profile) {
            await db.insert(userProfiles).values({ userId: session.user.id });
        }

        // 4. Create Feed Post (Events are tied to posts)
        const start = new Date(startTime);
        const end = new Date(endTime);
        const eventIcon = eventType === "potluck" ? "🎉" : "🤝";
        const postContent = `${eventIcon} ${title}\n\n${description}`;

        const post = await createPost({
            userId: session.user.id,
            content: postContent,
            kind: "event",
            location: location.trim(),
            locationCoords: locationCoords || undefined,
            expiresAt: start,
            metadata: {
                tags: [eventType],
            },
        });

        // 5. Create Event
        const event = await createEvent({
            postId: post.id,
            hostId: session.user.id,
            title: title.trim(),
            description: description.trim(),
            eventType,
            startTime: start,
            endTime: end,
            location: location.trim(),
            locationCoords: locationCoords || undefined,
            isPublicLocation,
            capacity: capacity ?? null,
        });

        // 6. Create Slots (from input or defaults for Potlucks)
        if (eventType === "potluck" || (validated.data.slots && validated.data.slots.length > 0)) {
            const slotsToCreate = validated.data.slots?.length
                ? validated.data.slots
                : eventType === "potluck" && validated.data.slots === undefined
                    ? ["Main Dish", "Side Dish", "Dessert", "Drinks", "Utensils/Plates"]
                    : [];

            if (slotsToCreate.length > 0) {
                await Promise.all(
                    slotsToCreate
                        .filter(slot => slot.trim()) // Filter out empty slots
                        .map((slotName, index) =>
                            createSignUpSlot({
                                eventId: event.id,
                                slotName,
                                maxClaims: 5, // Default logical limit
                                sortOrder: index,
                            })
                        )
                );
            }
        }

        // 7. Revalidate
        revalidatePath("/community");
        revalidatePath("/map");

        return { success: true, eventId: event.id, postId: post.id };
    } catch (error) {
        console.error("Failed to create event:", error);
        return { success: false, error: "Failed to create event. Please try again." };
    }
}

export async function updateEventAction(
    eventId: string,
    data: z.infer<typeof createEventSchema>
): Promise<CreateEventResult> {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        const validated = createEventSchema.safeParse(data);
        if (!validated.success) {
            return {
                success: false,
                error: "Invalid input",
                fieldErrors: validated.error.flatten().fieldErrors,
            };
        }

        const {
            title,
            description,
            eventType,
            startTime,
            endTime,
            location,
            locationCoords,
            isPublicLocation,
            capacity,
        } = validated.data;

        // Verify host ownership
        const existingEvent = await db.query.events.findFirst({
            where: eq(events.id, eventId),
        });

        if (!existingEvent) {
            return { success: false, error: "Event not found" };
        }

        if (existingEvent.hostId !== session.user.id) {
            return { success: false, error: "You are not authorized to edit this event" };
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        // Update Event
        // Update Event
        await updateEvent(eventId, {
            title: title.trim(),
            description: description.trim(),
            eventType,
            startTime: start,
            endTime: end,
            location: location.trim(),
            locationCoords: locationCoords || undefined,
            isPublicLocation,
            capacity: capacity ?? null,
        });

        // Sync Slots (Destructive update for simplicity/correctness)
        // 1. Delete existing slots
        await deleteSignUpSlotsByEventId(eventId);

        // 2. Create new slots if any
        if (validated.data.slots && validated.data.slots.length > 0) {
            await Promise.all(
                validated.data.slots
                    .filter(slot => slot.trim())
                    .map((slotName, index) =>
                        createSignUpSlot({
                            eventId: eventId,
                            slotName,
                            maxClaims: 5,
                            sortOrder: index,
                        })
                    )
            );
        }

        revalidatePath(`/community`);
        revalidatePath(`/map`);
        revalidatePath(`/events/${eventId}`);

        return { success: true, eventId, postId: existingEvent.postId };
    } catch (error) {
        console.error("Failed to update event:", error);
        return { success: false, error: "Failed to update event" };
    }
}
