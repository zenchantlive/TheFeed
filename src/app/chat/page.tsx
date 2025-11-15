"use client";

import { useChat } from "@ai-sdk/react";
import { useSession } from "@/lib/auth-client";
import { UserProfile } from "@/components/auth/user-profile";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import {
  FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChatHeader } from "./components/chat-header";
import {
  MessageList,
  type ChatMessage,
  type MessagePart,
} from "./components/message-list";
import { SuggestedPrompts } from "./components/suggested-prompts";
import type { SuggestedPrompt } from "./components/suggested-prompts";
import { useResolvedLocation } from "./hooks/use-resolved-location";

const INTENT_PRESETS = {
  hungry:
    "Hey Sous-Chef, I'm hungry. Find the closest warm meals or pantries open within the next hour and tell me what to bring.",
  full:
    "Hey Sous-Chef, I'm full. Help me share my leftovers or volunteer nearby so nothing goes to waste.",
};

const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    icon: "🍴",
    label: "Find food nearby",
    value: "Find food banks open right now within 5 miles.",
  },
  {
    icon: "🗓️",
    label: "What's happening this week?",
    value: "What community events are happening this week?",
  },
  {
    icon: "🤝",
    label: "How can I help?",
    value: "I have leftovers to share—walk me through posting or volunteering nearby.",
  },
  {
    icon: "📍",
    label: "Show me the map",
    value: "Show me nearby resources on the map that I can visit today.",
  },
];

const TOOL_STATUS_LABELS: Record<string, string> = {
  get_user_context: "Reviewing saved locations…",
  search_resources: "Searching nearby resources…",
  get_resource_by_id: "Gathering resource details…",
  search_posts: "Pulling community posts…",
  search_events: "Looking up events…",
  get_directions: "Preparing directions…",
  log_chat: "Logging the conversation…",
};

type MessageLike = {
  id: string;
  role: "user" | "assistant" | "system";
  parts?: MessagePart[];
  content?: MessagePart[];
  display?: ReactNode;
};

const DEFAULT_RADIUS_MILES = 10;
const COMPOSER_PLACEHOLDER =
  "Ask for food banks, community posts, events, or ways to share…";

