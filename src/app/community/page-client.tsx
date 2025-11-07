"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  HeartHandshake,
  MapPin,
  Sparkles,
  Clock,
  Info,
  SendHorizonal,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type FeedPost = {
  id: string;
  authorName: string;
  mood: "hungry" | "full" | "update";
  kind: "share" | "request" | "update" | "resource";
  body: string;
  location?: string | null;
  availableUntil?: string | null;
  tags?: string[] | null;
  status?: string | null;
  isDemo?: boolean;
  createdAt: Date | string;
  comments?: Array<{
    id: string;
    authorName: string;
    body: string;
    createdAt: Date | string;
    helpfulCount?: number;
  }>;
  reactions?: {
    onIt: number;
  };
};

type FeedFilter = "all" | "shares" | "requests" | "updates";

const FILTERS: Array<{ value: FeedFilter; label: string }> = [
  { value: "all", label: "Everything" },
  { value: "shares", label: "Food to share" },
  { value: "requests", label: "Looking for food" },
  { value: "updates", label: "Community updates" },
];

const kindToFilter: Record<FeedPost["kind"], FeedFilter> = {
  share: "shares",
  request: "requests",
  update: "updates",
  resource: "updates",
};

export function CommunityPageClient() {
  const router = useRouter();
  const { data: session } = useSession();
  const [mood, setMood] = useState<"hungry" | "full">("hungry");
  const [composerValue, setComposerValue] = useState("");
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [newCommentValues, setNewCommentValues] = useState<Record<string, string>>({});
  const [showComposer, setShowComposer] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Fetch posts on mount and filter change
  useEffect(() => {
    async function fetchPosts() {
      setIsLoading(true);
      try {
        const includeDemo = isFirstLoad; // Include demo on first load only
        const response = await fetch(
          `/api/community/posts?filter=${filter}&includeDemo=${includeDemo}`
        );
        if (response.ok) {
          const data = await response.json();
          setPosts(data.posts);
          if (isFirstLoad) {
            setIsFirstLoad(false);
          }
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPosts();
  }, [filter, isFirstLoad]);

  const visiblePosts = useMemo(() => {
    if (filter === "all") return posts;
    return posts.filter((post) => kindToFilter[post.kind] === filter);
  }, [posts, filter]);

  const handleCreatePost = async () => {
    if (!session?.user) {
      router.push("/");
      return;
    }

    if (!composerValue.trim()) return;

    setIsPosting(true);
    try {
      const response = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood,
          kind: mood === "hungry" ? "request" : "share",
          body: composerValue.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPosts([data.post, ...posts]);
        setComposerValue("");
        setShowComposer(false);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create post");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post");
    } finally {
      setIsPosting(false);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!session?.user) {
      router.push("/");
      return;
    }

    const commentBody = newCommentValues[postId]?.trim();
    if (!commentBody) return;

    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentBody }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the post with the new comment
        setPosts(
          posts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  comments: [
                    ...(post.comments || []),
                    {
                      id: data.comment.id,
                      authorName: data.comment.authorName,
                      body: data.comment.body,
                      createdAt: data.comment.createdAt,
                      helpfulCount: 0,
                    },
                  ],
                }
              : post
          )
        );
        setNewCommentValues({ ...newCommentValues, [postId]: "" });
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleReaction = async (postId: string, type: "on-it" | "helpful") => {
    if (!session?.user) {
      router.push("/");
      return;
    }

    try {
      const response = await fetch(`/api/community/posts/${postId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        const data = await response.json();
        const delta = data.action === "added" ? 1 : -1;

        setPosts(
          posts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  reactions: {
                    onIt: (post.reactions?.onIt || 0) + delta,
                  },
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error("Error toggling reaction:", error);
    }
  };

  const getTimeAgo = (date: Date | string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hr ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-28 pt-6 md:pb-24 md:pt-10">
      {/* Simplified Header */}
      <section className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Community Food Share
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Share food, request help, and connect with neighbors within 2 miles.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0 rounded-full">
            <Link href="/map">
              <MapPin className="mr-2 h-4 w-4" />
              Map
            </Link>
          </Button>
        </div>

        {/* Info Banner */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
          <div className="flex gap-3">
            <Info className="h-5 w-5 shrink-0 text-primary" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">
                {posts.some((p) => p.isDemo)
                  ? "Demo mode with example posts"
                  : "How this works"}
              </p>
              <p className="text-muted-foreground">
                {posts.some((p) => p.isDemo)
                  ? "These are example posts for testing. Sign in to post your own food shares and requests!"
                  : "Post what you can share or what you need. Your neighbors and our community guides will see it instantly."}
              </p>
            </div>
          </div>
        </div>

        {/* Simplified Composer - Only show if signed in */}
        {session?.user ? (
          showComposer ? (
            <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMood("hungry")}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold transition-all",
                      mood === "hungry"
                        ? "bg-gradient-to-r from-hungry-start to-hungry-end text-white shadow-lg"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                  >
                    Looking for food
                  </button>
                  <button
                    type="button"
                    onClick={() => setMood("full")}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold transition-all",
                      mood === "full"
                        ? "bg-gradient-to-r from-full-start to-full-end text-white shadow-lg"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                  >
                    Sharing food
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={composerValue}
                  onChange={(e) => setComposerValue(e.target.value)}
                  placeholder={
                    mood === "hungry"
                      ? "What are you looking for? (e.g., 'Need groceries for family of 4 tonight')"
                      : "What are you sharing? (e.g., 'Extra curry and rice for 2, pickup by 8pm')"
                  }
                  className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowComposer(false);
                      setComposerValue("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreatePost}
                    disabled={!composerValue.trim() || isPosting}
                    className="rounded-full"
                  >
                    {isPosting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <SendHorizonal className="mr-2 h-4 w-4" />
                        Post
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setShowComposer(true)}
              className="w-full rounded-full bg-gradient-to-r from-primary-start to-primary-end py-6 text-lg font-semibold shadow-lg"
            >
              <SendHorizonal className="mr-2 h-5 w-5" />
              Share or Request Food
            </Button>
          )
        ) : (
          <div className="rounded-3xl border border-dashed border-border/60 bg-muted/30 p-6 text-center">
            <p className="mb-3 text-sm text-muted-foreground">
              Sign in to share food or request help from your community
            </p>
            <Button asChild className="rounded-full">
              <Link href="/">Sign In</Link>
            </Button>
          </div>
        )}
      </section>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filterOption) => (
          <Button
            key={filterOption.value}
            type="button"
            variant={filter === filterOption.value ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setFilter(filterOption.value)}
          >
            {filterOption.label}
          </Button>
        ))}
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : visiblePosts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/60 bg-muted/30 p-12 text-center">
            <p className="text-muted-foreground">
              No posts yet. Be the first to share or request food!
            </p>
          </div>
        ) : (
          visiblePosts.map((post) => (
            <article
              key={post.id}
              className={cn(
                "rounded-3xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:shadow-md",
                post.isDemo && "border-amber-200/50 bg-amber-50/30 dark:border-amber-400/20 dark:bg-amber-400/5"
              )}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                      {post.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{post.authorName}</p>
                        {post.isDemo && (
                          <Badge variant="outline" className="rounded-full text-[0.65rem]">
                            Demo
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {getTimeAgo(post.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      "rounded-full",
                      post.kind === "share"
                        ? "bg-full-start/15 text-full-end"
                        : post.kind === "request"
                          ? "bg-hungry-start/15 text-hungry-end"
                          : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {post.kind === "share" ? "Sharing" : post.kind === "request" ? "Requesting" : "Update"}
                  </Badge>
                </div>

                {/* Body */}
                <p className="text-foreground">{post.body}</p>

                {/* Meta */}
                {(post.location || post.availableUntil || post.tags) && (
                  <div className="space-y-2">
                    {post.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {post.location}
                      </div>
                    )}
                    {post.availableUntil && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {post.availableUntil}
                      </div>
                    )}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="rounded-full">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-full"
                    onClick={() => handleReaction(post.id, "on-it")}
                    disabled={!session?.user || post.isDemo}
                  >
                    <HeartHandshake className="mr-1.5 h-4 w-4" />
                    I&apos;m on it
                    {post.reactions && post.reactions.onIt > 0 && (
                      <span className="ml-1.5">({post.reactions.onIt})</span>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                    onClick={() => {
                      const input = document.getElementById(`comment-${post.id}`) as HTMLInputElement;
                      input?.focus();
                    }}
                  >
                    <MessageCircle className="mr-1.5 h-4 w-4" />
                    Comment
                    {post.comments && post.comments.length > 0 && (
                      <span className="ml-1.5">({post.comments.length})</span>
                    )}
                  </Button>
                </div>

                {/* Comments */}
                {post.comments && post.comments.length > 0 && (
                  <div className="space-y-3 rounded-2xl bg-muted/40 p-4">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{comment.authorName}</span>
                          <span className="text-xs text-muted-foreground">
                            {getTimeAgo(comment.createdAt)}
                          </span>
                          {comment.helpfulCount && comment.helpfulCount > 0 ? (
                            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] text-primary">
                              <Sparkles className="h-3 w-3" />
                              {comment.helpfulCount} helpful
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm text-muted-foreground">{comment.body}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment */}
                {session?.user && !post.isDemo && (
                  <div className="flex gap-2">
                    <input
                      id={`comment-${post.id}`}
                      type="text"
                      placeholder="Add a comment..."
                      value={newCommentValues[post.id] || ""}
                      onChange={(e) =>
                        setNewCommentValues({
                          ...newCommentValues,
                          [post.id]: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment(post.id);
                        }
                      }}
                      className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddComment(post.id)}
                      disabled={!newCommentValues[post.id]?.trim()}
                      className="rounded-full"
                    >
                      Send
                    </Button>
                  </div>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
