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

  // Role-specific styling with enhanced responsiveness
  const roleStyles = {
    user: {
      container: "ml-auto",
      bubble: cn(
        "bg-primary text-primary-foreground border border-primary/20",
        "hover:shadow-lg hover:shadow-primary/25",
        "transform transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01]",
        "active:scale-[0.99]"
      ),
      avatar: "order-2",
      content: "text-left"
    },
    assistant: {
      container: "mr-auto",
      bubble: cn(
        "bg-card text-card-foreground border border-border/60",
        "hover:shadow-lg hover:shadow-border/40",
        "transform transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01]",
        "dark:bg-card/95 dark:border-white/10"
      ),
      avatar: "order-1",
      content: "text-left"
    }
  };

  const currentRole = roleStyles[role];
  const bubbleContent = typeof content === "string" ? (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
    </div>
  ) : content;

  return (
    <div
      className={cn(
        "flex gap-2 sm:gap-3 mb-3 sm:mb-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
        role === "user"
          ? "max-w-[85%] sm:max-w-[75%] md:max-w-[65%] lg:max-w-[55%] xl:max-w-[50%] ml-auto"
          : "max-w-[85%] sm:max-w-[75%] md:max-w-[65%] lg:max-w-[55%] xl:max-w-[50%] mr-auto",
        currentRole.container,
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar */}
      {role === "assistant" && (
        <Avatar className={cn(
          "w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 ring-2 ring-transparent transition-all duration-200",
          "hover:ring-primary/20",
          currentRole.avatar
        )}>
          <AvatarImage src={avatar} alt="Assistant" />
          <AvatarFallback className={cn(
            "bg-muted text-muted-foreground text-xs sm:text-sm font-medium"
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
            "rounded-2xl sm:rounded-3xl px-3 py-2.5 sm:px-4 sm:py-3",
            "shadow-sm border",
            "transition-all duration-200 ease-in-out",
            "backdrop-blur-sm",
            isStreaming && "animate-pulse",
            isHovered && "shadow-xl",
            currentRole.bubble
          )}>
            {/* Streaming indicator */}
            {isStreaming && (
            <div className="flex items-center gap-2 mb-2">
              <div className="flex space-x-1">
                <div className={cn(
                  "w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary-foreground/60 rounded-full",
                  "animate-bounce"
                )} style={{ animationDelay: "0ms" }} />
                <div className={cn(
                  "w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary-foreground/60 rounded-full",
                  "animate-bounce"
                )} style={{ animationDelay: "150ms" }} />
                <div className={cn(
                  "w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary-foreground/60 rounded-full",
                  "animate-bounce"
                )} style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-[0.7rem] sm:text-xs opacity-75">Typing...</span>
            </div>
          )}

          <div className={cn(
            "text-sm leading-relaxed",
            currentRole.content
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
                      className="h-7 w-7 hover:bg-muted"
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
            "text-xs text-muted-foreground mt-1 text-center"
          )}>
            {timestamp}
          </div>
        )}
      </div>

      {/* User avatar (if needed) */}
      {role === "user" && (
        <Avatar className={cn(
          "w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 ring-2 ring-transparent transition-all duration-200",
          "hover:ring-primary/30",
          currentRole.avatar
        )}>
          <AvatarImage src={avatar} alt="You" />
          <AvatarFallback className={cn(
            "bg-primary/20 text-primary text-xs sm:text-sm font-medium"
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
