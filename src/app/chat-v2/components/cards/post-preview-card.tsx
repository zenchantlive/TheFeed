"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { getChatStyles } from "../../lib/theme-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Calendar, MessageCircle, Eye, Share2, User, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PostPreviewCardProps {
  post: {
    id: string;
    title: string;
    content: string;
    author: {
      name: string;
      avatar?: string;
    };
    createdAt: string;
    kind: "sharing" | "requesting" | "event" | "announcement" | "resource";
    category?: string;
    location?: string;
    tags?: string[];
    commentCount?: number;
    viewCount?: number;
    imageUrl?: string;
    isUrgent?: boolean;
    isVerified?: boolean;
  };
  className?: string;
  onReadMore?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

/**
 * Enhanced Post Preview Card Component
 * 
 * A theme-aware post preview card that leverages Shadcn UI components
 * with proper post type badges and engagement metrics
 */
export function EnhancedPostPreviewCard({ 
  post, 
  className,
  onReadMore,
  onShare 
}: PostPreviewCardProps) {
  const styles = getChatStyles();
  const [isSharing, setIsSharing] = React.useState(false);

  // Post kind configuration
  const kindConfig = {
    sharing: {
      color: "bg-green-500/10 text-green-700 dark:text-green-400",
      icon: "🎁",
      borderColor: "border-green-500/20"
    },
    requesting: {
      color: "bg-red-500/10 text-red-700 dark:text-red-400",
      icon: "🆘",
      borderColor: "border-red-500/20"
    },
    event: {
      color: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      icon: "📅",
      borderColor: "border-blue-500/20"
    },
    announcement: {
      color: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
      icon: "📢",
      borderColor: "border-orange-500/20"
    },
    resource: {
      color: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
      icon: "📋",
      borderColor: "border-purple-500/20"
    }
  };

  const kind = kindConfig[post.kind];

  const handleShare = async () => {
    setIsSharing(true);
    try {
      onShare?.(post.id);
      
      // Try native sharing API
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.content.substring(0, 200) + "...",
          url: window.location.href + `/post/${post.id}`
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(
          `${post.title}\n${post.content.substring(0, 200)}...\n${window.location.href}/post/${post.id}`
        );
        // Could show a toast notification here
      }
    } catch (error) {
      console.log("Share cancelled or failed:", error);
    } finally {
      setIsSharing(false);
    }
  };

  const formatContent = (content: string) => {
    return content.length > 150 
      ? content.substring(0, 150).trim() + "..."
      : content;
  };

  return (
    <Card 
      className={cn(
        "overflow-hidden",
        "transition-all duration-300 ease-in-out",
        "hover:shadow-lg hover:shadow-primary/20",
        "hover:-translate-y-1",
        "border-l-4",
        kind.borderColor,
        styles.card,
        className
      )}
    >
      {/* Post Header */}
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs font-medium",
                  kind.color
                )}
              >
                <span className="mr-1">{kind.icon}</span>
                {post.kind}
                {post.isUrgent && (
                  <span className="ml-1 animate-pulse">⚡</span>
                )}
              </Badge>
              {post.isVerified && (
                <Badge variant="outline" className="text-xs">
                  ✅ Verified
                </Badge>
              )}
            </div>
            
            <CardTitle className="text-base font-semibold leading-tight">
              {post.title}
            </CardTitle>
          </div>
        </div>

        {/* Author and Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{post.author.name}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Location */}
        {post.location && (
          <div className="text-sm text-muted-foreground">
            📍 {post.location}
          </div>
        )}

        {/* Category */}
        {post.category && (
          <Badge variant="outline" className="text-xs mt-1">
            {post.category}
          </Badge>
        )}
      </CardHeader>

      {/* Post Content */}
      <CardContent className="pb-3">
        <div className="space-y-3">
          {/* Image Preview */}
          {post.imageUrl && (
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <Image
                src={post.imageUrl}
                alt={post.title}
                className="w-full h-full object-cover"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={false}
              />
            </div>
          )}

          {/* Content Text */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {formatContent(post.content)}
          </p>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {post.tags.slice(0, 3).map((tag, index) => (
                <Badge 
                  key={index}
                  variant="outline" 
                  className="text-xs bg-muted/50"
                >
                  #{tag}
                </Badge>
              ))}
              {post.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{post.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {/* Engagement Stats */}
      {(post.commentCount || post.viewCount) && (
        <CardContent className="border-t border-border/50 pt-3 pb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              {post.commentCount && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  <span>{post.commentCount}</span>
                </div>
              )}
              {post.viewCount && (
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>{post.viewCount}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => onReadMore?.(post.id)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Eye className="w-3 h-3 mr-1" />
                Read More
              </Button>
              
              <Button
                onClick={handleShare}
                variant="outline"
                size="icon"
                className="w-8 h-8"
                title="Share post"
                aria-label={`Share ${post.title}`}
              >
                {isSharing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Share2 className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Helper function to format content (moved outside component)
const formatContent = (content: string) => {
  return content.length > 150 
    ? content.substring(0, 150).trim() + "..."
    : content;
};

interface PostPreviewCompactCardProps {
  post: PostPreviewCardProps["post"];
  className?: string;
  onClick?: () => void;
}

export function PostPreviewCompactCard({ 
  post, 
  className,
  onClick 
}: PostPreviewCompactCardProps) {
  const styles = getChatStyles();
  const kind = {
    sharing: { color: "text-green-600", icon: "🎁" },
    requesting: { color: "text-red-600", icon: "🆘" },
    event: { color: "text-blue-600", icon: "📅" },
    announcement: { color: "text-orange-600", icon: "📢" },
    resource: { color: "text-purple-600", icon: "📋" }
  }[post.kind];

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-all duration-200",
        styles.card,
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge 
              variant="secondary" 
              className={cn(
                "text-xs font-medium",
                `bg-${kind.color.split('-')[0]}-500/10`,
                kind.color
              )}
            >
              <span className="mr-1">{kind.icon}</span>
              {post.kind}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </Badge>
          </div>
          
          <h4 className="font-semibold text-sm mb-1 line-clamp-1">
            {post.title}
          </h4>
          
          <p className="text-xs text-muted-foreground line-clamp-2">
            {formatContent(post.content)}
          </p>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>👤 {post.author.name}</span>
            {post.commentCount && (
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {post.commentCount}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
