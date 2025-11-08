import { openrouter } from "@openrouter/ai-sdk-provider";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import type { Tool } from "ai";
import { z } from "zod";
import { searchFoodBanks, getFoodBankById } from "@/lib/food-bank-queries";
import { formatHoursForDisplay, isCurrentlyOpen } from "@/lib/geolocation";
import type { HoursType } from "@/lib/schema";

const systemPrompt = `You are the AI sous-chef for TheFeed, a neighborhood potluck app connecting people with food banks, community leftovers, and volunteer opportunities.

Your role:
- Help users find nearby food banks
- Answer questions about hours, services, and directions
- Be empathetic, encouraging, playful, and respectful
- Keep responses concise (2-3 sentences unless more detail is requested)
- Suggest when it makes sense to hop to the community feed, food map, or profile pantry to keep the experience connected

Available functions:
- search_food_banks: Find food banks by location and filters
- get_directions: Provide a directions link for a food bank
- check_hours: Check if a food bank is currently open

Guidelines:
- Prioritize locations that are open now when possible
- If the user says "I'm hungry", immediately look for nearby open locations
- Never assume details about the user's situation; always respond with dignity
- Offer next steps or resources after giving an answer
- If the best next step lives in another tab, mention it (e.g., "Check the Potluck tab" or "Open the Food Map")`;

const searchFoodBanksSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  maxDistance: z.number().default(10),
  openNow: z.boolean().optional(),
  services: z.array(z.string()).optional(),
  limit: z.number().optional(),
});

type SearchFoodBanksInput = z.infer<typeof searchFoodBanksSchema>;

const directionsSchema = z.object({
  foodBankId: z.string(),
});

type DirectionsInput = z.infer<typeof directionsSchema>;

const checkHoursSchema = z.object({
  foodBankId: z.string(),
  day: z
    .string()
    .optional()
    .describe("English weekday name, defaults to today in the user's locale"),
});

type CheckHoursInput = z.infer<typeof checkHoursSchema>;

const tools: Record<string, Tool> = {
  search_food_banks: {
    description: "Search for food banks near a location",
    inputSchema: searchFoodBanksSchema,
    execute: async (input: SearchFoodBanksInput) => {
      const { latitude, longitude, maxDistance, openNow, services, limit } =
        input;

      const results = await searchFoodBanks({
        userLocation: { lat: latitude, lng: longitude },
        maxDistance,
        openNow,
        services,
        limit,
      });

      return results.map((bank) => ({
        id: bank.id,
        name: bank.name,
        address: `${bank.address}, ${bank.city}, ${bank.state} ${bank.zipCode}`,
        latitude: bank.latitude,
        longitude: bank.longitude,
        distance: Number.isFinite(bank.distance)
          ? Number(bank.distance.toFixed(2))
          : null,
        isOpen: bank.isOpen,
        phone: bank.phone,
        website: bank.website,
        services: bank.services,
        hours: bank.hours,
      }));
    },
  },
  get_directions: {
    description: "Provide a directions link for a food bank",
    inputSchema: directionsSchema,
    execute: async ({ foodBankId }: DirectionsInput) => {
      const bank = await getFoodBankById(foodBankId);
      if (!bank) {
        return { error: "Food bank not found." };
      }

      const destination = encodeURIComponent(
        `${bank.name}, ${bank.address}, ${bank.city}, ${bank.state} ${bank.zipCode}`
      );

      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;

      return {
        id: bank.id,
        name: bank.name,
        address: `${bank.address}, ${bank.city}, ${bank.state} ${bank.zipCode}`,
        mapsUrl,
        phone: bank.phone,
        website: bank.website,
        latitude: bank.latitude,
        longitude: bank.longitude,
      };
    },
  },
  check_hours: {
    description: "Check whether a food bank is open on a given day",
    inputSchema: checkHoursSchema,
    execute: async ({ foodBankId, day }: CheckHoursInput) => {
      const bank = await getFoodBankById(foodBankId);
      if (!bank) {
        return { error: "Food bank not found." };
      }

      const hours = bank.hours as HoursType | null | undefined;
      const targetDay =
        day ??
        new Date().toLocaleDateString("en-US", {
          weekday: "long",
        });
      const dayHours = hours ? hours[targetDay] : undefined;

      return {
        id: bank.id,
        name: bank.name,
        day: targetDay,
        isOpenNow: hours ? isCurrentlyOpen(hours) : false,
        open: dayHours?.open ?? null,
        close: dayHours?.close ?? null,
        closed: dayHours?.closed ?? false,
        displayHours: formatHoursForDisplay(dayHours),
      };
    },
  },
};

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openrouter(process.env.OPENROUTER_MODEL || "openai/gpt-4.1-mini"),
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    tools,
  });

  return (
    result as unknown as { toUIMessageStreamResponse: () => Response }
  ).toUIMessageStreamResponse();
}
