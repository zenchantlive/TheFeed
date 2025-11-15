import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { buildSousChefSystemPrompt } from "@/lib/prompts/chat-system";
import {
  searchFoodBanks,
  getFoodBankById,
} from "@/lib/food-bank-queries";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  foodBanks,
  posts,
  events,
  userProfiles,
  savedLocations,
  type Post,
  type Event,
} from "@/lib/schema";

const DEFAULT_RADIUS_MILES = 10;

/**
 * CopilotKit API endpoint for TheFeed AI Sous-Chef.
 * Uses OpenRouter for model access (configured via OpenAI-compatible client).
 */
// For now, use default OpenAI adapter without custom client
// TODO: Fix OpenRouter integration - the beta.chat.completions API doesn't work with custom baseURL
const serviceAdapter = new OpenAIAdapter({
  model: process.env.OPENAI_MODEL || "gpt-4o",
});

export async function POST(req: NextRequest) {
  // Extract context from headers for use in tool handlers
  const userIdHeader = req.headers.get("x-user-id");
  const locationHeader = req.headers.get("x-user-location");
  const radiusHeader = req.headers.get("x-radius-miles");

  // Parse location if provided
  let location: { lat: number; lng: number; label?: string } | null = null;
  if (locationHeader) {
    try {
      location = JSON.parse(locationHeader);
    } catch {
      location = null;
    }
  }

  // Get session user if no explicit userId header
  const session = await auth.api.getSession({ headers: req.headers });
  const effectiveUserId = userIdHeader ?? session?.user?.id ?? null;
  const effectiveRadius = radiusHeader
    ? parseFloat(radiusHeader)
    : DEFAULT_RADIUS_MILES;

  // Note: System instructions are handled in the frontend via CopilotChat instructions prop

  // Define CopilotKit actions (converted from Vercel AI SDK tools)
  const runtime = new CopilotRuntime({
    actions: [
      // GET_USER_CONTEXT
      {
        name: "get_user_context",
        description:
          "Get basic context for a user: preferred radius (future) and saved locations that can act as defaults. Never returns sensitive data.",
        parameters: [
          {
            name: "userId",
            type: "string",
            description: "The authenticated user id.",
            required: true,
          },
        ],
        handler: async ({ userId }: { userId: string }) => {
          const [profile] = await db
            .select()
            .from(userProfiles)
            .where(eq(userProfiles.userId, userId))
            .limit(1);

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
      },

      // SEARCH_RESOURCES
      {
        name: "search_resources",
        description:
          "Search for nearby food resources (food banks, pantries) constrained by location and radius.",
        parameters: [
          {
            name: "lat",
            type: "number",
            description: "Latitude of the search center",
            required: true,
          },
          {
            name: "lng",
            type: "number",
            description: "Longitude of the search center",
            required: true,
          },
          {
            name: "radiusMiles",
            type: "number",
            description:
              "Maximum distance in miles from the center to include in results. Default 10.",
            required: false,
          },
          {
            name: "openNow",
            type: "boolean",
            description:
              "If true, only include locations that are currently open.",
            required: false,
          },
          {
            name: "services",
            type: "string[]",
            description: "Optional list of required services.",
            required: false,
          },
          {
            name: "limit",
            type: "number",
            description: "Maximum number of results to return.",
            required: false,
          },
        ],
        handler: async ({
          lat,
          lng,
          radiusMiles = 10,
          openNow,
          services,
          limit,
        }: {
          lat: number;
          lng: number;
          radiusMiles?: number;
          openNow?: boolean;
          services?: string[];
          limit?: number;
        }) => {
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
      },

      // GET_RESOURCE_BY_ID
      {
        name: "get_resource_by_id",
        description:
          "Get detailed information about a specific food resource (food bank) by id.",
        parameters: [
          {
            name: "id",
            type: "string",
            description: "The food bank id.",
            required: true,
          },
        ],
        handler: async ({ id }: { id: string }) => {
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
      },

      // SEARCH_POSTS
      {
        name: "search_posts",
        description:
          "Search nearby community posts (offers/requests) within a radius. Only returns posts with known coordinates and within distance.",
        parameters: [
          {
            name: "lat",
            type: "number",
            description: "Latitude of the search center",
            required: true,
          },
          {
            name: "lng",
            type: "number",
            description: "Longitude of the search center",
            required: true,
          },
          {
            name: "radiusMiles",
            type: "number",
            description:
              "Maximum distance in miles from the center. Default 10.",
            required: false,
          },
          {
            name: "kind",
            type: "string",
            description:
              "Filter by kind of post. 'share' for offers, 'request' for needs, 'all' for both. Default 'all'.",
            required: false,
          },
          {
            name: "limit",
            type: "number",
            description: "Maximum number of posts to return.",
            required: false,
          },
        ],
        handler: async ({
          lat,
          lng,
          radiusMiles = 10,
          kind = "all",
          limit,
        }: {
          lat: number;
          lng: number;
          radiusMiles?: number;
          kind?: string;
          limit?: number;
        }) => {
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
      },

      // SEARCH_EVENTS
      {
        name: "search_events",
        description:
          "Search for nearby events (potlucks, volunteer, food-related) within a radius and optional time window.",
        parameters: [
          {
            name: "lat",
            type: "number",
            description: "Latitude of the search center",
            required: true,
          },
          {
            name: "lng",
            type: "number",
            description: "Longitude of the search center",
            required: true,
          },
          {
            name: "radiusMiles",
            type: "number",
            description:
              "Maximum distance in miles from the center. Default 10.",
            required: false,
          },
          {
            name: "type",
            type: "string",
            description:
              "Filter by event type. Options: 'potluck', 'volunteer', 'food-distribution', 'all'. Default 'all'.",
            required: false,
          },
          {
            name: "from",
            type: "string",
            description: "ISO start datetime for the search window.",
            required: false,
          },
          {
            name: "to",
            type: "string",
            description: "ISO end datetime for the search window.",
            required: false,
          },
          {
            name: "limit",
            type: "number",
            description: "Maximum number of events to return.",
            required: false,
          },
        ],
        handler: async ({
          lat,
          lng,
          radiusMiles = 10,
          type = "all",
          from,
          to,
          limit,
        }: {
          lat: number;
          lng: number;
          radiusMiles?: number;
          type?: string;
          from?: string;
          to?: string;
          limit?: number;
        }) => {
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
      },

      // GET_DIRECTIONS
      {
        name: "get_directions",
        description:
          "Create a Google Maps directions URL between two coordinates. Use coordinates from prior tool results.",
        parameters: [
          {
            name: "fromLat",
            type: "number",
            description: "Starting latitude",
            required: true,
          },
          {
            name: "fromLng",
            type: "number",
            description: "Starting longitude",
            required: true,
          },
          {
            name: "toLat",
            type: "number",
            description: "Destination latitude",
            required: true,
          },
          {
            name: "toLng",
            type: "number",
            description: "Destination longitude",
            required: true,
          },
        ],
        handler: async ({
          fromLat,
          fromLng,
          toLat,
          toLng,
        }: {
          fromLat: number;
          fromLng: number;
          toLat: number;
          toLng: number;
        }) => {
          const origin = encodeURIComponent(`${fromLat},${fromLng}`);
          const destination = encodeURIComponent(`${toLat},${toLng}`);
          const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
          return { url };
        },
      },

      // LOG_CHAT
      {
        name: "log_chat",
        description:
          "Record a lightweight log entry about an AI interaction for debugging and analytics.",
        parameters: [
          {
            name: "userId",
            type: "string",
            description: "The user id (nullable)",
            required: false,
          },
          {
            name: "summary",
            type: "string",
            description: "Short description of what the assistant did.",
            required: true,
          },
          {
            name: "usedTools",
            type: "string[]",
            description: "Names of tools invoked during this interaction.",
            required: true,
          },
        ],
        handler: async ({
          userId,
          summary,
          usedTools,
        }: {
          userId?: string | null;
          summary: string;
          usedTools: string[];
        }) => {
          // eslint-disable-next-line no-console
          console.log("[AI LOG]", {
            userId: userId ?? null,
            summary,
            usedTools,
          });
          return { ok: true };
        },
      },
    ],
  });

  // Create the endpoint handler
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
}
