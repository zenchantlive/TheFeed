import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  CommunityPageClient,
  type FeedPost,
  type GuideMoment,
  type HotItem,
  type VibeStat,
} from "./page-client";
import { getPosts } from "@/lib/post-queries";

/**
 * Format time ago from a date
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} min ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  }
  const days = Math.floor(diffInSeconds / 86400);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

/**
 * Format expiration time
 */
function formatUntil(expiresAt: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);

  if (diffInSeconds < 0) return "Expired";
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `Available for ${minutes} more min`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `Available until ${expiresAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  }
  return `Available until ${expiresAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

const PROMPTS = [
  "Need halal-friendly groceries tonight",
  "Sharing leftover taco fillings for two",
  "Looking for a produce box for my neighbor",
  "Anyone know where to get baby formula today?",
];

const HOT_ITEMS: HotItem[] = [
  {
    id: "hot-1",
    title: "Coconut lentil soup & flatbread",
    host: "Sarah L.",
    until: "Ready until 8:30 pm",
    distance: "0.2 mi away",
  },
  {
    id: "hot-2",
    title: "Veggie curry leftovers",
    host: "Imani",
    until: "Pickup until 9:00 pm",
    distance: "0.5 mi away",
  },
];

const GUIDE_MOMENTS: GuideMoment[] = [
  {
    id: "guide-1",
    guide: "Guide Maria",
    tip: "City Harvest has a short line right now and they&apos;re stocked with pantry staples and diapers.",
    linkLabel: "View on the map",
    href: "/map",
  },
  {
    id: "guide-2",
    guide: "Guide Ahmed",
    tip: "Cooking for others? Check the volunteer shifts open at River City Kitchen this weekend.",
    linkLabel: "See volunteer spots",
    href: "/chat?prefill=Show%20me%20volunteer%20opportunities%20at%20River%20City%20Kitchen",
  },
];

const VIBE_STATS: VibeStat[] = [
  {
    id: "stat-1",
    value: "8",
    label: "Neighbors sharing tonight",
    description: "Soup, produce, and pantry runs are flowing right now.",
  },
  {
    id: "stat-2",
    value: "5",
    label: "Open locations nearby",
    description: "Map tab has them pinned if you want directions.",
  },
  {
    id: "stat-3",
    value: "12",
    label: "Replies from guides today",
    description: "The sous-chef can recap them anytime.",
  },
];

export default async function CommunityPage() {
  // Check authentication
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/");
  }

  // Fetch real posts from database
  const { items: dbPosts } = await getPosts({ limit: 20 });

  // Transform database posts to FeedPost format
  const posts: FeedPost[] = dbPosts.map((post) => {
    const role = post.author.role as "neighbor" | "guide" | "community";
    const mood = (post.mood || "update") as "hungry" | "full" | "update";
    const kind = post.kind as "share" | "request" | "update" | "resource";

    return {
      id: post.id,
      author: post.author.name,
      role,
      mood,
      kind,
      distance: "N/A", // TODO: Calculate distance from user location
      timeAgo: formatTimeAgo(post.createdAt),
      body: post.content,
      meta: {
        location: post.location || undefined,
        until: post.expiresAt ? formatUntil(post.expiresAt) : undefined,
        status: "community" as const, // TODO: Determine status based on verification
      },
      tags: post.metadata?.tags || undefined,
      replies: [], // TODO: Fetch comments in future
    };
  });

  return (
    <CommunityPageClient
      posts={posts}
      prompts={PROMPTS}
      hotItems={HOT_ITEMS}
      guideMoments={GUIDE_MOMENTS}
      vibeStats={VIBE_STATS}
    />
  );
}
