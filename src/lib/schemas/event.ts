
import { z } from "zod";

export const baseEventSchema = z.object({
    title: z
        .string()
        .min(5, "Title must be at least 5 characters")
        .max(200, "Title must be less than 200 characters"),
    description: z
        .string()
        .min(10, "Description must be at least 10 characters")
        .max(5000, "Description must be less than 5000 characters"),
    eventType: z.enum(["potluck", "volunteer", "workshop", "social"]),
    startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid start time",
    }),
    endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid end time",
    }),
    location: z.string().min(3, "Location is required"),
    locationCoords: z.object({
        lat: z.number(),
        lng: z.number(),
    }).optional().nullable(),
    isPublicLocation: z.boolean().default(true),
    capacity: z.number().int().positive().nullable().optional(),
    slots: z.array(z.string()).optional(),
});

export const createEventSchema = baseEventSchema.refine(
    (data) => {
        const start = new Date(data.startTime);
        const end = new Date(data.endTime);
        return end > start;
    },
    {
        message: "End time must be after start time",
        path: ["endTime"],
    }
).refine(
    (data) => {
        const start = new Date(data.startTime);
        // Allow a small grace period (e.g., 1 minute ago) or just strict future
        // Strict future might be annoying if device clock is slightly off
        return start > new Date(Date.now() - 1000 * 60 * 5);
    },
    {
        message: "Start time must be in the future",
        path: ["startTime"],
    }
);

export type CreateEventInput = z.infer<typeof createEventSchema>;
