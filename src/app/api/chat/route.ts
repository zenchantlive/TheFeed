import { openrouter } from "@openrouter/ai-sdk-provider";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import type { Tool } from "ai";
import { z } from "zod";
import { searchFoodBanks, getFoodBankById } from "@/lib/food-bank-queries";
import { formatHoursForDisplay, isCurrentlyOpen } from "@/lib/geolocation";
import type { HoursType } from "@/lib/schema";
import { searchPostsForAI } from "@/lib/post-queries";
import { searchEventsForAI } from "@/lib/event-queries";

const systemPrompt = `You are the AI sous-chef for TheFeed, a neighborhood potluck app connecting people with food banks, community resources, neighbor-to-neighbor sharing, and volunteer opportunities.

Your role:
- Help users find nearby food banks, community posts, and events
- Answer questions about hours, services, directions, and community offerings
- Be empathetic, encouraging, playful, and respectful
- Keep responses concise (2-3 sentences unless more detail is requested)
- Suggest when it makes sense to hop to the community feed, food map, or profile pantry

Available functions:
- search_food_banks: Find food banks by location and filters
- search_community_posts: Find neighbor posts sharing food or requesting help
- search_events: Find upcoming potlucks and volunteer opportunities
- get_directions: Provide a directions link for a food bank
- check_hours: Check if a food bank is currently open

CRITICAL WORKFLOW:
1. When the user asks for help or expresses hunger, ALWAYS call the appropriate search tools
2. AFTER receiving tool results, you MUST synthesize a clear, helpful response
3. Present the results in an organized, friendly way
4. Suggest next steps or additional resources

Guidelines:
- Prioritize locations and events that are happening soon or open now
- If the user says "I'm hungry", search for food banks, community posts with "share" kind, and potluck events
- If the user says "I'm full" or wants to help, search for posts with "request" kind and volunteer events
- Never assume details about the user's situation; always respond with dignity
- After calling tools, ALWAYS provide a synthesized response - don't just stop after tool execution
- Format your responses with clear sections when presenting multiple results
- If the best next step lives in another tab, mention it (e.g., "Check the Community tab" or "Open the Food Map")`;

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

const searchCommunityPostsSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  maxDistance: z.number().default(10).optional(),
  mood: z.enum(["hungry", "full"]).optional(),
  kind: z.enum(["share", "request", "update", "resource"]).optional(),
  limit: z.number().default(10).optional(),
});

type SearchCommunityPostsInput = z.infer<typeof searchCommunityPostsSchema>;

const searchEventsSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  maxDistance: z.number().default(10).optional(),
  eventType: z.enum(["potluck", "volunteer"]).optional(),
  limit: z.number().default(10).optional(),
});

type SearchEventsInput = z.infer<typeof searchEventsSchema>;

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
  search_community_posts: {
    description:
      "Search for community posts from neighbors sharing food or requesting help",
    inputSchema: searchCommunityPostsSchema,
    execute: async (input: SearchCommunityPostsInput) => {
      const { latitude, longitude, maxDistance, mood, kind, limit } = input;

      const userLocation =
        latitude && longitude ? { lat: latitude, lng: longitude } : undefined;

      const results = await searchPostsForAI({
        userLocation,
        maxDistance,
        mood,
        kind,
        limit,
      });

      return results.map((post) => ({
        id: post.id,
        content: post.content,
        kind: post.kind,
        mood: post.mood,
        location: post.location,
        urgency: post.urgency,
        createdAt: post.createdAt?.toISOString(),
        expiresAt: post.expiresAt?.toISOString(),
        author: {
          name: post.author.name,
          karma: post.author.karma,
          role: post.author.role,
        },
      }));
    },
  },
  search_events: {
    description: "Search for upcoming potlucks and volunteer opportunities",
    inputSchema: searchEventsSchema,
    execute: async (input: SearchEventsInput) => {
      const { latitude, longitude, maxDistance, eventType, limit } = input;

      const userLocation =
        latitude && longitude ? { lat: latitude, lng: longitude } : undefined;

      const results = await searchEventsForAI({
        userLocation,
        maxDistance,
        eventType,
        limit,
      });

      return results.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        eventType: event.eventType,
        startTime: event.startTime?.toISOString(),
        endTime: event.endTime?.toISOString(),
        location: event.location,
        rsvpCount: event.rsvpCount,
        capacity: event.capacity,
        host: {
          name: event.host.name,
          karma: event.host.karma,
          role: event.host.role,
        },
      }));
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
    // Don't stop after tool calls - allow AI to continue and synthesize response
    // Default is stepCountIs(1) which stops after first tool call
    stopWhen: () => false, // Never stop automatically, let the model decide when to finish
  });

  return (
    result as unknown as { toUIMessageStreamResponse: () => Response }
  ).toUIMessageStreamResponse();
}
