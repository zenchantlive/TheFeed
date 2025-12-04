"use server";

import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const eventSchema = z.object({
    title: z.string().describe("A catchy, short title for the event"),
    description: z.string().describe("A warm, inviting description for the event (2-3 sentences)"),
    eventType: z.enum(["potluck", "volunteer", "workshop", "social"]).describe("The type of event"),
    durationHours: z.number().describe("Suggested duration in hours"),
});

export async function generateEventDetails(prompt: string) {
    try {
        const { object } = await generateObject({
            model: openai("gpt-4o"),
            schema: eventSchema,
            prompt: `Generate event details for a community food sharing event based on this user request: "${prompt}". 
      The tone should be friendly, inclusive, and community-focused.
      If the user input is vague, make reasonable assumptions for a community potluck or food drive.`,
        });

        return { success: true, data: object };
    } catch (error) {
        console.error("Failed to generate event details:", error);
        return { success: false, error: "Failed to generate event details" };
    }
}
