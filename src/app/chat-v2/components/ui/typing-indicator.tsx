"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TypingIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  variant?: "default" | "contextual" | "minimal";
  className?: string;
}

/**
 * Enhanced Typing Indicator Component
 * 
 * A theme-aware typing indicator that provides contextual feedback
 * based on the current action being performed
 */
export function TypingIndicator({ 
  message = "Thinking...",
  variant = "default",
  className,
  ...props 
}: TypingIndicatorProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  // Contextual messages based on common actions
  const contextualMessages = React.useMemo(
    () => ({
      searching: "🔍 Searching nearby resources...",
      calculating: "🗺️ Calculating distances...",
      checking: "📅 Checking event schedules...",
      analyzing: "🧠 Analyzing your request...",
      processing: "⚡ Processing your request...",
      loading: "⏳ Loading resources...",
      finding: "📍 Finding nearby options...",
      matching: "🎯 Matching your preferences...",
      connecting: "🔗 Connecting to services...",
    }),
    []
  );

  // Choose appropriate message based on variant
  const displayMessage = React.useMemo(() => {
    if (variant === "contextual") {
      // For contextual variant, cycle through relevant messages
      const messages = Object.values(contextualMessages);
      const randomIndex = Math.floor(Math.random() * messages.length);
      return messages[randomIndex];
    }
    return message;
  }, [variant, message, contextualMessages]);

  // Animation effect for the dots
  const [dotIndex, setDotIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setDotIndex(prev => (prev + 1) % 4);
    }, 300);
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "flex items-center justify-center gap-2 py-3 px-4",
        "text-sm text-muted-foreground",
        "animate-in fade-in duration-300",
        className
      )}
      {...props}
    >
      {/* Animated dots */}
      <div className="flex space-x-1">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={cn(
              "w-2 h-2 rounded-full",
              "bg-muted-foreground",
              "transition-all duration-300 ease-in-out",
              dotIndex === index && "scale-125 opacity-75",
              dotIndex !== index && "scale-75 opacity-50"
            )}
            style={{
              animationDelay: `${index * 0.15}s`,
            }}
          />
        ))}
      </div>

      {/* Message text */}
      <span className="select-none">
        {displayMessage}
      </span>

      {/* Dismiss button for some variants */}
      {variant === "minimal" && (
        <button
          onClick={() => setIsVisible(false)}
          className={cn(
            "ml-2 p-1 rounded-full hover:bg-muted/50",
            "transition-colors duration-200",
            "text-xs opacity-60 hover:opacity-100"
          )}
        >
          ✕
        </button>
      )}
    </div>
  );
}

interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  status: "online" | "offline" | "connecting" | "error";
  className?: string;
}

export function StatusIndicator({ status, className, ...props }: StatusIndicatorProps) {
  const statusConfig = {
    online: {
      text: "Online",
      icon: "🟢",
      className: "text-green-600 dark:text-green-400"
    },
    offline: {
      text: "Offline",
      icon: "🔴",
      className: "text-red-600 dark:text-red-400"
    },
    connecting: {
      text: "Connecting",
      icon: "🟡",
      className: "text-yellow-600 dark:text-yellow-400"
    },
    error: {
      text: "Error",
      icon: "❌",
      className: "text-red-600 dark:text-red-400"
    }
  };

  const config = statusConfig[status];

  return (
    <div 
      className={cn(
        "flex items-center gap-2 text-xs",
        config.className,
        className
      )}
      {...props}
    >
      <span>{config.icon}</span>
      <span>{config.text}</span>
    </div>
  );
}
