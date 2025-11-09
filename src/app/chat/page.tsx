"use client";

import { useChat } from "@ai-sdk/react";
import { useSession } from "@/lib/auth-client";
import { UserProfile } from "@/components/auth/user-profile";
import { BigActionButton } from "@/components/foodshare/big-action-button";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import {
  UtensilsCrossed,
  HeartHandshake,
  MapPin,
  Clock,
  Navigation2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const markdownComponents: Components = {
  h1: (props) => <h1 className="mt-2 mb-3 text-2xl font-bold" {...props} />,
  h2: (props) => <h2 className="mt-2 mb-2 text-xl font-semibold" {...props} />,
  h3: (props) => <h3 className="mt-2 mb-2 text-lg font-semibold" {...props} />,
  p: (props) => <p className="mb-3 leading-7 text-sm" {...props} />,
  ul: (props) => (
    <ul className="mb-3 ml-5 list-disc space-y-1 text-sm" {...props} />
  ),
  ol: (props) => (
    <ol className="mb-3 ml-5 list-decimal space-y-1 text-sm" {...props} />
  ),
  li: (props) => <li className="leading-6" {...props} />,
  a: (props) => (
    <a
      className="underline underline-offset-2 text-primary hover:opacity-90"
      target="_blank"
      rel="noreferrer noopener"
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote
      className="mb-3 border-l-2 border-border pl-3 text-muted-foreground"
      {...props}
    />
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
  hr: (props) => <hr className="my-4 border-border" {...props} />,
  table: (props) => (
    <div className="mb-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: (props) => (
    <th
      className="border border-border bg-muted px-2 py-1 text-left"
      {...props}
    />
  ),
  td: (props) => (
    <td className="border border-border px-2 py-1" {...props} />
  ),
};

type TextPart = { type?: string; text?: string };
type MaybePartsMessage = {
  display?: ReactNode;
  parts?: TextPart[];
  content?: TextPart[];
  role: "user" | "assistant" | "system";
  id: string;
};

type QuickAction =
  | { type: "message"; label: string; message: string }
  | { type: "navigate"; label: string; href: string };

const QUICK_ACTIONS: QuickAction[] = [
  {
    type: "message",
    label: "I'm starving, help!",
    message:
      "I'm hungry. Give me the top three nearby food spots that are actually open right now.",
  },
  {
    type: "message",
    label: "Have leftovers to share",
    message:
      "I've got extra food to share. Suggest the best way to post it in the community and highlight any nearby spots that need it.",
  },
  {
    type: "navigate",
    label: "Peek at neighbor posts",
    href: "/community",
  },
  {
    type: "navigate",
    label: "Open the food map",
    href: "/map",
  },
];

const INTENT_PRESETS = {
  hungry:
    "Hey Sous-Chef, I'm hungry. Find the closest warm meals or pantries open within the next hour and tell me what to bring.",
  full:
    "Hey Sous-Chef, I'm full. Help me share my leftovers or volunteer nearby so nothing goes to waste.",
};

function renderMessageContent(message: MaybePartsMessage): ReactNode {
  if (message.display) return message.display;
  const parts = Array.isArray(message.parts)
    ? message.parts
    : Array.isArray(message.content)
    ? message.content
    : [];
  return parts.map((p, idx) =>
    p?.type === "text" && p.text ? (
      <ReactMarkdown key={idx} components={markdownComponents}>
        {p.text}
      </ReactMarkdown>
    ) : null
  );
}

export default function ChatPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { messages, sendMessage, status, error, stop } = useChat();
  const [composerValue, setComposerValue] = useState("");
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(true);
  const [hasAppliedIntent, setHasAppliedIntent] = useState(false);
  const [hasPrefilledComposer, setHasPrefilledComposer] = useState(false);

  useEffect(() => {
    if (messages.length > 0) {
      setIsWelcomeVisible(false);
    }
  }, [messages.length]);

  // Handle URL parameters with clear priority: intent first, then prefill
  useEffect(() => {
    if (!searchParams) return;

    const intentParam = searchParams.get("intent");
    if (
      !hasAppliedIntent &&
      intentParam &&
      intentParam in INTENT_PRESETS
    ) {
      setHasAppliedIntent(true);
      setIsWelcomeVisible(false);
      void sendMessage({
        role: "user",
        parts: [
          {
            type: "text",
            text: INTENT_PRESETS[intentParam as keyof typeof INTENT_PRESETS],
          },
        ],
      });
      return; // Prioritize intent over prefill
    }

    const prefillParam = searchParams.get("prefill");
    if (prefillParam && !hasPrefilledComposer) {
      setComposerValue(prefillParam);
      setHasPrefilledComposer(true);
      setIsWelcomeVisible(false);
    }
  }, [searchParams, hasAppliedIntent, hasPrefilledComposer, sendMessage]);

  const lastAssistantMessage = useMemo(
    () =>
      [...messages].reverse().find((message) => message.role === "assistant"),
    [messages]
  );

  const shouldShowQuickActions = Boolean(
    lastAssistantMessage && status !== "streaming"
  );

  if (isPending) {
    return <div className="container mx-auto px-4 py-12">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <UserProfile />
        </div>
      </div>
    );
  }

  const handleIntent = (intent: keyof typeof INTENT_PRESETS) => {
    setIsWelcomeVisible(false);
    void sendMessage({
      role: "user",
      parts: [{ type: "text", text: INTENT_PRESETS[intent] }],
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = composerValue.trim();
    if (!text) return;
    setIsWelcomeVisible(false);
    void sendMessage({ role: "user", parts: [{ type: "text", text }] });
    setComposerValue("");
  };

  const handleQuickAction = (action: QuickAction) => {
    if (action.type === "message") {
      void sendMessage({
        role: "user",
        parts: [{ type: "text", text: action.message }],
      });
      return;
    }
    router.push(action.href);
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="rounded-3xl bg-gradient-to-r from-primary-start to-primary-end p-6 text-primary-foreground shadow-lg">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
            TheFeed Sous-chef
          </p>
          <h1 className="text-3xl font-bold leading-tight">
            What&apos;s cooking, neighbor?
          </h1>
          <p className="text-sm text-white/80">
            Ask anything about grabbing a bite, sharing leftovers, or
            volunteering. We&apos;ll stir in directions, hours, and suggestions
            from across TheFeed.
          </p>
        </div>
      </header>

      {isWelcomeVisible ? (
        <section className="space-y-6">
          <div className="grid gap-4">
            <BigActionButton
              variant="hungry"
              title="I&apos;m hungry"
              description="Find a hot meal or pantry run before the stomach grumbles louder than the neighbors."
              icon={<UtensilsCrossed className="h-6 w-6" />}
              onClick={() => handleIntent("hungry")}
            />
            <BigActionButton
              variant="full"
              title="I&apos;m full"
              description="Share leftovers, volunteer, or boost someone else&apos;s dinner plans."
              icon={<HeartHandshake className="h-6 w-6" />}
              onClick={() => handleIntent("full")}
            />
          </div>

          <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5">
            <p className="text-sm text-muted-foreground">
              TheFeed keeps the AI sous-chef, community potluck, and map all in
              one tray. Ask freely—your chats stay private, and we&apos;ll send you
              to the right tab when it helps.
            </p>
          </div>
        </section>
      ) : (
        <section className="flex min-h-[50vh] flex-col gap-4">
          <div className="flex-1 space-y-4 overflow-y-auto rounded-3xl border border-border/60 bg-card/90 p-4 shadow-sm">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Start a conversation to see recommendations.
              </div>
            ) : (
              messages.map((message) => (
                <article
                  key={message.id}
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow",
                    message.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-70">
                    {message.role === "user" ? "You" : "TheFeed Sous-chef"}
                  </div>
                  <div>{renderMessageContent(message as MaybePartsMessage)}</div>
                </article>
              ))
            )}
          </div>

          {shouldShowQuickActions ? (
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => {
                const Icon =
                  action.type === "navigate"
                    ? MapPin
                    : action.message.includes("open")
                    ? Clock
                    : Navigation2;
                return (
                  <Button
                    key={action.label}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-2 rounded-full px-4"
                    onClick={() => handleQuickAction(action)}
                  >
                    <Icon className="h-4 w-4" />
                    {action.label}
                  </Button>
                );
              })}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Uh oh, the sous-chef spilled the soup. Please try again.
            </div>
          ) : null}

          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 rounded-2xl border border-border bg-card px-3 py-2"
          >
            <textarea
              value={composerValue}
              onChange={(event) => setComposerValue(event.target.value)}
              placeholder="Tell the sous-chef what you\'re craving or sharing..."
              rows={2}
              className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0"
            />
            <div className="flex items-center gap-2">
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
                Send
              </Button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
