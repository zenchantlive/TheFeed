"use client";

import { SearchResourcesRenderer } from "./search-resources-renderer";
import { SearchEventsRenderer } from "./search-events-renderer";
import { SearchPostsRenderer } from "./search-posts-renderer";
import { DirectionsRenderer } from "./directions-renderer";
import { ResourceDetailsRenderer } from "./resource-details-renderer";
import { UserContextRenderer } from "./user-context-renderer";

/**
 * All Tool Renderers Component
 *
 * This component registers all 7 tool renderers for generative UI.
 * Each renderer uses useCopilotAction to display custom UI when
 * the AI calls backend tools.
 *
 * Tools rendered:
 * 1. search_resources - Food bank/pantry cards
 * 2. search_events - Community event cards
 * 3. search_posts - Community post previews
 * 4. get_directions - Google Maps link card
 * 5. get_resource_by_id - Detailed resource card
 * 6. get_user_context - Saved locations list
 * 7. log_chat - No rendering (silent)
 */

interface ToolRenderersProps {
  userLocation: { lat: number; lng: number } | null;
}

export function ToolRenderers({ userLocation }: ToolRenderersProps) {
  return (
    <>
      <SearchResourcesRenderer userLocation={userLocation} />
      <SearchEventsRenderer />
      <SearchPostsRenderer />
      <DirectionsRenderer />
      <ResourceDetailsRenderer userLocation={userLocation} />
      <UserContextRenderer />
      {/* log_chat has no UI rendering */}
    </>
  );
}
