"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  MapPin, 
  Calendar, 
  ShoppingCart, 
  Soup, 
  Home, 
  Users, 
  Lightbulb,
  Sparkles
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
 * Enhanced Smart Prompt Component
 * 
 * A single smart prompt button with contextual styling and animations
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
    time: "text-amber-300",
    location: "text-sky-300",
    need: "text-rose-300",
    community: "text-emerald-300",
    general: "text-primary",
  };

  return (
    <button
      type="button"
      onClick={() => onClick(text)}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border/40 bg-card/80 px-4 py-2 text-xs font-medium text-foreground transition-all duration-200",
        "hover:border-primary/40 hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <span className={cn("text-sm", accents[category])}>{icon}</span>
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
  coords,
  locationLabel,
  hasMessages = false,
  onSelectPrompt,
  className 
}: SmartPromptsProps) {
  // Get current time context
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();
  const isWeekend = currentDay === 0 || currentDay === 6;
  
  // Determine time of day
  const getTimeOfDay = (): "morning" | "afternoon" | "evening" | "night" => {
    if (currentHour >= 5 && currentHour < 12) return "morning";
    if (currentHour >= 12 && currentHour < 17) return "afternoon";
    if (currentHour >= 17 && currentHour < 21) return "evening";
    return "night";
  };

  const timeOfDay = getTimeOfDay();

  // Generate context-aware prompts
  const generatePrompts = (): Array<{
    text: string;
    category: SmartPromptProps["category"];
    icon: React.ReactNode;
  }> => {
    const baseLocation = locationLabel || "your area";
    const locationContext = coords ? ` near ${baseLocation}` : "";

    // Time-based prompts
    const timePrompts = {
      morning: [
        {
          text: `Find breakfast options${locationContext}`,
          category: "time" as const,
          icon: <Sparkles className="w-3 h-3" />
        },
        {
          text: `Get food pantries open this morning${locationContext}`,
          category: "time" as const,
          icon: <Clock className="w-3 h-3" />
        }
      ],
      afternoon: [
        {
          text: `Find lunch or meal programs${locationContext}`,
          category: "time" as const,
          icon: <Soup className="w-3 h-3" />
        },
        {
          text: `Locate food banks with afternoon hours${locationContext}`,
          category: "time" as const,
          icon: <Clock className="w-3 h-3" />
        }
      ],
      evening: [
        {
          text: `Find dinner or evening meal services${locationContext}`,
          category: "time" as const,
          icon: <Home className="w-3 h-3" />
        },
        {
          text: `Community meals happening tonight${locationContext}`,
          category: "community" as const,
          icon: <Users className="w-3 h-3" />
        }
      ],
      night: [
        {
          text: `Emergency food assistance nearby${locationContext}`,
          category: "need" as const,
          icon: <Lightbulb className="w-3 h-3" />
        },
        {
          text: `24-hour food resources${locationContext}`,
          category: "need" as const,
          icon: <Clock className="w-3 h-3" />
        }
      ]
    };

    // Weekend-specific prompts
    const weekendPrompts = isWeekend ? [
      {
        text: `Weekend food distribution events${locationContext}`,
        category: "community" as const,
        icon: <Calendar className="w-3 h-3" />
      },
      {
        text: `Volunteer opportunities today${locationContext}`,
        category: "community" as const,
        icon: <Users className="w-3 h-3" />
      }
    ] : [];

    // Location-based prompts
    const locationPrompts = coords ? [
      {
        text: `Food resources within 5 miles${locationContext}`,
        category: "location" as const,
        icon: <MapPin className="w-3 h-3" />
      }
    ] : [
      {
        text: `Find food resources in your area`,
        category: "location" as const,
        icon: <MapPin className="w-3 h-3" />
      }
    ];

    // Need-based prompts
    const needPrompts = [
      {
        text: `I need food assistance`,
        category: "need" as const,
        icon: <ShoppingCart className="w-3 h-3" />
      },
      {
        text: `Find free meal programs`,
        category: "need" as const,
        icon: <Soup className="w-3 h-3" />
      }
    ];

    // General prompts
    const generalPrompts = [
      {
        text: `What food resources are available?`,
        category: "general" as const,
        icon: <Lightbulb className="w-3 h-3" />
      },
      {
        text: `Help someone in need`,
        category: "community" as const,
        icon: <Users className="w-3 h-3" />
      }
    ];

    // Select prompts based on context
    const selectedTimePrompts = timePrompts[timeOfDay];
    const allPrompts = [
      ...selectedTimePrompts,
      ...weekendPrompts,
      ...locationPrompts.slice(0, 1), // Only one location prompt
      ...needPrompts.slice(0, 1), // Only one need prompt
      ...generalPrompts.slice(0, 1) // Only one general prompt
    ];

    // Deterministically select top 4 (avoid hydration mismatch)
    // Use a consistent selection based on time of day to avoid Math.random()
    const hour = new Date().getHours();
    const startIndex = hour % Math.max(1, allPrompts.length - 3);
    return allPrompts.slice(startIndex, startIndex + 4);
  };

  const [prompts, setPrompts] = React.useState(() => generatePrompts());

  // Regenerate prompts when context changes
  React.useEffect(() => {
    setPrompts(generatePrompts());
  }, [coords, locationLabel, timeOfDay, isWeekend]);

  if (hasMessages || prompts.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "animate-in fade-in duration-300 rounded-2xl border border-border/40 bg-card/90 p-4 shadow-[0_12px_30px_rgba(6,8,20,0.12)]",
        className
      )}
    >
      <div className="mb-2 flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span>Quick starts</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt, index) => (
          <SmartPrompt
            key={index}
            text={prompt.text}
            category={prompt.category}
            icon={prompt.icon}
            onClick={onSelectPrompt}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{timeOfDay} · {isWeekend ? "Weekend" : "Weekday"}</span>
        </div>
        {coords && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>Nearby</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface QuickActionProps {
  text: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function QuickAction({ 
  text, 
  icon, 
  onClick, 
  variant = "outline",
  size = "sm",
  className 
}: QuickActionProps) {
  const sizeClasses = {
    sm: "h-8 px-2 text-xs",
    md: "h-9 px-3 text-sm",
    lg: "h-10 px-4 text-base"
  };

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={onClick}
      className={cn(
        "gap-1.5 transition-all duration-200 ease-in-out",
        "hover:scale-105 hover:shadow-md",
        sizeClasses[size],
        className
      )}
    >
      {icon}
      <span>{text}</span>
    </Button>
  );
}
