"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Calendar,
  PackageOpen,
  HandHeart
} from "lucide-react";

interface SmartPromptProps {
  text: string;
  category: "time" | "location" | "need" | "community" | "general";
  icon: React.ReactNode;
  onClick: (prompt: string) => void;
  disabled?: boolean;
  className?: string;
}

interface SmartPromptsProps {
  coords?: { lat: number; lng: number } | null;
  locationLabel?: string | null;
  hasMessages?: boolean;
  onSelectPrompt: (prompt: string) => void;
  className?: string;
}

/**
 * Glassmorphism Smart Prompt Component
 *
 * A single smart prompt button with glassmorphism styling
 */
function SmartPrompt({
  text,
  category,
  icon,
  onClick,
  disabled = false,
  className,
}: SmartPromptProps) {
  const accents: Record<SmartPromptProps["category"], string> = {
    time: "text-amber-300/90 group-hover:text-amber-200",
    location: "text-sky-300/90 group-hover:text-sky-200",
    need: "text-rose-300/90 group-hover:text-rose-200",
    community: "text-emerald-300/90 group-hover:text-emerald-200",
    general: "text-violet-300/90 group-hover:text-violet-200",
  };

  return (
    <button
      type="button"
      onClick={() => onClick(text)}
      disabled={disabled}
      className={cn(
        // Glassmorphism base styles
        "group inline-flex items-center justify-center gap-2 sm:gap-2.5",
        "rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5",
        "text-sm sm:text-base font-medium text-white/90",
        // Glass effect
        "bg-white/5 backdrop-blur-[15px]",
        "border border-white/10",
        "shadow-[0_4px_30px_rgba(0,0,0,0.1)]",
        // Hover and interaction states
        "transition-all duration-200 ease-out",
        "hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] hover:shadow-[0_8px_40px_rgba(0,0,0,0.15)]",
        "active:scale-[0.98]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <span className={cn("text-lg sm:text-xl shrink-0 transition-colors duration-200", accents[category])}>
        {icon}
      </span>
      <span className="truncate">{text}</span>
    </button>
  );
}

/**
 * Enhanced Smart Prompts Component
 * 
 * Context-aware prompt suggestions that adapt based on time, location,
 * and user behavior patterns
 */
export function EnhancedSmartPrompts({
  hasMessages = false,
  onSelectPrompt,
  className
}: SmartPromptsProps) {
  // Core action prompts - intelligent shortcuts to app features
  const prompts = React.useMemo(() => [
    {
      text: "Find potlucks near me",
      category: "community" as const,
      icon: <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
    },
    {
      text: "Show food on the map",
      category: "location" as const,
      icon: <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
    },
    {
      text: "Browse the community pantry",
      category: "general" as const,
      icon: <PackageOpen className="w-4 h-4 sm:w-5 sm:h-5" />
    },
    {
      text: "How can I volunteer?",
      category: "community" as const,
      icon: <HandHeart className="w-4 h-4 sm:w-5 sm:h-5" />
    }
  ], []);

  if (hasMessages || prompts.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "animate-in fade-in duration-500 w-full grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4",
        className
      )}
    >
      {prompts.map((prompt, index) => (
        <SmartPrompt
          key={prompt.text}
          text={prompt.text}
          category={prompt.category}
          icon={prompt.icon}
          onClick={onSelectPrompt}
        />
      ))}
    </div>
  );
}

