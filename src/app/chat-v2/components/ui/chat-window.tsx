"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { getChatStyles } from "../../lib/theme-utils";

interface ChatWindowProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "compact" | "full";
  className?: string;
}

/**
 * Enhanced Chat Window Component
 * 
 * A theme-aware container for the chat interface that leverages
 * existing CSS custom properties and Shadcn UI patterns
 */
export function ChatWindow({ 
  children, 
  variant = "default",
  className,
  ...props 
}: ChatWindowProps) {
  const styles = getChatStyles();

  const baseClasses = cn(
    "flex flex-col h-full w-full",
    styles.container,
    className
  );

  const variantClasses = {
    default: "max-w-2xl mx-auto",
    compact: "max-w-md mx-auto",
    full: "w-full"
  };

  return (
    <div 
      className={cn(baseClasses, variantClasses[variant])}
      {...props}
    >
      {children}
    </div>
  );
}

interface ChatHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  status?: "online" | "offline" | "connecting";
  actions?: React.ReactNode;
}

export function ChatHeader({ 
  title = "AI Sous-Chef", 
  subtitle = "How can I help you today?",
  status = "online",
  actions,
  className,
  ...props 
}: ChatHeaderProps) {
  const styles = getChatStyles();

  const statusStyles = {
    online: "bg-green-500/20 text-green-700 dark:text-green-400",
    offline: "bg-red-500/20 text-red-700 dark:text-red-400", 
    connecting: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
  };

  return (
    <div
      className={cn(
        "px-4 py-3 border-b border-border/50 bg-card/50 backdrop-blur-sm",
        styles.container,
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-foreground truncate">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground truncate">
            {subtitle}
          </p>
        </div>
        
        <div className="flex items-center gap-2 ml-3">
          {status && (
            <div className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium",
              statusStyles[status]
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full",
                status === "online" && "bg-green-500",
                status === "offline" && "bg-red-500",
                status === "connecting" && "bg-yellow-500"
              )} />
              {status}
            </div>
          )}
          {actions}
        </div>
      </div>
    </div>
  );
}

interface ChatFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function ChatFooter({ children, className, ...props }: ChatFooterProps) {
  const styles = getChatStyles();

  return (
    <div 
      className={cn(
        "border-t border-border/50 bg-card/50 backdrop-blur-sm",
        styles.container,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
