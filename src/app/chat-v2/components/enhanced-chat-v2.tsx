"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { useCopilotChatHeadless_c, useCopilotReadable } from "@copilotkit/react-core";
import { cn } from "@/lib/utils";
import { MessageBubble } from "./ui/message-bubble";
import { TypingIndicator } from "./ui/typing-indicator";
import { InputArea } from "./ui/input-area";
import { ToolRenderers } from "./tool-renderers";
import { EmptyState } from "./empty-state";
import { useChatSuggestions } from "../hooks/use-chat-suggestions";
import { buildSousChefSystemPrompt } from "@/lib/prompts/chat-system";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EnhancedSmartPrompts } from "./actions/smart-prompts";

interface EnhancedChatV2Props {
  coords?: { lat: number; lng: number } | null;
  locationLabel?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
}

const ENHANCED_TOOL_INSTRUCTIONS = `
CRITICAL TOOL USAGE RULES:
1. When a tool returns data, ALWAYS acknowledge what you found in your response
2. Count the actual results from the tool and report that number
3. NEVER say "no data" or "nothing available" when the tool returned results
4. The tool renders cards visually - your text should complement the visual display
5. Example: If search_resources returns 8 results, say "I found 8 food banks nearby" not "There are no resources"

Format your responses like this:
- "I found [N] food resources within [radius] miles of [location]"
- "Here are [N] upcoming events in your area"
- "I located [N] community posts nearby"

If a tool actually returns empty results, then you can say no results were found.
`;

const markdownComponents: Components = {
  h1: (props) => <h1 className="mt-2 mb-3 text-2xl font-semibold" {...props} />,
  h2: (props) => <h2 className="mt-2 mb-2 text-xl font-semibold" {...props} />,
  h3: (props) => <h3 className="mt-2 mb-2 text-lg font-semibold" {...props} />,
  p: (props) => <p className="mb-3 leading-7 text-sm" {...props} />,
  ul: (props) => <ul className="mb-3 ml-5 list-disc space-y-1 text-sm" {...props} />,
  ol: (props) => <ol className="mb-3 ml-5 list-decimal space-y-1 text-sm" {...props} />,
  li: (props) => <li className="leading-6" {...props} />,
  a: (props) => (
    <a
      className="text-primary underline underline-offset-2 hover:opacity-90"
      target="_blank"
      rel="noreferrer noopener"
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote className="mb-3 border-l-2 border-border pl-3 text-muted-foreground" {...props} />
  ),
  code: ({ children, className, ...props }) => {
    const match = /language-(\w+)/.exec(className || "");
    const isInline = !match;
    if (isInline) {
      return (
        <code className="rounded bg-muted px-1 py-0.5 text-xs" {...props}>
          {children}
        </code>
      );
    }
    return (
      <pre className="mb-3 w-full overflow-x-auto rounded-md bg-muted p-3">
        <code className="text-xs leading-5" {...props}>
          {children}
        </code>
      </pre>
    );
  },
  table: (props) => (
    <div className="mb-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: (props) => <th className="border border-border bg-muted px-2 py-1 text-left" {...props} />,
  td: (props) => <td className="border border-border px-2 py-1" {...props} />,
};

interface AGUIMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content?: string;
  generativeUI?: (props?: Record<string, unknown>) => React.ReactNode;
  toolCalls?: Array<{
    id: string;
    function: {
      name: string;
      arguments: string;
    };
  }>;
  image?: {
    format: string;
    bytes: string;
  };
  createdAt?: Date;
}

interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string | React.ReactNode;
  timestamp?: string;
  isStreaming?: boolean;
}

const contextualTypingMessages = [
  "🔍 Searching nearby resources...",
  "🗺️ Mapping out directions for you...",
  "📅 Checking community calendars...",
  "🧠 Thinking through your request...",
  "🥕 Finding fresh produce and pantry hours...",
  "🤝 Looking for neighbors who can help...",
];

interface InsightCard {
  title: string;
  value: string;
  description: string;
}

