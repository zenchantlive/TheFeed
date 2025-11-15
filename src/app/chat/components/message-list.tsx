import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { cn } from "@/lib/utils";

export type MessagePart = {
  type?: string;
  text?: string;
  state?: string;
  toolCallId?: string;
  toolName?: string;
  [key: string]: unknown;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  parts?: MessagePart[];
  content?: MessagePart[];
  display?: ReactNode;
};

type MessageListProps = {
  messages: ChatMessage[];
  timestamps: Record<string, string>;
};

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

function formatTimestamp(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function getRenderableParts(message: ChatMessage): MessagePart[] {
  if (Array.isArray(message.parts)) return message.parts;
  if (Array.isArray(message.content)) return message.content;
  return [];
}

function renderMessageContent(message: ChatMessage): ReactNode {
  if (message.display) return message.display;
  const parts = getRenderableParts(message);
  return parts.map((part, index) =>
    part?.type === "text" && typeof part.text === "string" ? (
      <ReactMarkdown key={`${message.id}-${index}`} components={markdownComponents}>
        {part.text}
      </ReactMarkdown>
    ) : null
  );
}

export function MessageList({ messages, timestamps }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 px-6 py-12 text-center">
        <p className="text-base font-medium text-foreground">Hi neighbor, I&apos;m ready when you are.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Ask for nearby food banks, community posts, or events. I can also suggest ways to share or volunteer.
        </p>
      </div>
    );
  }

  return (
    <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-2">
      {messages.map((message) => {
        const timestamp = formatTimestamp(timestamps[message.id]);
        const isUser = message.role === "user";
        const label =
          message.role === "user"
            ? "You"
            : message.role === "assistant"
            ? "Sous-Chef"
            : "System";

        return (
          <div
            key={message.id}
            className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
          >
            <article
              className={cn(
                "max-w-[80%] rounded-2xl border px-4 py-3 text-sm shadow-sm",
                isUser
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground"
              )}
            >
              <div
                className={cn(
                  "mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide",
                  isUser ? "text-primary-foreground/80" : "text-muted-foreground/80"
                )}
              >
                <span>{label}</span>
                {timestamp ? <span>{timestamp}</span> : null}
              </div>
              <div className="space-y-3">{renderMessageContent(message)}</div>
            </article>
          </div>
        );
      })}
    </div>
  );
}
