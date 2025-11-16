"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { getChatStyles } from "../../lib/theme-utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MessageBubbleProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'content'> {
  role: "user" | "assistant";
  content: string | React.ReactNode;
  avatar?: string;
  avatarFallback?: string;
  timestamp?: string;
  isStreaming?: boolean;
  className?: string;
}

/**
 * Enhanced Message Bubble Component
 * 
 * A theme-aware message bubble that adapts to user/assistant roles
 * and maintains consistency with the existing design system
 */
export function MessageBubble({
  role,
  content,
  avatar,
  avatarFallback,
  timestamp,
  isStreaming = false,
  className,
  ...props
}: MessageBubbleProps) {
  const styles = getChatStyles();
  const [copied, setCopied] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const handleCopy = async () => {
    const textContent = typeof content === "string"
      ? content
      : content?.toString() || "";

    await navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Role-specific styling
  const roleStyles = {
    user: {
      container: "ml-auto",
      bubble: cn(
        "bg-primary text-primary-foreground border border-primary/20",
        "hover:shadow-md hover:shadow-primary/20",
        "transform transition-all duration-200 hover:-translate-y-0.5"
      ),
      avatar: "order-2",
      content: "text-right"
    },
    assistant: {
      container: "mr-auto",
      bubble: cn(
        "bg-card text-card-foreground border border-border",
        "hover:shadow-md hover:shadow-border/30",
        "transform transition-all duration-200 hover:-translate-y-0.5"
      ),
      avatar: "order-1",
      content: "text-left"
    }
  };

  const currentRole = roleStyles[role];
  const bubbleContent = typeof content === "string" ? (
    <div className="prose prose-sm max-w-none">
      <p className="whitespace-pre-wrap">{content}</p>
    </div>
  ) : content;

  return (
    <div
      className={cn(
        "flex gap-2 sm:gap-3 max-w-[95%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[65%] mb-3 sm:mb-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
        currentRole.container,
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar */}
      {role === "assistant" && (
        <Avatar className={cn(
          "w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0",
          currentRole.avatar
        )}>
          <AvatarImage src={avatar} alt="Assistant" />
          <AvatarFallback className={cn(
            "bg-primary/20 text-primary",
            role === "assistant" && "bg-muted text-muted-foreground"
          )}>
            {avatarFallback || "AI"}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message Bubble */}
      <div className={cn(
        "flex-1 group",
        currentRole.container
      )}>
        <div className="relative">
          <div className={cn(
            "rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3",
            "shadow-sm border",
            "transition-all duration-200 ease-in-out",
            "backdrop-blur-sm",
            isStreaming && "animate-pulse",
            isHovered && "shadow-md",
            currentRole.bubble
          )}>
            {/* Streaming indicator */}
            {isStreaming && (
            <div className="flex items-center gap-2 mb-2">
              <div className="flex space-x-1">
                <div className={cn(
                  "w-2 h-2 bg-primary-foreground/60 rounded-full",
                  "animate-bounce"
                )} style={{ animationDelay: "0ms" }} />
                <div className={cn(
                  "w-2 h-2 bg-primary-foreground/60 rounded-full", 
                  "animate-bounce"
                )} style={{ animationDelay: "150ms" }} />
                <div className={cn(
                  "w-2 h-2 bg-primary-foreground/60 rounded-full",
                  "animate-bounce"
                )} style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-xs opacity-75">Typing...</span>
            </div>
          )}
          
          <div className={cn(
            "text-sm leading-relaxed",
            role === "user" ? "text-right" : "text-left"
          )}>
            {bubbleContent}
          </div>
        </div>

          {/* Message Actions - only show for assistant messages */}
          {role === "assistant" && !isStreaming && (
            <div className={cn(
              "absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            )}>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 sm:h-7 sm:w-7 hover:bg-muted touch-manipulation"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">{copied ? "Copied!" : "Copy message"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>

        {/* Timestamp */}
        {timestamp && (
          <div className={cn(
            "text-xs text-muted-foreground mt-1",
            role === "user" ? "text-right" : "text-left"
          )}>
            {timestamp}
          </div>
        )}
      </div>

      {/* User avatar (if needed) */}
      {role === "user" && (
        <Avatar className={cn(
          "w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0",
          currentRole.avatar
        )}>
          <AvatarImage src={avatar} alt="You" />
          <AvatarFallback className={cn(
            "bg-primary/20 text-primary"
          )}>
            {avatarFallback || "You"}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

interface MessageGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function MessageGroup({ children, className, ...props }: MessageGroupProps) {
  const styles = getChatStyles();

  return (
    <div 
      className={cn(
        "flex flex-col gap-4 p-4",
        styles.container,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
