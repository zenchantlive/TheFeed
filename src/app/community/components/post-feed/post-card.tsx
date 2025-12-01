"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { HeartHandshake, MessageCircle, MapPin, Clock, Sparkles } from "lucide-react";
import type { FeedPost } from "../../types";
import { ROLE_BADGE, STATUS_BADGE } from "../../types";

type PostCardProps = {
  post: FeedPost;
};

/**
 * Post Card
 *
 * Clean, simple card for individual posts.
 * Original styling restored (no bulletin board aesthetic).
 */
export function PostCard({ post }: PostCardProps) {
  const askSousChefHref = `/chat?prefill=${encodeURIComponent(
    `Help me respond to ${post.author}'s post in the community potluck.`
  )}`;

  return (
    <article
      className="rounded-3xl border border-border/60 bg-card/95 p-4 shadow-[0_1px_0_rgba(15,23,42,0.04)] transition-all hover:border-border hover:shadow-md"
    >
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-base font-semibold text-primary">
            {post.author.slice(0, 1)}
          </div>

          {/* Author info */}
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{post.author}</p>
              <Badge className={cn("rounded-full px-2.5 text-[0.65rem]", ROLE_BADGE[post.role].tone)}>
                {ROLE_BADGE[post.role].label}
              </Badge>
              <span className="text-xs text-muted-foreground">{post.distance}</span>
              <span className="text-xs text-muted-foreground">• {post.timeAgo}</span>
            </div>

            {/* Body */}
            <p className="mt-2 text-sm text-muted-foreground">{post.body}</p>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="rounded-full border-primary/20 bg-primary/5 text-primary"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Meta info */}
        {post.meta && (post.meta.location || post.meta.status || post.meta.until) && (
          <div className="flex flex-col items-end gap-2 text-right text-xs text-muted-foreground">
            {post.meta.status && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase",
                  STATUS_BADGE[post.meta.status].tone
                )}
              >
                {post.meta.status === "verified" ? "✓" : post.meta.status === "needs-love" ? "!" : "•"}
                {STATUS_BADGE[post.meta.status].label}
              </span>
            )}
            {post.meta.location && (
              <span className="flex items-center gap-1 text-xs">
                <MapPin className="h-3 w-3" />
                {post.meta.location}
              </span>
            )}
            {post.meta.until && (
              <span className="flex items-center gap-1 text-xs">
                <Clock className="h-3 w-3" />
                {post.meta.until}
              </span>
            )}
          </div>
        )}
      </header>

      {/* Actions */}
      <footer className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" className="rounded-full">
          <HeartHandshake className="mr-1.5 h-4 w-4" />
          I&apos;m on it
        </Button>
        <Button variant="ghost" size="sm" className="rounded-full">
          <MessageCircle className="mr-1.5 h-4 w-4" />
          Add a comment
        </Button>
        {post.locationCoords && (
          <Button asChild variant="ghost" size="sm" className="rounded-full">
            <Link href={`/map?postId=${post.id}`}>
              <MapPin className="mr-1.5 h-4 w-4" />
              View on map
            </Link>
          </Button>
        )}
        <Button asChild variant="ghost" size="sm" className="rounded-full">
          <Link href={askSousChefHref}>Ask sous-chef</Link>
        </Button>
      </footer>

      {/* Replies */}
      {post.replies && post.replies.length > 0 && (
        <div className="mt-4 space-y-3 rounded-2xl bg-muted/40 p-4">
          {post.replies.map((reply) => (
            <div key={reply.id} className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{reply.author}</span>
                <span>• {reply.role === "guide" ? "Guide" : "Neighbor"}</span>
                <span>• {reply.timeAgo}</span>
                {typeof reply.helpful === "number" && (
                  <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] text-primary">
                    <Sparkles className="h-3 w-3" />
                    {reply.helpful} found this helpful
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{reply.body}</p>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
