"use client";

import { useMemo } from "react";
import { useCopilotChatSuggestions } from "@copilotkit/react-ui";

interface UseChatSuggestionsProps {
  coords: { lat: number; lng: number } | null;
}

/**
 * Registers contextual suggestion instructions with CopilotKit so that
 * generated smart prompts stay aligned with the current time, day, and location.
 */
export function useChatSuggestions({ coords }: UseChatSuggestionsProps) {
  const locationDescriptor = coords
    ? `near latitude ${coords.lat.toFixed(3)} and longitude ${coords.lng.toFixed(3)}`
    : "near the user's saved neighborhood";

  const contextualInstructions = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    const timeOfDay =
      hour < 11
        ? "breakfast and pantry openings this morning"
        : hour < 15
        ? "lunch programs or midday resources"
        : hour < 19
        ? "dinner services and late-afternoon events"
        : "evening emergency resources or overnight shelters";

    const weekendHint =
      day === 0 || day === 6
        ? "If it's the weekend, highlight potlucks, volunteer shifts, or special distributions."
        : "On weekdays, prefer quick assistance or after-work opportunities.";

    return `
      Suggest warm, neighborly prompts that feel like a friendly nudge.
      Emphasize ${timeOfDay} and keep each suggestion concise (max 12 words).
      Reference options ${locationDescriptor} whenever possible so users know it's local.
      ${weekendHint}
      Always include at least one way to share food or volunteer.
    `;
  }, [locationDescriptor]);

  useCopilotChatSuggestions(
    {
      instructions: contextualInstructions,
      minSuggestions: 3,
      maxSuggestions: 4,
      className: "thefeed-smart-prompts",
    },
    [contextualInstructions]
  );
}
