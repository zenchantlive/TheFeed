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
import { formatTimestamp } from "../lib/date-utils";

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
        timestamp: timestamps[message.id] ? formatTimestamp(timestamps[message.id]) : undefined,
        isStreaming: streamingAssistantId === message.id,
      }));
  }, [messages, timestamps, streamingAssistantId]);

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
    <div className="relative flex h-full w-full flex-col overflow-hidden text-foreground">
      {/* Aurora gradient background for glassmorphism effect */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-100"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.3), transparent), radial-gradient(ellipse 60% 50% at 80% 50%, rgba(236, 72, 153, 0.15), transparent), radial-gradient(ellipse 60% 50% at 20% 80%, rgba(59, 130, 246, 0.15), transparent), linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)",
        }}
      />
      <ToolRenderers userLocation={coords || null} />

      <div className="relative z-10 flex h-full w-full flex-1 min-h-0 flex-col px-3 py-3 sm:px-4 sm:py-4 md:px-6 lg:px-10 xl:mx-auto xl:max-w-6xl 2xl:max-w-7xl">
        <section className="relative flex h-full flex-1 min-h-0 flex-col overflow-hidden rounded-[24px] sm:rounded-[30px] border border-white/10 bg-[#1f1f27] shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:shadow-[0_30px_80px_rgba(0,0,0,0.4)]">
          <ChatHeroHeader user={user} locationLabel={locationLabel} />

          <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
            <div
              className={cn(
                "flex-1 overflow-y-auto scrollbar-thin px-3 py-4 sm:px-6 sm:py-6 md:px-8",
                hasChatHistory ? "space-y-3 sm:space-y-4" : "flex items-center justify-center",
                "mx-auto w-full max-w-full md:max-w-[800px] lg:max-w-[900px]"
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
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <EmptyState>
                  <EnhancedSmartPrompts
                    coords={coords || null}
                    locationLabel={locationLabel}
                    hasMessages={hasChatHistory}
                    onSelectPrompt={handlePromptSelection}
                    className="mt-6 sm:mt-8"
                  />
                </EmptyState>
              )}
            </div>

            <ComposerDock
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
    <div className="shrink-0 border-b border-white/10 px-3 pb-2.5 pt-3 sm:px-4 sm:pb-3 sm:pt-4 md:px-6 landscape:py-2">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[0.55rem] sm:text-[0.65rem] uppercase tracking-[0.3em] sm:tracking-[0.35em] text-white/60">
            Neighborhood resource network
          </p>
          <h1 className="mt-1 sm:mt-1.5 text-lg sm:text-xl font-semibold text-white">
            TheFeed
          </h1>
          <p className="text-[0.7rem] sm:text-xs text-white/70 truncate">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border border-white/15 bg-background/40 ring-2 ring-transparent hover:ring-primary/20 transition-all duration-200">
            <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "You"} />
            <AvatarFallback className="text-xs sm:text-sm">{getInitials(user?.name || user?.email || "You")}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}

interface ComposerDockProps {
  onSendMessage: (message: string) => void;
  onVoiceInput: (transcript: string) => void;
  prefillPrompt: string | null;
  onPrefillConsumed: () => void;
}

function ComposerDock({
  onSendMessage,
  onVoiceInput,
  prefillPrompt,
  onPrefillConsumed,
}: ComposerDockProps) {
  return (
    <div className="shrink-0 px-3 pb-4 pt-2 sm:px-4 sm:pb-6 md:px-8 mx-auto w-full max-w-full md:max-w-[800px] lg:max-w-[900px]">
      {/* Single glassmorphism composer - no card wrapper nesting */}
      <div
        className={cn(
          // Glassmorphism styles applied directly
          "rounded-full",
          "bg-white/5 backdrop-blur-[15px]",
          "border border-white/10",
          "shadow-[0_4px_30px_rgba(0,0,0,0.1)]",
          "transition-all duration-200 ease-out",
          "hover:bg-white/8 hover:border-white/20 hover:shadow-[0_8px_40px_rgba(0,0,0,0.15)]",
          "px-4 py-2 sm:px-5 sm:py-2.5"
        )}
      >
        <InputArea
          variant="floating"
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

function getInitials(name: string) {
  if (!name) return "U";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}
