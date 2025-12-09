"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createEventSchema } from "@/lib/schemas/event";
import { createPost } from "@/lib/post-queries";
import { createEvent, createSignUpSlot, updateEvent, getEventSignUpSlots, deleteSignUpSlots, updateSignUpSlotSortOrder } from "@/lib/event-queries";
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

        // Sync Slots (Smart update to preserve claims)
        // 1. Get existing slots
        const existingSlots = await getEventSignUpSlots(eventId);
        const newSlotNames = (validated.data.slots || []).filter(s => s.trim());

        // 2. Identify slots to delete, keep, and create
        // We match by name (case-insensitive? strict for now)
        const slotsToDelete: string[] = [];
        const slotsToKeep: { id: string; name: string; sortOrder: number }[] = [];

        // Map existing slots by name for easy lookup
        const existingMap = new Map(existingSlots.map(s => [s.slotName, s]));
        const processedNames = new Set<string>();

        // Identify slots to keep or create
        const slotsToCreate: { name: string; sortOrder: number }[] = [];

        newSlotNames.forEach((name, index) => {
            if (existingMap.has(name) && !processedNames.has(name)) {
                // Determine if we need to update sort order? 
                // For now just mark as kept. 
                // We could update sort order here if we want list visual consistency.
                const existing = existingMap.get(name)!;
                slotsToKeep.push({ id: existing.id, name, sortOrder: index });
                processedNames.add(name);
            } else {
                slotsToCreate.push({ name, sortOrder: index });
            }
        });

        // Identify slots to delete (existing but not in new list)
        existingSlots.forEach(s => {
            // If the name wasn't processed (meaning it wasn't in the new list as a kept item)
            if (!processedNames.has(s.slotName)) {
                slotsToDelete.push(s.id);
            }
        });

        // 3. Execute Updates
        if (slotsToDelete.length > 0) {
            await deleteSignUpSlots(slotsToDelete);
        }

        // Update Sort Orders for kept slots if changed (optimization)
        await Promise.all(slotsToKeep.map(async (s) => {
            // Only update DB if sort order is different? current logic in getEventSignUpSlots has order.
            // But we don't have the original sort order readily available in a map without looking up.
            // Let's just update. It's cheap.
            await updateSignUpSlotSortOrder(s.id, s.sortOrder);
        }));

        // Create new slots
        if (slotsToCreate.length > 0) {
            await Promise.all(
                slotsToCreate.map(s =>
                    createSignUpSlot({
                        eventId: eventId,
                        slotName: s.name,
                        maxClaims: 5,
                        sortOrder: s.sortOrder,
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