export function EnhancedChatV2({
  coords,
  locationLabel,
  user,
}: EnhancedChatV2Props) {
  const systemInstructions = React.useMemo(() => {
    const basePrompt = buildSousChefSystemPrompt({
      location: coords ? { lat: coords.lat, lng: coords.lng, label: locationLabel } : null,
      radiusMiles: 15,
      userId: user?.id || null,
    });
    return basePrompt + "\n\n" + ENHANCED_TOOL_INSTRUCTIONS;
  }, [coords, locationLabel, user?.id]);

  const { messages: rawMessages, sendMessage, isLoading } = useCopilotChatHeadless_c();

  useCopilotReadable({
    description: "System instructions and context for the AI assistant",
    value: systemInstructions,
  });

  const [prefillPrompt, setPrefillPrompt] = React.useState<string | null>(null);
  const [typingMessage, setTypingMessage] = React.useState<string>();
  const [timestamps, setTimestamps] = React.useState<Record<string, string>>({});
  const processedMessageIds = React.useRef<Set<string>>(new Set());
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const isDesktopLayout = useIsDesktopLayout();

  useChatSuggestions({ coords: coords || null });

  const messages = React.useMemo<AGUIMessage[]>(() => {
    return rawMessages.map((msg) => msg as unknown as AGUIMessage);
  }, [rawMessages]);

  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages.length, isLoading, scrollToBottom]);

  React.useEffect(() => {
    let hasNewMessages = false;
    const newTimestamps: Record<string, string> = {};

    messages.forEach((message) => {
      if (!processedMessageIds.current.has(message.id)) {
        processedMessageIds.current.add(message.id);
        newTimestamps[message.id] = new Date().toISOString();
        hasNewMessages = true;
      }
    });

    if (hasNewMessages) {
      setTimestamps((previous) => ({ ...previous, ...newTimestamps }));
    }
  }, [messages]);

  React.useEffect(() => {
    if (!isLoading) {
      setTypingMessage(undefined);
      return;
    }
    const selection =
      contextualTypingMessages[
        Math.floor(Math.random() * contextualTypingMessages.length)
      ];
    setTypingMessage(selection);
  }, [isLoading, messages.length]);

  const hasChatHistory = React.useMemo(
    () => messages.some((message) => message.role === "user" || message.role === "assistant"),
    [messages]
  );

  const streamingAssistantId = React.useMemo(() => {
    if (!isLoading) return null;
    const pending = [...messages].reverse().find((message) => message.role === "assistant");
    return pending?.id ?? null;
  }, [messages, isLoading]);

  const formattedMessages = React.useMemo<DisplayMessage[]>(() => {
    return messages
      .filter((message) => message.role === "user" || message.role === "assistant")
      .map((message) => ({
        id: message.id,
        role: message.role === "user" ? "user" : "assistant",
        content: renderMessageContent(message),
        timestamp: timestamps[message.id],
        isStreaming: streamingAssistantId === message.id,
      }));
  }, [messages, timestamps, streamingAssistantId]);

  const lastUserPrompt = React.useMemo(() => {
    const latest = [...messages]
      .reverse()
      .find((message) => message.role === "user" && typeof message.content === "string");

    return typeof latest?.content === "string" ? latest.content : null;
  }, [messages]);

  const insightCards = React.useMemo<InsightCard[]>(() => {
    return [
      {
        title: "Tonight's ideas",
        value: isLoading ? "Drafting reply..." : hasChatHistory ? "Ready for seconds" : "Waiting on you",
        description: hasChatHistory
          ? "I'll keep building on your latest chat."
          : "Ask for a meal plan or local resource to begin.",
      },
      {
        title: "Use up these ingredients",
        value: formatPromptPreview(lastUserPrompt) || "Tell me what's in your kitchen",
        description: lastUserPrompt
          ? "Pulled from your most recent message."
          : "Mention a few ingredients to get recipe ideas.",
      },
      {
        title: "Neighborhood focus",
        value: locationLabel || (coords ? "Current location" : "Share your area"),
        description: coords
          ? "Tuned to spots within ~15 miles."
          : "Using your saved defaults until you share.",
      },
    ];
  }, [coords, hasChatHistory, isLoading, lastUserPrompt, locationLabel]);

  const handleSendMessage = async (rawValue: string) => {
    const text = rawValue.trim();
    if (!text) return;

    try {
      await sendMessage({
        id: generateMessageId(),
        role: "user",
        content: text,
      });
    } catch (error) {
      console.error("Unable to send message", error);
    }
  };

  const handlePromptSelection = (prompt: string) => {
    setPrefillPrompt(prompt);
  };

  return (
    <div className="relative flex h-full w-full flex-1 min-h-0 flex-col overflow-hidden bg-[#2d2d34] text-foreground">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-100"
        aria-hidden
        style={{
          background:
            "linear-gradient(180deg, rgba(33,33,41,0.98) 0%, rgba(22,22,26,0.98) 65%, rgba(18,18,22,0.98) 100%)",
        }}
      />
      <ToolRenderers userLocation={coords || null} />

      <div className="relative z-10 flex h-full w-full flex-1 min-h-0 flex-col px-4 py-4 sm:px-6 lg:px-10 xl:mx-auto xl:max-w-5xl">
        <section className="relative flex h-full flex-1 min-h-0 flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[#1f1f27] shadow-[0_30px_80px_rgba(0,0,0,0.4)]">
          <ChatHeroHeader user={user} locationLabel={locationLabel} />

          <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
            <div
              className={cn(
                "flex-1 overflow-y-auto px-4 py-6 sm:px-8",
                hasChatHistory ? "space-y-4" : "flex items-center justify-center"
              )}
            >
              {hasChatHistory ? (
                <>
                  {formattedMessages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      role={message.role}
                      content={message.content}
                      timestamp={message.timestamp}
                      isStreaming={message.isStreaming}
                    />
                  ))}
                  {isLoading && (
                    <TypingIndicator
                      message={typingMessage}
                      className="animate-in fade-in duration-300"
                    />
                  )}
                </>
              ) : (
                <EmptyState>
                  <EnhancedSmartPrompts
                    coords={coords || null}
                    locationLabel={locationLabel}
                    hasMessages={hasChatHistory}
                    onSelectPrompt={handlePromptSelection}
                    className="mt-8"
                  />
                </EmptyState>
              )}
              <div ref={messagesEndRef} />
            </div>

            <ComposerDock
              isDesktop={isDesktopLayout}
              onSendMessage={handleSendMessage}
              onVoiceInput={(transcript) => setPrefillPrompt(transcript)}
              prefillPrompt={prefillPrompt}
              onPrefillConsumed={() => setPrefillPrompt(null)}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function renderMessageContent(message: AGUIMessage): string | React.ReactNode {
  const textContent = message.content ? (
    <ReactMarkdown components={markdownComponents}>{message.content}</ReactMarkdown>
  ) : null;

  const generativeContent = typeof message.generativeUI === "function"
    ? message.generativeUI?.()
    : null;

  if (textContent && generativeContent) {
    return (
      <div className="space-y-4">
        {textContent}
        {generativeContent}
      </div>
    );
  }

  return textContent || generativeContent || null;
}

