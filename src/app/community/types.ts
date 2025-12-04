/**
 * Shared types for the Community page
 */

export type CommunityMode = "hungry" | "helper" | "browse";
export type PostIntent = "need" | "share";
export type FeedFilter = "all" | "shares" | "requests" | "updates";

export type FeedPost = {
  id: string;
  author: string;
  role: "neighbor" | "guide" | "community";
  mood: "hungry" | "full" | "update";
  kind: "share" | "request" | "update" | "resource";
  distance: string;
  timeAgo: string;
  body: string;
  locationCoords?: { lat: number; lng: number };
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

export type EventCardData = {
  id: string;
  title: string;
  eventType: "potluck" | "volunteer";
  hostName: string;
  startTime: Date;
  location: string;
  rsvpCount: number;
  capacity: number | null;
  isVerified: boolean;
};

export type CommunityPageClientProps = {
  posts: FeedPost[];
  initialEvents: EventCardData[];
  guideMoments: GuideMoment[];
  vibeStats: VibeStat[];
  user?: {
    id: string;
    name: string;
    image: string | null;
    email: string;
  };
};

// Constants
export const FILTERS: Array<{ value: FeedFilter; label: string }> = [
  { value: "all", label: "Everything" },
  { value: "shares", label: "People sharing" },
  { value: "requests", label: "I'm hungry" },
  { value: "updates", label: "Guides & spots" },
];

export const ROLE_BADGE: Record<FeedPost["role"], { label: string; tone: string }> = {
  neighbor: { label: "Neighbor", tone: "bg-primary/10 text-primary" },
  guide: { label: "Guide", tone: "bg-full-start/15 text-full-end" },
  community: {
    label: "Community added",
    tone: "bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200"
  },
};

type StatusKey = Exclude<NonNullable<FeedPost["meta"]>["status"], undefined>;

export const STATUS_BADGE: Record<StatusKey, { label: string; tone: string }> = {
  verified: { label: "Verified", tone: "bg-status-open text-status-open-text" },
  community: { label: "Awaiting neighbors", tone: "bg-secondary text-secondary-foreground" },
  "needs-love": { label: "Needs love", tone: "bg-destructive/10 text-destructive" },
};

export const kindToFilter: Record<FeedPost["kind"], FeedFilter> = {
  share: "shares",
  request: "requests",
  update: "updates",
  resource: "updates",
};
