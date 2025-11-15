"use client";

import { MessageCircle, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PostPreviewProps {
  post: {
    id: string;
    content: string;
    kind: string;
    distanceMiles: number | null;
    location?: string | null;
    createdAt: string;
  };
}

export function PostPreview({ post }: PostPreviewProps) {
  const kindStyles: Record<string, { bg: string; text: string; label: string; icon: string }> = {
    share: {
      bg: "bg-orange-500/10",
      text: "text-orange-700 dark:text-orange-400",
      label: "Sharing",
      icon: "🍽️",
    },
    request: {
      bg: "bg-blue-500/10",
      text: "text-blue-700 dark:text-blue-400",
      label: "Requesting",
      icon: "🙏",
    },
    event: {
      bg: "bg-purple-500/10",
      text: "text-purple-700 dark:text-purple-400",
      label: "Event",
      icon: "📅",
    },
  };

  const style = kindStyles[post.kind] || {
    bg: "bg-muted/50",
    text: "text-muted-foreground",
    label: post.kind,
    icon: "💬",
  };

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
  });

  const handleViewPost = () => {
    window.open(`/community?post=${post.id}`, "_blank");
  };

  return (
    <div className="my-3 rounded-xl border border-border/40 bg-card shadow-sm overflow-hidden max-w-md">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${style.bg} ${style.text}`}
            >
              <span>{style.icon}</span>
              {style.label}
            </span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          {post.distanceMiles !== null && (
            <div className="flex-shrink-0 text-sm font-medium text-primary">
              {post.distanceMiles} mi
            </div>
          )}
        </div>

        {/* Content */}
        <p className="text-sm text-foreground mb-3 line-clamp-3 leading-relaxed">
          {post.content}
        </p>

        {/* Location */}
        {post.location && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{post.location}</span>
          </div>
        )}

        {/* Action */}
        <button
          onClick={handleViewPost}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/40 text-sm font-medium text-foreground transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          View full post
        </button>
      </div>
    </div>
  );
}