export default function ChatPage() {
  const { data: session, isPending } = useSession();
  const searchParams = useSearchParams();
  const { messages, sendMessage, status, error, stop } = useChat();
  const [composerValue, setComposerValue] = useState("");
  const [hasAppliedIntent, setHasAppliedIntent] = useState(false);
  const [hasPrefilledComposer, setHasPrefilledComposer] = useState(false);
  const [timestamps, setTimestamps] = useState<Record<string, string>>({});
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const hasFiredIntentRef = useRef(false);
  const {
    coords,
    label: locationLabel,
    status: locationStatus,
    refresh: refreshLocation,
  } = useResolvedLocation();
  const sessionUserId = session?.user?.id ?? null;

  const requestBodyRef = useRef<{
    radiusMiles: number;
    userId?: string | null;
    location?:
      | {
          lat: number;
          lng: number;
          label?: string;
        }
      | undefined;
  }>({
    radiusMiles: DEFAULT_RADIUS_MILES,
  });

  useEffect(() => {
    requestBodyRef.current = {
      radiusMiles: DEFAULT_RADIUS_MILES,
      userId: sessionUserId,
      location: coords
        ? {
            lat: coords.lat,
            lng: coords.lng,
            label: locationLabel ?? undefined,
          }
        : undefined,
    };
  }, [coords, locationLabel, sessionUserId]);

  const sendUserMessage = useCallback(
    (rawText: string) => {
      const text = rawText.trim();
      if (!text) {
        return false;
      }

      void sendMessage(
        { role: "user", parts: [{ type: "text", text }] },
        { body: requestBodyRef.current }
      );

      return true;
    },
    [sendMessage]
  );

  /**
   * Assign a timestamp the first time we see a message id so the time
   * stays stable across re-renders.
   */
  useEffect(() => {
    setTimestamps((previous) => {
      const next = { ...previous };
      for (const message of messages as MessageLike[]) {
        if (!next[message.id]) {
          next[message.id] = new Date().toISOString();
        }
      }
      return next;
    });
  }, [messages]);

  /**
   * Support ?intent=hungry / ?prefill=... deep links without bringing back
   * the old welcome-screen gating.
   */
  const searchParamsKey = searchParams?.toString() ?? "";

  useEffect(() => {
    if (!searchParamsKey) return;

    const params = new URLSearchParams(searchParamsKey);
    const intentParam = params.get("intent");
    if (
      !hasAppliedIntent &&
      !hasFiredIntentRef.current &&
      intentParam &&
      intentParam in INTENT_PRESETS
    ) {
      hasFiredIntentRef.current = true;
      setHasAppliedIntent(true);
      const preset = INTENT_PRESETS[intentParam as keyof typeof INTENT_PRESETS];
      sendUserMessage(preset);
      return;
    }

    const prefillParam = params.get("prefill");
    if (prefillParam && !hasPrefilledComposer) {
      setHasPrefilledComposer(true);
      setComposerValue(prefillParam);
    }
  }, [searchParamsKey, hasAppliedIntent, hasPrefilledComposer, sendUserMessage]);

  const normalizedMessages = useMemo<ChatMessage[]>(
    () =>
      (messages as MessageLike[]).map((message) => ({
        id: message.id,
        role: message.role,
        display: message.display,
        parts: Array.isArray(message.parts)
          ? message.parts
          : Array.isArray(message.content)
          ? message.content
          : [],
      })),
    [messages]
  );

  const hasUserMessage = normalizedMessages.some(
    (message) => message.role === "user"
  );

  const activeToolStatuses = useMemo(() => {
    const statusMap = new Map<string, string>();

    for (const message of normalizedMessages) {
      for (const part of message.parts ?? []) {
        const type = part?.type;
        const state = typeof part?.state === "string" ? part.state : null;
        if (!type) continue;

        const isDynamicTool = type === "dynamic-tool";
        const normalizedToolName = isDynamicTool
          ? typeof part.toolName === "string"
            ? part.toolName
            : "tool"
          : type.startsWith("tool-")
          ? type.replace("tool-", "")
          : null;

        if (!normalizedToolName) continue;
        if (state === "output-available" || state === "output-error") {
          // Tool already finished; no indicator needed.
          continue;
        }

        const label =
          TOOL_STATUS_LABELS[normalizedToolName] ?? "Working on your request…";
        const key = part.toolCallId ?? `${message.id}-${normalizedToolName}`;
        statusMap.set(key, label);
      }
    }

    return Array.from(statusMap.entries()).map(([id, label]) => ({
      id,
      label,
    }));
  }, [normalizedMessages]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sendUserMessage(composerValue)) {
      setComposerValue("");
    }
  };

  const handlePromptSelect = (value: string) => {
    setComposerValue(value);
    composerRef.current?.focus();
  };

  if (isPending) {
    return <div className="container mx-auto px-4 py-12">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-md">
          <UserProfile />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <ChatHeader
        userName={session.user?.name}
        locationLabel={locationLabel}
        locationStatus={locationStatus}
        onRefreshLocation={refreshLocation}
      />

      <section className="rounded-3xl border border-border bg-background/60 p-4 shadow-sm">
        <MessageList messages={normalizedMessages} timestamps={timestamps} />
        {activeToolStatuses.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {activeToolStatuses.map((status) => (
              <span
                key={status.id}
                className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
              >
                {status.label}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      {!hasUserMessage ? (
        <SuggestedPrompts
          prompts={SUGGESTED_PROMPTS}
          onSelect={handlePromptSelect}
        />
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Something went wrong. Please try again.
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-border bg-card/60 p-4 shadow-sm"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <textarea
            ref={composerRef}
            value={composerValue}
            onChange={(event) => setComposerValue(event.target.value)}
            placeholder={COMPOSER_PLACEHOLDER}
            rows={3}
            className="flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <div className="flex items-center gap-2 sm:flex-col sm:items-end">
            {status === "streaming" ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => stop()}
              >
                Stop
              </Button>
            ) : null}
            <Button
              type="submit"
              disabled={!composerValue.trim() || status === "streaming"}
            >
              Send →
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
