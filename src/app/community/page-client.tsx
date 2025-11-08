"use client";

import { useMemo, useState, type ComponentProps } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MessageCircle,
  HeartHandshake,
  MapPin,
  Sparkles,
  Clock,
  Navigation2,
  ArrowRight,
  ChefHat,
  CalendarPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type FeedPost = {
  id: string;
  author: string;
  role: "neighbor" | "guide" | "community";
  mood: "hungry" | "full" | "update";
  kind: "share" | "request" | "update" | "resource";
  distance: string;
  timeAgo: string;
  body: string;
  meta?: {
    location?: string;
    until?: string;
    status?: "verified" | "community" | "needs-love";
  };
  tags?: string[];
  replies?: Array<{
    id: string;
    author: string;
    role: "neighbor" | "guide";
    body: string;
    timeAgo: string;
    helpful?: number;
  }>;
};

export type HotItem = {
  id: string;
  title: string;
  host: string;
  until: string;
  distance: string;
};

export type GuideMoment = {
  id: string;
  guide: string;
  tip: string;
  linkLabel: string;
  href: string;
};

export type VibeStat = {
  id: string;
  label: string;
  value: string;
  description?: string;
};

export type CommunityPageClientProps = {
  posts: FeedPost[];
  prompts: string[];
  hotItems: HotItem[];
  guideMoments: GuideMoment[];
  vibeStats: VibeStat[];
};

type FeedFilter = "all" | "shares" | "requests" | "updates";

const FILTERS: Array<{ value: FeedFilter; label: string }> = [
  { value: "all", label: "Everything" },
  { value: "shares", label: "People sharing" },
  { value: "requests", label: "I\'m hungry" },
  { value: "updates", label: "Guides & spots" },
];

const ROLE_BADGE: Record<FeedPost["role"], { label: string; tone: string }> = {
  neighbor: { label: "Neighbor", tone: "bg-primary/10 text-primary" },
  guide: { label: "Guide", tone: "bg-full-start/15 text-full-end" },
  community: { label: "Community added", tone: "bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200" },
};

type StatusKey = Exclude<NonNullable<FeedPost["meta"]>["status"], undefined>;

const STATUS_BADGE: Record<StatusKey, { label: string; tone: string }> = {
  verified: { label: "Verified", tone: "bg-status-open text-status-open-text" },
  community: { label: "Awaiting neighbors", tone: "bg-secondary text-secondary-foreground" },
  "needs-love": { label: "Needs love", tone: "bg-destructive/10 text-destructive" },
};

const kindToFilter: Record<FeedPost["kind"], FeedFilter> = {
  share: "shares",
  request: "requests",
  update: "updates",
  resource: "updates",
};

