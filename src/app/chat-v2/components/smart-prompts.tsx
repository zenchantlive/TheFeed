"use client";

import { useMemo } from "react";

interface SmartPromptsProps {
  onSelectPrompt: (prompt: string) => void;
  coords: { lat: number; lng: number } | null;
  hasMessages: boolean;
}

interface PromptSuggestion {
  icon: string;
  label: string;
  prompt: string;
  condition?: () => boolean;
}

export function SmartPrompts({
  onSelectPrompt,
  coords,
  hasMessages,
}: SmartPromptsProps) {
  const suggestions = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = day === 0 || day === 6;
    const isMorning = hour >= 6 && hour < 12;
    const isLunchTime = hour >= 11 && hour < 14;
    const isDinnerTime = hour >= 16 && hour < 21;

    const allSuggestions: PromptSuggestion[] = [
      // Time-based prompts
      {
        icon: "🌅",
        label: "Breakfast spots",
        prompt: "Where can I get breakfast this morning?",
        condition: () => isMorning,
      },
      {
        icon: "🍱",
        label: "Lunch nearby",
        prompt: "Find lunch options open right now.",
        condition: () => isLunchTime,
      },
      {
        icon: "🍽️",
        label: "Dinner resources",
        prompt: "What are my options for dinner tonight?",
        condition: () => isDinnerTime,
      },

      // Weekend prompts
      {
        icon: "🎉",
        label: "Weekend events",
        prompt: "What community events are happening this weekend?",
        condition: () => isWeekend,
      },

      // Location-based prompts (always available if location detected)
      {
        icon: "📍",
        label: "Nearby food banks",
        prompt: "Show me food banks open right now near me.",
        condition: () => coords !== null,
      },
      {
        icon: "🗺️",
        label: "View map",
        prompt: "Show me all nearby resources on the map.",
        condition: () => coords !== null,
      },

      // Always available
      {
        icon: "🗓️",
        label: "This week's events",
        prompt: "What's happening in my neighborhood this week?",
      },
      {
        icon: "🤝",
        label: "How to help",
        prompt:
          "I want to help my neighbors—show me ways to volunteer or share food.",
      },
      {
        icon: "💬",
        label: "Community posts",
        prompt: "What are neighbors saying? Show me recent community posts.",
      },
    ];

    // Filter based on conditions
    return allSuggestions
      .filter((s) => !s.condition || s.condition())
      .slice(0, 4); // Show max 4 suggestions
  }, [coords]);

  // Don't show if there are already messages
  if (hasMessages) return null;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-4">
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelectPrompt(suggestion.prompt)}
            className="flex flex-col items-start gap-1.5 p-3 sm:p-4 rounded-xl border border-border/40 bg-card/60 hover:bg-card hover:border-border/60 hover:shadow-sm transition-all duration-200 group text-left"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform duration-200">
              {suggestion.icon}
            </span>
            <span className="text-xs sm:text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              {suggestion.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
