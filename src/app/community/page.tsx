import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CommunityPageClient } from "./page-client";
import type {
  FeedPost,
  GuideMoment,
  VibeStat,
  EventCardData,
} from "./types";
import { getPosts } from "@/lib/post-queries";
import { getEvents } from "@/lib/event-queries";
import { addDays } from "date-fns";

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

  }
  return `Available until ${expiresAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}





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
  // Check authentication (optional for reading)
  const session = await auth.api.getSession({ headers: await headers() });

  // Fetch real posts from database
  const { items: dbPosts } = await getPosts({ limit: 20 });

  const now = new Date();
  const spotlightRangeEnd = addDays(now, 14);

  // Fetch upcoming spotlight events within the next 2 weeks
  const { items: dbEvents } = await getEvents({
    limit: 6,
    status: "upcoming",
    onlyUpcoming: true,
    startAfter: now,
    startBefore: spotlightRangeEnd,
  });

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
      distance: "N/A", // Will be calculated on client when user location is available
      timeAgo: formatTimeAgo(post.createdAt),
      body: post.content,
      locationCoords: post.locationCoords || undefined,
      meta: {
        location: post.location || undefined,
        until: post.expiresAt ? formatUntil(post.expiresAt) : undefined,
        status: "community" as const, // TODO: Determine status based on verification
      },
      tags: post.metadata?.tags || undefined,
      replies: [], // TODO: Fetch comments in future
    };
  });

  // Transform events to EventCardData format
  const events: EventCardData[] = dbEvents.map((event) => ({
    id: event.id,
    title: event.title,
    eventType: event.eventType as "potluck" | "volunteer",
    hostName: event.host.name,
    startTime: event.startTime,
    location: event.location,
    rsvpCount: event.rsvpCount,
    capacity: event.capacity,
    isVerified: event.isVerified,
  }));

  return (
    <CommunityPageClient
      posts={posts}
      initialEvents={events}
      guideMoments={GUIDE_MOMENTS}
      vibeStats={VIBE_STATS}
      user={
        session?.user
          ? {
            id: session.user.id,
            name: session.user.name,
            image: session.user.image ?? null,
            email: session.user.email,
          }
          : undefined
      }
    />
  );
}
