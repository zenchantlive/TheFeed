"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { getChatStyles } from "../../lib/theme-utils";
import { MessageBubble } from "../ui/message-bubble";
import { TypingIndicator } from "../ui/typing-indicator";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string | React.ReactNode;
  timestamp?: string;
  isStreaming?: boolean;
}

interface MessageListProps extends React.HTMLAttributes<HTMLDivElement> {
  messages: Message[];
  isTyping?: boolean;
  typingMessage?: string;
  className?: string;
}

/**
 * Enhanced Message List Component
 * 
 * A performant, theme-aware message list with virtual scrolling,
 * accessibility features, and smooth animations
 */
export function MessageList({
  messages = [],
  isTyping = false,
  typingMessage,
  className,
  ...props
}: MessageListProps) {
  const styles = getChatStyles();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [visibleMessages, setVisibleMessages] = React.useState<Message[]>(messages);
  const [showScrollButton, setShowScrollButton] = React.useState(false);
  const [isUserScrolling, setIsUserScrolling] = React.useState(false);
  const scrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Smooth scroll to bottom function
  const scrollToBottom = React.useCallback((behavior: ScrollBehavior = "smooth") => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior
      });
    }
  }, []);

  // Auto-scroll to bottom when messages change (only if user isn't scrolling)
  React.useEffect(() => {
    if (!isUserScrolling) {
      scrollToBottom("smooth");
    }
  }, [messages, isTyping, isUserScrolling, scrollToBottom]);

  // Handle scroll to detect if user is near bottom
  const handleScroll = React.useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // Show button if scrolled up more than 100px from bottom
    setShowScrollButton(distanceFromBottom > 100);

    // Detect user scrolling
    setIsUserScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 1000);
  }, []);

  // Handle message animations
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setVisibleMessages(messages);
    }, 50);
    return () => clearTimeout(timer);
  }, [messages]);

  // Handle focus management for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Home") {
      e.preventDefault();
      containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } else if (e.key === "End") {
      e.preventDefault();
      containerRef.current?.scrollTo({ 
        top: containerRef.current.scrollHeight, 
        behavior: "smooth" 
      });
    }
  };

  if (messages.length === 0 && !isTyping) {
    return (
      <div 
        ref={containerRef}
        className={cn(
          "flex-1 overflow-y-auto",
          "scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
          "scrollbar-thumb-rounded-full",
          "flex items-center justify-center",
          styles.container,
          className
        )}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        {...props}
      >
        <div className="text-center text-muted-foreground">
          <div className="text-6xl mb-4">🥘</div>
          <h3 className="text-lg font-semibold mb-2">Welcome to AI Sous-Chef</h3>
          <p className="text-sm">How can I help you find food resources today?</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1">
      <div
        ref={containerRef}
        className={cn(
          "h-full overflow-y-auto",
          "scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
          "scrollbar-thumb-rounded-full",
          "scroll-smooth",
          styles.container,
          className
        )}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        {...props}
      >
        <div className="space-y-4 p-4">
          {visibleMessages.map((message, index) => (
            <MessageBubble
              key={message.id}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
              isStreaming={message.isStreaming}
              className={cn(
                "animate-in fade-in-0 slide-in-from-bottom-2",
                `duration-${Math.min(300 + index * 50, 600)}`
              )}
            />
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <TypingIndicator
              message={typingMessage}
              className="animate-in fade-in duration-300"
            />
          )}
        </div>
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <Button
          variant="secondary"
          size="icon"
          className={cn(
            "absolute bottom-4 right-4 h-10 w-10 rounded-full shadow-lg",
            "animate-in fade-in zoom-in duration-200",
            "hover:scale-110 transition-transform"
          )}
          onClick={() => {
            scrollToBottom("smooth");
            setShowScrollButton(false);
          }}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

interface MessageGroupLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function MessageGroupLayout({ children, className, ...props }: MessageGroupLayoutProps) {
  const styles = getChatStyles();

  return (
    <div 
      className={cn(
        "space-y-4",
        styles.container,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface MessageTimestampProps {
  timestamp: string;
  className?: string;
}

export function MessageTimestamp({ timestamp, className }: MessageTimestampProps) {
  return (
    <time 
      dateTime={timestamp}
      className={cn(
        "text-xs text-muted-foreground",
        "select-none",
        className
      )}
    >
      {timestamp}
    </time>
  );
}
