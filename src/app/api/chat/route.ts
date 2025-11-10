import { openrouter } from "@openrouter/ai-sdk-provider";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import type { Tool } from "ai";
import { z } from "zod";
import { searchFoodBanks, getFoodBankById } from "@/lib/food-bank-queries";
import { formatHoursForDisplay, isCurrentlyOpen } from "@/lib/geolocation";
import type { HoursType } from "@/lib/schema";
import { searchPostsForAI } from "@/lib/post-queries";
import { searchEventsForAI } from "@/lib/event-queries";

const systemPrompt = `You are the AI sous-chef for TheFeed, a neighborhood potluck app connecting people with food banks, community leftovers, and volunteer opportunities.

Your role:
- Help users find nearby food banks, community posts (shares/requests), and events (potlucks/volunteer opportunities)
- Answer questions about hours, services, and directions
- Connect people who are sharing food with people who need it
- Be empathetic, encouraging, playful, and respectful
- Keep responses concise (2-3 sentences unless more detail is requested)
- Suggest when it makes sense to hop to the community feed, food map, or profile pantry to keep the experience connected

Available functions:
- search_food_banks: Find food banks by location and filters
- get_directions: Provide a directions link for a food bank
- check_hours: Check if a food bank is currently open
- search_community_posts: Find community posts (shares, requests, updates) near user location
- search_events: Find upcoming events (potlucks, volunteer opportunities) near user location

Guidelines:
- When user says "I'm hungry" or asks for food, IMMEDIATELY call ALL THREE tools in parallel:
  1. search_food_banks (with openNow: true)
  2. search_community_posts (with kind: "share", DO NOT filter by urgency)
  3. search_events (with eventType: "potluck")
- When user wants to help/share, IMMEDIATELY call:
  1. search_community_posts (with kind: "request", DO NOT filter by urgency)
  2. search_events (with eventType: "volunteer")
- ALWAYS use the user's location coordinates that are provided in the system prompt - NEVER ask for ZIP code
- After calling tools, ALWAYS provide a response to the user, even if results are empty
- If tools return empty results, respond with empathy and suggest alternatives (e.g., "No community posts yet, but here are food banks nearby" or "Be the first to share!")
- When you have results, present them in order of: urgency > distance > time
- Always include deep links for users to take action (format as markdown links)
- Keep responses concise and actionable - focus on the best 2-3 options
- Always prioritize dignity - never assume details about someone's situation`;

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
  latitude: z.number(),
  longitude: z.number(),
  radius: z.number().default(5).describe("Search radius in miles"),
  kind: z
    .enum(["share", "request", "update", "resource"])
    .optional()
    .describe("Filter by post type: share (offering food), request (need food), update (general), resource (info)"),
  urgency: z
    .enum(["asap", "today", "this_week"])
    .optional()
    .describe("Filter by urgency level"),
  limit: z.number().default(10).describe("Maximum number of results"),
});

type SearchCommunityPostsInput = z.infer<typeof searchCommunityPostsSchema>;

const searchEventsSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  radius: z.number().default(10).describe("Search radius in miles"),
  eventType: z
    .enum(["potluck", "volunteer"])
    .optional()
    .describe("Filter by event type: potluck (community meals) or volunteer (helping opportunities)"),
  startAfter: z
    .string()
    .optional()
    .describe("ISO timestamp - only show events starting after this time"),
  limit: z.number().default(5).describe("Maximum number of results"),
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
      "Search for community posts (shares, requests, updates) near a location. Use this to find neighbors sharing food or requesting help.",
    inputSchema: searchCommunityPostsSchema,
    execute: async (input: SearchCommunityPostsInput) => {
      console.log("🔍 search_community_posts called with:", input);
      const results = await searchPostsForAI({
        latitude: input.latitude,
        longitude: input.longitude,
        radius: input.radius,
        kind: input.kind,
        urgency: input.urgency,
        limit: input.limit,
      });
      console.log(`✅ Found ${results.length} posts`);

      return results.map((post) => ({
        id: post.id,
        content: post.content,
        kind: post.kind,
        urgency: post.urgency,
        location: post.location,
        distance: post.distance
          ? Number(post.distance.toFixed(2))
          : undefined,
        expiresAt: post.expiresAt?.toISOString(),
        author: {
          name: post.author.name,
          karma: post.author.karma,
          role: post.author.role,
        },
        createdAt: post.createdAt?.toISOString(),
        deepLink: post.deepLink,
        helpfulCount: post.helpfulCount,
        commentCount: post.commentCount,
      }));
    },
  },
  search_events: {
    description:
      "Search for upcoming events (potlucks, volunteer opportunities) near a location. Use this to find community gatherings and ways to help.",
    inputSchema: searchEventsSchema,
    execute: async (input: SearchEventsInput) => {
      console.log("🔍 search_events called with:", input);
      const results = await searchEventsForAI({
        latitude: input.latitude,
        longitude: input.longitude,
        radius: input.radius,
        eventType: input.eventType,
        startAfter: input.startAfter ? new Date(input.startAfter) : undefined,
        limit: input.limit,
      });
      console.log(`✅ Found ${results.length} events`);

      return results.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        eventType: event.eventType,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
        location: event.location,
        distance: event.distance
          ? Number(event.distance.toFixed(2))
          : undefined,
        capacity: event.capacity,
        rsvpCount: event.rsvpCount,
        host: {
          name: event.host.name,
          karma: event.host.karma,
          role: event.host.role,
        },
        rsvpLink: event.rsvpLink,
        mapLink: event.mapLink,
      }));
    },
  },
};

export async function POST(req: Request) {
  const body = await req.json();
  const {
    messages,
    userLocation,
  }: {
    messages: UIMessage[];
    userLocation?: { lat: number; lng: number };
  } = body;

  console.log("🔍 Chat API received:", {
    messageCount: messages.length,
    bodyKeys: Object.keys(body),
    userLocation
  });

  // Enhance system prompt with user location if available
  let enhancedSystemPrompt = systemPrompt;
  if (userLocation) {
    enhancedSystemPrompt = `${systemPrompt}

IMPORTANT: The user's current location is latitude ${userLocation.lat}, longitude ${userLocation.lng}.
ALWAYS use these coordinates when calling search_food_banks, search_community_posts, and search_events.
DO NOT ask the user for their ZIP code or location - you already have it.

CRITICAL: After calling tools and receiving results, you MUST synthesize a friendly, conversational response that:
1. Summarizes what you found (e.g., "I found 2 neighbors sharing food and 3 potlucks nearby!")
2. Highlights the best 2-3 options with details
3. Provides clear next steps or deep links
Never stop after just calling tools - always respond to the user with the results!`;
    console.log("✅ Location injected into system prompt:", userLocation);
  } else {
    console.log("⚠️ No user location provided");
  }

  const result = streamText({
    model: openrouter(process.env.OPENROUTER_MODEL || "openai/gpt-4.1-mini"),
    system: enhancedSystemPrompt,
    messages: convertToModelMessages(messages),
    tools,
    maxSteps: 5, // Allow AI to call tools and then respond with results
  });

  return (
    result as unknown as { toUIMessageStreamResponse: () => Response }
  ).toUIMessageStreamResponse();
}
