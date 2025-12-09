"use server";

import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

// Schema for AI generation - relaxed validation for AI output
const aiEventSchema = z.object({
    title: z.string().describe("A catchy, short title for the event"),
    description: z.string().describe("A warm, inviting description for the event (2-3 sentences)"),
    eventType: z.enum(["potluck", "volunteer", "workshop", "social"]).describe("The type of event"),
    // AI generates ISO strings or relative times which we parse on client
    startTime: z.string().describe("ISO date string for start time. Infer from prompt (e.g. 'next friday at 5pm'). If unspecified, suggest a logical time."),
    endTime: z.string().describe("ISO date string for end time. Usually 2-3 hours after start."),
    location: z.string().describe("Location name or address. If vague, suggest a type of place (e.g. 'Local Park').").optional(),
    capacity: z.number().describe("Suggested participant limit based on event type. Null for unlimited.").optional(),
    slots: z.array(z.string()).describe("List of suggested items for attendees to bring (e.g. 'Salad', 'Drinks') if it is a potluck. Empty if not needed.").optional(),
});

export async function generateEventDetails(prompt: string, userLocation?: string) {
    try {
        const { object } = await generateObject({
            model: openai("gpt-4o"),
            schema: aiEventSchema,
            prompt: `Generate event details for a community food sharing event based on this user request: "${prompt}". 
      
      Context:
      - The user is a "neighbor" or "guide" in a local community.
      - User Location: ${userLocation || "Unknown"}.
      - IMPORTANT: If the user provided a place name (e.g. "Central Park", "Library") and you have a User Location, try to infer the specific address of that place in the user's city. If you can't be sure, just use the place name.
      - Default to "potluck" if sharing food, "volunteer" if organizing help.
      - Tone: Friendly, inclusive, encouraging.
      - Date/Time: If valid date/time mentioned, use it. If "tomorrow", calculate from now. If vague, propose next Saturday at 12pm.
      
      Current Time: ${new Date().toISOString()}
      `,
        });

        return { success: true, data: object };
    } catch (error) {
        console.error("Failed to generate event details:", error);
        return { success: false, error: "Failed to generate event details" };
    }
}