function generateMessageId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

interface ChatHeroHeaderProps {
  user?: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
  locationLabel?: string | null;
}

function ChatHeroHeader({ user, locationLabel }: ChatHeroHeaderProps) {
  const subtitle = locationLabel
    ? `Serving neighbors near ${locationLabel}`
    : "Share your location for hyper-local help";

  return (
    <div className="border-b border-border/40 px-4 pb-3 pt-4 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.35em] text-muted-foreground/80 dark:text-white/60">
            Neighborhood resource network
          </p>
          <h1 className="mt-1.5 text-xl font-semibold text-foreground dark:text-white">
            Sous-chef AI
          </h1>
          <p className="text-xs text-muted-foreground dark:text-white/70">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-[0.65rem] font-semibold text-emerald-700 dark:bg-emerald-400/25 dark:text-emerald-50">
            Online
          </span>
          <Avatar className="h-9 w-9 border border-border/60 bg-background/40 dark:border-white/15">
            <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "You"} />
            <AvatarFallback>{getInitials(user?.name || user?.email || "You")}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}

interface ComposerDockProps {
  isDesktop: boolean;
  onSendMessage: (message: string) => void;
  onVoiceInput: (transcript: string) => void;
  prefillPrompt: string | null;
  onPrefillConsumed: () => void;
}

function ComposerDock({
  isDesktop,
  onSendMessage,
  onVoiceInput,
  prefillPrompt,
  onPrefillConsumed,
}: ComposerDockProps) {
  return (
    <div className="shrink-0 px-4 pb-6 pt-2 sm:px-8">
      <div className="rounded-[20px] border border-white/12 bg-[#2d2d34]/95 p-3 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <InputArea
          variant={isDesktop ? "floating" : "surface"}
          onSendMessage={onSendMessage}
          onVoiceInput={onVoiceInput}
          placeholder="Ask Sous-chef about meals, resources, or ways to share..."
          prefillValue={prefillPrompt}
          onPrefillConsumed={onPrefillConsumed}
        />
      </div>
    </div>
  );
}

interface InsightsRailProps {
  insights: InsightCard[];
}

function InsightsRail({ insights }: InsightsRailProps) {
  return (
    <aside className="hidden lg:flex flex-col gap-4 rounded-[32px] border border-border/50 bg-card/90 p-5 shadow-[0_25px_70px_rgba(5,9,20,0.2)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60">
      {insights.map((card) => (
        <div
          key={card.title}
          className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/95 p-4 shadow-inner"
        >
          <span className="absolute inset-y-4 right-4 w-1 rounded-full bg-primary/70" />
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
            {card.title}
          </p>
          <p className="mt-3 text-2xl font-semibold leading-snug text-foreground">
            {card.value}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{card.description}</p>
        </div>
      ))}
    </aside>
  );
}

function formatPromptPreview(prompt: string | null): string | null {
  if (!prompt) return null;
  if (prompt.length <= 42) {
    return prompt;
  }
  return `${prompt.slice(0, 39)}...`;
}

function getInitials(name: string) {
  if (!name) return "U";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

function useIsDesktopLayout(query = "(min-width: 1024px)") {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia(query);
    const handleChange = () => setMatches(media.matches);
    handleChange();
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}
