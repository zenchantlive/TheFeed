import type { z } from "zod";

export type LocationContext = {
  lat: number;
  lng: number;
  label?: string | null;
};

export type BuildPromptOptions = {
  location?: LocationContext | null;
  radiusMiles: number;
  userId?: string | null;
};

/**
 * Shared helper to generate the sous-chef system prompt with optional context.
 * Keeping this in its own module makes testing + reuse (CLI scripts, agents, etc.)
 * straightforward without coupling callers to the API route implementation.
 */
export function buildSousChefSystemPrompt({
  location,
  radiusMiles,
  userId,
}: BuildPromptOptions): string {
  const toolCatalog = `Available tools:
- get_user_context: Fetch the authenticated user's saved locations and defaults.
- search_resources: Location-constrained food bank or pantry search.
- get_resource_by_id: Retrieve full details for a single resource.
- search_posts: Find nearby community shares or requests.
- search_events: Find local events (potlucks, food distribution, volunteer).
- get_directions: Generate a reliable Google Maps directions URL.
- log_chat: Store a lightweight summary of what happened.`;

  const guidance = `Guidelines:
- Always prefer real data from tools over guesses; call tools even if partial info is available.
- Use location-aware tools whenever the user provides coordinates/zip/cross streets.
- If no precise location is available and the user asks for nearby help, politely request a zip code or landmark before responding.
- General guidance (meal ideas, volunteering tips, nutrition info) does not require a location—answer immediately.
- Respect dignity: no assumptions, no judgmental language, keep the tone warm and professional.
- Thread users back into the app when useful (map, community feed, events).`;

  const usagePlaybook = `Tool playbook:
- Questions about "food banks", "pantries", "resources", "directions", or "open now" → call search_resources (and optionally get_resource_by_id for follow ups) using the known coordinates.
- Questions about "posts", "neighbors", "shares", or "requests" → call search_posts before responding, using the provided coordinates and radius.
- Questions about "events", "volunteering", "community happenings", or dates → call search_events with reasonable time bounds.`;

  const locationContext = location
    ? `Location context: latitude ${location.lat}, longitude ${location.lng}${
        location.label ? ` (${location.label})` : ""
      }. Stay within ~${radiusMiles} miles unless the user asks for a broader search.`
    : `Location context: not provided. Ask for a nearby landmark or postal code before fulfilling location-specific requests.`;

  const userContext = userId
    ? `User context: authenticated user id ${userId}. Call get_user_context with this id before suggesting saved locations or preferences.`
    : `User context: anonymous session. Skip get_user_context unless the user supplies an id.`;

  return [
    "You are the TheFeed Sous-Chef, a neighborhood AI helping neighbors find food resources, community support, and events.",
    "Responsibilities:",
    "- Quickly surface nearby resources, events, and neighbor posts.",
    "- Clarify hours, services, transportation, and next steps.",
    "- Keep answers focused (2-3 sentences unless the user asks for detail).",
    "- Maintain an encouraging, respectful tone—professional but warm.",
    toolCatalog,
    guidance,
    usagePlaybook,
    userContext,
    locationContext,
  ].join("\n\n");
}

/**
 * Utility to help downstream callers build a safe location schema without re-exporting Zod.
 */
export const locationSchema = (zRef: typeof z) =>
  zRef.object({
    lat: zRef.number().describe("Latitude of the search center."),
    lng: zRef.number().describe("Longitude of the search center."),
    label: zRef.string().optional().describe("Optional human-friendly label."),
  });
