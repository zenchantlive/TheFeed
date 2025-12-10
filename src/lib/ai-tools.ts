import { z } from "zod";
import { tool, type Tool } from "ai";
import { eq } from "drizzle-orm";
import {
  searchFoodBanks,
  getFoodBankById,
} from "@/lib/food-bank-queries";
import {
  type Post,
  type Event,
  userProfiles,
  savedLocations,
  foodBanks,
  posts,
  events,
} from "@/lib/schema";
import { db } from "@/lib/db";

/**
 * Shared schema: location-constrained search.
 * All search tools MUST use this or a strict equivalent.
 */
export const locationInputSchema = z.object({
  lat: z.number().describe("Latitude of the search center"),
  lng: z.number().describe("Longitude of the search center"),
  radiusMiles: z
    .number()
    .min(0.1)
    .max(100)
    .default(10)
    .describe(
      "Maximum distance in miles from the center to include in results. Default 10."
    ),
});

/**
 * USER CONTEXT
 * Minimal, non-sensitive info for localization and personalization.
 */
export const getUserContextTool = tool({
  description:
    "Get basic context for a user: preferred radius (future) and saved locations that can act as defaults. Never returns sensitive data.",
  inputSchema: z.object({
    userId: z.string().describe("The authenticated user id."),
  }),
  execute: async ({ userId }) => {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    // Load saved locations; join to foodBanks manually to avoid Drizzle typing issues.
    const savedRaw = await db
      .select()
      .from(savedLocations)
      .where(eq(savedLocations.userId, userId));

    const saved: {
      id: string;
      foodBankId: string;
      fbName: string | null;
      fbZip: string | null;
      fbLat: number | null;
      fbLng: number | null;
    }[] = [];

    for (const row of savedRaw) {
      const fb = await db
        .select()
        .from(foodBanks)
        .where(eq(foodBanks.id, row.foodBankId))
        .limit(1);
      const bank = fb[0];
      saved.push({
        id: row.id,
        foodBankId: row.foodBankId,
        fbName: bank?.name ?? null,
        fbZip: bank?.zipCode ?? null,
        fbLat: bank?.latitude ?? null,
        fbLng: bank?.longitude ?? null,
      });
    }

    return {
      hasProfile: Boolean(profile),
      preferredRadiusMiles: null as number | null,
      savedLocations: saved.map((row) => ({
        id: row.id,
        foodBankId: row.foodBankId,
        label:
          row.fbName && row.fbZip
            ? `${row.fbName}, ${row.fbZip}`
            : null,
        lat: row.fbLat ?? null,
        lng: row.fbLng ?? null,
      })),
    };
  },
});

/**
 * RESOURCES (FOOD BANKS)
 * Location-constrained search; never global.
 */
export const searchResourcesTool = tool({
  description:
    "Search for nearby food resources (food banks, pantries) constrained by location and radius.",
  inputSchema: locationInputSchema.extend({
    openNow: z
      .boolean()
      .optional()
      .describe("If true, only include locations that are currently open."),
    services: z
      .array(z.string())
      .optional()
      .describe("Optional list of required services."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .default(8)
      .describe("Maximum number of results to return. Default 8."),
  }),
  execute: async ({ lat, lng, radiusMiles, openNow, services, limit }) => {
    const results = await searchFoodBanks({
      userLocation: { lat, lng },
      maxDistance: radiusMiles,
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
      distanceMiles: Number.isFinite(bank.distance)
        ? Number(bank.distance.toFixed(2))
        : null,
      isOpen: bank.isOpen,
      phone: bank.phone,
      website: bank.website,
      services: bank.services,
      hours: bank.hours,
    }));
  },
});

/**
 * Get a single resource by id.
 * Typically used after searchResourcesTool.
 */
export const getResourceByIdTool = tool({
  description:
    "Get detailed information about a specific food resource (food bank) by id.",
  inputSchema: z.object({
    id: z.string().describe("The food bank id."),
  }),
  execute: async ({ id }) => {
    const bank = await getFoodBankById(id);
    if (!bank) {
      return { error: "Resource not found." };
    }
    return {
      id: bank.id,
      name: bank.name,
      address: `${bank.address}, ${bank.city}, ${bank.state} ${bank.zipCode}`,
      latitude: bank.latitude,
      longitude: bank.longitude,
      phone: bank.phone,
      website: bank.website,
      services: bank.services,
      hours: bank.hours,
    };
  },
});