export function CommunityPageClient({
  posts,
  prompts,
  hotItems,
  guideMoments,
  vibeStats,
}: CommunityPageClientProps) {
  const router = useRouter();
  const [mood, setMood] = useState<"hungry" | "full">("hungry");
  const [composerValue, setComposerValue] = useState("");
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [isPosting, setIsPosting] = useState(false);

  const visiblePosts = useMemo(() => {
    if (filter === "all") return posts;
    return posts.filter((post) => kindToFilter[post.kind] === filter);
  }, [posts, filter]);

  const aiPrompt =
    mood === "hungry"
      ? "I\'m hungry and need quick help finding nearby food tonight."
      : "I\'m full and want to share leftovers or volunteer this evening.";

  const handlePromptClick = (prompt: string) => {
    setComposerValue((prev) => (prev.length > 0 ? `${prev}\n${prompt}` : prompt));
  };

  const handlePost = async () => {
    if (composerValue.trim().length === 0) return;

    setIsPosting(true);
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: composerValue.trim(),
          mood,
          kind: mood === "hungry" ? "request" : "share",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create post");
      }

      // Clear the composer
      setComposerValue("");

      // Refresh the page to show new post
      router.refresh();
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-28 pt-6 md:pb-24 md:pt-10">
      <section className="rounded-3xl border border-border/60 bg-card/95 p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Midtown Sacramento • 2 mile radius
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                The community potluck is buzzing
              </h1>
              <p className="text-sm text-muted-foreground md:text-base">
                8 neighbors are active right now. Post what you need or what you can share and everyone within 2 miles will see it instantly.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" className="rounded-full px-5">
              <Link href="/community/events/new">
                <CalendarPlus className="mr-2 h-4 w-4" />
                Host Event
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-5">
              <Link href="/map">
                <MapPin className="mr-2 h-4 w-4" />
                Open food map
              </Link>
            </Button>
            <Button
              asChild
              className="rounded-full bg-gradient-to-r from-primary-start to-primary-end px-5 text-primary-foreground shadow"
            >
              <Link href={`/chat?intent=${mood}`}>
                <ChefHat className="mr-2 h-4 w-4" />
                Ask the sous-chef
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setMood("hungry")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-all",
                mood === "hungry"
                  ? "bg-gradient-to-r from-hungry-start to-hungry-end text-white shadow-lg shadow-hungry-end/30"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              I&apos;m hungry
            </button>
            <button
              type="button"
              onClick={() => setMood("full")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-all",
                mood === "full"
                  ? "bg-gradient-to-r from-full-start to-full-end text-white shadow-lg shadow-full-end/30"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              I&apos;m full
            </button>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Tell everyone how you&apos;re rolling today
            </span>
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-muted/40 p-4">
            <label htmlFor="community-composer" className="text-sm font-semibold text-muted-foreground">
              {mood === "hungry" ? "What are you craving?" : "What are you sharing?"}
            </label>
            <textarea
              id="community-composer"
              rows={mood === "hungry" ? 3 : 4}
              value={composerValue}
              onChange={(event) => setComposerValue(event.target.value)}
              placeholder={
                mood === "hungry"
                  ? "Example: Looking for halal-friendly groceries and kid-friendly meals for tonight."
                  : "Example: Extra veggie curry and rice for two. Pickup near 15th & J before 9pm."
              }
              className="w-full resize-none rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
            <div className="flex flex-wrap gap-2">
              {prompts.map((prompt) => (
                <Button
                  key={prompt}
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-full bg-secondary px-3 text-xs"
                  onClick={() => handlePromptClick(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-muted-foreground">
                Posts go to neighbors within 2 miles. Guides get alerted when you need extra help.
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={handlePost}
                  className="rounded-full bg-primary px-5 text-primary-foreground shadow"
                  disabled={composerValue.trim().length === 0 || isPosting}
                >
                  {isPosting ? "Posting..." : "Post to the potluck"}
                </Button>
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link href={`/chat?prefill=${encodeURIComponent(aiPrompt)}`}>
                    Ask the sous-chef first
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((filterOption) => (
              <Button
                key={filterOption.value}
                type="button"
                variant={filter === filterOption.value ? "default" : "secondary"}
                size="sm"
                className={cn(
                  "rounded-full px-4",
                  filter === filterOption.value
                    ? "bg-primary text-primary-foreground shadow"
                    : "bg-secondary text-secondary-foreground"
                )}
                onClick={() => setFilter(filterOption.value)}
              >
                {filterOption.label}
              </Button>
            ))}
          </div>

          <div className="space-y-4">
            {visiblePosts.map((post) => {
              const askSousChefHref = `/chat?prefill=${encodeURIComponent(
                `Help me respond to ${post.author}'s post in the community potluck.`
              )}`;

              return (
                <article
                  key={post.id}
                  className="rounded-3xl border border-border/60 bg-card/95 p-5 shadow-sm"
                >
                <header className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-base font-semibold text-primary">
                      {post.author.slice(0, 1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{post.author}</p>
                        <Badge className={cn("rounded-full px-2.5 text-[0.65rem]", ROLE_BADGE[post.role].tone)}>
                          {ROLE_BADGE[post.role].label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{post.distance}</span>
                        <span className="text-xs text-muted-foreground">• {post.timeAgo}</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{post.body}</p>
                      {post.tags ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {post.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="rounded-full border-primary/20 bg-primary/5 text-primary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  {post.meta && (post.meta.location || post.meta.status || post.meta.until) ? (
                    <div className="flex flex-col items-end gap-2 text-right text-xs text-muted-foreground">
                      {post.meta.status ? (
                        <span className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase", STATUS_BADGE[post.meta.status].tone)}>
                          {post.meta.status === "verified" ? "✓" : post.meta.status === "needs-love" ? "!" : "•"}
                          {STATUS_BADGE[post.meta.status].label}
                        </span>
                      ) : null}
                      {post.meta.location ? (
                        <span className="flex items-center gap-1 text-xs">
                          <MapPin className="h-3 w-3" />
                          {post.meta.location}
                        </span>
                      ) : null}
                      {post.meta.until ? (
                        <span className="flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3" />
                          {post.meta.until}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </header>

                <footer className="mt-4 flex flex-wrap items-center gap-2">
                  <Button variant="secondary" size="sm" className="rounded-full">
                    <HeartHandshake className="mr-1.5 h-4 w-4" />
                    I&apos;m on it
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full">
                    <MessageCircle className="mr-1.5 h-4 w-4" />
                    Add a comment
                  </Button>
                  <Button asChild variant="ghost" size="sm" className="rounded-full">
                    <Link href={askSousChefHref}>Ask sous-chef</Link>
                  </Button>
                </footer>

                {post.replies && post.replies.length > 0 ? (
                  <div className="mt-4 space-y-3 rounded-2xl bg-muted/40 p-4">
                    {post.replies.map((reply) => (
                      <div key={reply.id} className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">{reply.author}</span>
                          <span>• {reply.role === "guide" ? "Guide" : "Neighbor"}</span>
                          <span>• {reply.timeAgo}</span>
                          {typeof reply.helpful === "number" ? (
                            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] text-primary">
                              <Sparkles className="h-3 w-3" />
                              {reply.helpful} found this helpful
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm text-muted-foreground">{reply.body}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
                </article>
              );
            })}
          </div>
        </section>

        <aside className="flex flex-col gap-5">
          <div className="rounded-3xl border border-border/60 bg-card/95 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FlameIcon className="h-5 w-5 text-accent-foreground" />
              Tonight&apos;s hot dishes
            </div>
            <div className="mt-4 space-y-4">
              {hotItems.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border/60 bg-secondary/60 p-4 text-sm">
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">Hosted by {item.host}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {item.until}
                    </span>
                    <span className="flex items-center gap-1">
                      <Navigation2 className="h-3 w-3" /> {item.distance}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/95 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ChefHat className="h-5 w-5 text-primary" />
              Guide tips
            </div>
            <div className="mt-4 space-y-4 text-sm text-muted-foreground">
              {guideMoments.map((moment) => (
                <div key={moment.id} className="space-y-2 rounded-2xl border border-border/60 bg-muted/30 p-4">
                  <p className="font-semibold text-foreground">{moment.guide}</p>
                  <p>{moment.tip}</p>
                  <Button asChild variant="link" className="px-0 text-primary">
                    <Link href={moment.href} className="inline-flex items-center gap-1">
                      {moment.linkLabel}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/95 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="h-5 w-5 text-primary" />
              Vibe check
            </div>
            <div className="mt-4 grid gap-3">
              {vibeStats.map((stat) => (
                <div key={stat.id} className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-3 text-sm">
                  <div className="text-2xl font-semibold text-primary">{stat.value}</div>
                  <p className="text-sm font-medium text-foreground">{stat.label}</p>
                  {stat.description ? (
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/95 p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Need a map view of these spots? Jump to the food map or ping the sous-chef.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm" className="rounded-full">
                <Link href="/map">
                  <MapPin className="mr-1.5 h-4 w-4" />
                  Map view
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link href="/chat?prefill=Can%20you%20summarize%20today%27s%20community%20posts%20for%20me%3F">
                  Ask AI for a recap
                </Link>
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function FlameIcon(props: ComponentProps<typeof Sparkles>) {
  return <Sparkles {...props} />;
}
