"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { getChatStyles } from "../../lib/theme-utils";
import { ChatWindow, ChatHeader, ChatFooter } from "../ui/chat-window";

interface ChatContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  status?: "online" | "offline" | "connecting";
  footer?: React.ReactNode;
  variant?: "default" | "compact" | "full";
  className?: string;
}

/**
 * Enhanced Chat Container Component
 * 
 * A responsive, theme-aware container that orchestrates the entire chat interface
 * with proper layout, accessibility, and responsive design
 */
export function ChatContainer({ 
  children,
  title = "AI Sous-Chef",
  subtitle = "How can I help you today?",
  status = "online",
  footer,
  variant = "default",
  className,
  ...props 
}: ChatContainerProps) {
  const styles = getChatStyles();

  return (
    <ChatWindow 
      variant={variant} 
      className={cn(
        "min-h-0 flex flex-col rounded-3xl border border-border/60 bg-card/80 backdrop-blur",
        "shadow-[0_20px_45px_rgba(15,23,42,0.12)]",
        styles.container,
        className
      )}
      {...props}
    >
      {/* Header */}
      <ChatHeader 
        title={title}
        subtitle={subtitle}
        status={status}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <ChatFooter>
          {footer}
        </ChatFooter>
      )}
    </ChatWindow>
  );
}

interface ChatMainProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function ChatMain({ children, className, ...props }: ChatMainProps) {
  const styles = getChatStyles();

  return (
    <main 
      className={cn(
        "flex-1 overflow-y-auto",
        "scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
        "scrollbar-thumb-rounded-full",
        styles.container,
        className
      )}
      {...props}
    >
      {children}
    </main>
  );
}

interface ChatSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "messages" | "empty" | "loading";
  className?: string;
}

export function ChatSection({ 
  children, 
  variant = "messages",
  className,
  ...props 
}: ChatSectionProps) {
  const styles = getChatStyles();

  const variantClasses = {
    messages: "p-4",
    empty: "flex items-center justify-center p-8",
    loading: "p-4"
  };

  return (
    <section 
      className={cn(
        "animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
        variantClasses[variant],
        styles.container,
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}
