"use client";

interface TypingIndicatorProps {
  message?: string;
}

export function TypingIndicator({
  message = "Thinking...",
}: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/30 border border-border/30 w-fit max-w-xs">
      <div className="flex gap-1">
        <div
          className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
          style={{ animationDelay: "0ms", animationDuration: "1s" }}
        />
        <div
          className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
          style={{ animationDelay: "150ms", animationDuration: "1s" }}
        />
        <div
          className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
          style={{ animationDelay: "300ms", animationDuration: "1s" }}
        />
      </div>
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  );
}

// Context-aware typing messages
export const TYPING_MESSAGES = {
  searching: "🔍 Searching nearby resources...",
  calculating: "🗺️ Calculating distances...",
  checking: "📅 Checking event schedules...",
  finding: "🔎 Finding the best matches...",
  loading: "⏳ Loading results...",
  thinking: "🧠 Thinking about your request...",
} as const;