/**
 * POSTS
 * Location-aware access to neighbor offers/requests.
 * NOTE: This is intentionally simple; we assume locationCoords is populated for relevant posts.
 */
export const searchPostsTool = tool({
  description:
    "Search nearby community posts (offers/requests) within a radius. Only returns posts with known coordinates and within distance.",
  inputSchema: locationInputSchema.extend({
    kind: z
      .enum(["share", "request", "all"])
      .default("all")
      .describe(
        "Filter by kind of post. 'share' for offers, 'request' for needs, 'all' for both."
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("Maximum number of posts to return."),
  }),
  execute: async ({ lat, lng, radiusMiles, kind, limit }) => {
    // Basic location filter using haversine-style distance in JS.
    // For now, do minimal in-DB filtering and refine in code.
    let rows: Post[] = await db.select().from(posts);

    if (kind !== "all") {
      rows = rows.filter((p) => p.kind === kind);
    }

    const max = limit ?? 25;
    const within: Array<{
      id: string;
      content: string;
      kind: string;
      distanceMiles: number | null;
      location?: string | null;
      locationCoords?: { lat: number; lng: number } | null;
      createdAt: string;
    }> = [];

    for (const p of rows) {
      const coords = (p as Post).locationCoords as
        | { lat: number; lng: number }
        | null
        | undefined;
      if (!coords) continue;
      const dLat = ((coords.lat - lat) * Math.PI) / 180;
      const dLng = ((coords.lng - lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat * Math.PI) / 180) *
        Math.cos((coords.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceMiles = 3958.8 * c;
      if (distanceMiles <= radiusMiles) {
        within.push({
          id: p.id,
          content: p.content,
          kind: p.kind,
          distanceMiles: Number(distanceMiles.toFixed(2)),
          location: p.location,
          locationCoords: coords,
          createdAt: p.createdAt?.toISOString?.() ?? String(p.createdAt),
        });
      }
      if (within.length >= max) break;
    }

    return within;
  },
});

/**
 * EVENTS
 * Location + time aware search for potlucks / volunteer / food events.
 */
export const searchEventsTool = tool({
  description:
    "Search for nearby events (potlucks, volunteer, food-related) within a radius and optional time window.",
  inputSchema: locationInputSchema.extend({
    type: z
      .enum(["potluck", "volunteer", "food-distribution", "all"])
      .default("all")
      .describe("Filter by event type."),
    from: z
      .string()
      .datetime()
      .optional()
      .describe("ISO start datetime for the search window."),
    to: z
      .string()
      .datetime()
      .optional()
      .describe("ISO end datetime for the search window."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("Maximum number of events to return."),
  }),
  execute: async ({ lat, lng, radiusMiles, type, from, to, limit }) => {
    let rows: Event[] = await db.select().from(events);

    if (type !== "all") {
      rows = rows.filter((e) => e.eventType === type);
    }

    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    if (fromDate || toDate) {
      rows = rows.filter((e) => {
        const start = new Date(e.startTime as unknown as string);
        if (fromDate && start < fromDate) return false;
        if (toDate && start > toDate) return false;
        return true;
      });
    }

    const max = limit ?? 25;
    const within: Array<{
      id: string;
      title: string;
      description: string;
      eventType: string;
      distanceMiles: number | null;
      startsAt: string;
      location: string;
      isVerified: boolean;
    }> = [];

    for (const e of rows) {
      const coords = e.locationCoords as
        | { lat: number; lng: number }
        | null
        | undefined;
      if (!coords) continue;
      const dLat = ((coords.lat - lat) * Math.PI) / 180;
      const dLng = ((coords.lng - lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat * Math.PI) / 180) *
        Math.cos((coords.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceMiles = 3958.8 * c;
      if (distanceMiles <= radiusMiles) {
        within.push({
          id: e.id,
          title: e.title,
          description: e.description,
          eventType: e.eventType,
          distanceMiles: Number(distanceMiles.toFixed(2)),
          startsAt:
            (e.startTime as unknown as Date)?.toISOString?.() ??
            String(e.startTime),
          location: e.location,
          isVerified: e.isVerified,
        });
      }
      if (within.length >= max) break;
    }

    return within;
  },
});

/**
 * DIRECTIONS
 * Simple Google Maps URL generator between two points.
 * This keeps directions deterministic and easily testable.
 */
export const getDirectionsTool = tool({
  description:
    "Create a Google Maps directions URL between two coordinates. Use coordinates from prior tool results.",
  inputSchema: z.object({
    fromLat: z.number(),
    fromLng: z.number(),
    toLat: z.number(),
    toLng: z.number(),
  }),
  execute: async ({ fromLat, fromLng, toLat, toLng }) => {
    const origin = encodeURIComponent(`${fromLat},${fromLng}`);
    const destination = encodeURIComponent(`${toLat},${toLng}`);
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    return { url };
  },
});

/**
 * LOGGING
 * Allow the agent/route to persist high-level chat metadata.
 * Keep it minimal & privacy-aware; detailed storage stays in chat_messages route/logic.
 */
export const logChatTool = tool({
  description:
    "Record a lightweight log entry about an AI interaction for debugging and analytics.",
  inputSchema: z.object({
    userId: z.string().nullable().optional(),
    summary: z
      .string()
      .max(500)
      .describe("Short description of what the assistant did."),
    usedTools: z
      .array(z.string())
      .describe("Names of tools invoked during this interaction."),
  }),
  execute: async ({ userId, summary, usedTools }) => {
    // For now, no-op or simple console log. Can be wired to chat_messages or observability later.
    console.log("[AI LOG]", { userId: userId ?? null, summary, usedTools });
    return { ok: true };
  },
});

// ------------------------------------------------------------------
// GENERATIVE CONTENT TOOLS (ECHO PATTERN)
// ------------------------------------------------------------------
// These tools do NOT write to the DB. They purely validate/normalize
// user intent into a structured object that the UI can render
// as a "Draft Preview" card. The user then clicks "Create" in the UI.

/**
 * Draft Event Tool
 * 
 * Takes sloppy natural language about an event and returns a 
 * structured "DraftEvent" object for the UI to display.
 */
export const createDraftEventTool = tool({
  description:
    "Draft a new community event (potluck, volunteer, etc). " +
    "Use this when the user wants to host or organize something. " +
    "Returns a structured draft for review.",
  inputSchema: z.object({
    title: z.string().describe("A catchy title for the event"),
    description: z.string().describe("Short description of what's happening"),
    eventType: z
      .enum(["potluck", "volunteer", "social", "workshop"])
      .default("potluck")
      .describe("The category of event"),
    startTime: z.string().datetime().optional()
      .describe("ISO start time if mentioned"),
    endTime: z.string().datetime().optional()
      .describe("ISO end time if mentioned"),
    location: z.string().optional()
      .describe("Name of place or address"),
    itemsNeeded: z.array(z.string()).optional()
      .describe("List of items for people to bring (for potlucks)"),
  }),
  execute: async (input) => {
    // "Echo" the input back as the result. 
    // The UI (SearchEventsRenderer or new DraftEventRenderer) 
    // will pick this up and show the Draft Card.
    return {
      success: true,
      draft: {
        ...input,
        // Ensure defaults if logic requires, otherwise pass through
        isPublicLocation: true, // Defaulting to true for safety prompt
      }
    };
  },
});

/**
 * Draft Post Tool
 * 
 * Takes user intent for a post and structures it for the feed.
 */
export const createDraftPostTool = tool({
  description:
    "Draft a new community post. Use this when user wants to 'ask for help' " +
    "or 'share something' or generally post to the feed. " +
    "Returns structured draft.",
  inputSchema: z.object({
    intent: z.enum(["need", "share"]).describe("Is the user asking for help (need) or offering help (share)?"),
    content: z.string().describe("The main text content of the post"),
    urgency: z.enum(["asap", "today", "this_week"]).optional()
      .describe("How urgent is this request?"),
  }),
  execute: async (input) => {
    return {
      success: true,
      draft: input
    };
  },
});

/**
 * Export a ToolSet compatible object for use in /api/chat or agents.
 * This allows:
 * - Direct import for testing (via execute())
 * - Plug-and-play with streamText/generateText tools parameter
 */
export const sousChefTools: Record<string, Tool> = {
  get_user_context: getUserContextTool,
  search_resources: searchResourcesTool,
  get_resource_by_id: getResourceByIdTool,
  search_posts: searchPostsTool,
  search_events: searchEventsTool,
  get_directions: getDirectionsTool,
  log_chat: logChatTool,
  create_draft_event: createDraftEventTool,
  create_draft_post: createDraftPostTool,
};
