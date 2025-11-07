import {
  CommunityPageClient,
  type FeedPost,
  type GuideMoment,
  type HotItem,
  type VibeStat,
} from "./page-client";

const FEED_POSTS: FeedPost[] = [
  {
    id: "post-sarah",
    author: "Sarah L.",
    role: "neighbor",
    mood: "full",
    kind: "share",
    distance: "0.2 mi",
    timeAgo: "6 min ago",
    body: "Big pot of coconut lentil soup and garlic flatbread up for grabs. Bring a container if you can!",
    meta: {
      location: "13th & P St stoop",
      until: "Pickup before 8:30 pm",
      status: "verified",
    },
    tags: ["Veggie friendly", "Warm meal"],
    replies: [
      {
        id: "reply-marcus",
        author: "Marcus",
        role: "neighbor",
        body: "On my way with bowls for two! Thanks for sharing.",
        timeAgo: "2 min ago",
        helpful: 3,
      },
    ],
  },
  {
    id: "post-ana",
    author: "Ana P.",
    role: "neighbor",
    mood: "hungry",
    kind: "request",
    distance: "0.4 mi",
    timeAgo: "12 min ago",
    body: "Looking for halal groceries or a hot meal for my family tonight. Any leads nearby?",
    meta: {
      status: "community",
    },
    tags: ["Family of four", "Halal"],
    replies: [
      {
        id: "reply-guide-ahmed",
        author: "Guide Ahmed",
        role: "guide",
        body: "City Harvest pantry on 21st just restocked halal meats. They&apos;re open until 7:30 pm—no appointment needed.",
        timeAgo: "4 min ago",
        helpful: 5,
      },
      {
        id: "reply-lina",
        author: "Lina",
        role: "neighbor",
        body: "I can drop off extra rice and veggies in 20 minutes if that helps!",
        timeAgo: "1 min ago",
      },
    ],
  },
  {
    id: "post-terrance",
    author: "Terrance",
    role: "community",
    mood: "update",
    kind: "resource",
    distance: "1.1 mi",
    timeAgo: "38 min ago",
    body: "Just added Oak Park Community Pantry to the map. Friendly crew and fresh produce every Thursday evening.",
    meta: {
      location: "3725 MLK Jr Blvd",
      status: "community",
    },
    tags: ["Community fridge", "Fresh produce"],
  },
  {
    id: "post-guide-maria",
    author: "Guide Maria",
    role: "guide",
    mood: "update",
    kind: "update",
    distance: "0.6 mi",
    timeAgo: "1 hr ago",
    body: "Heads up: Sacred Heart pantry got a surprise delivery of eggs and dairy. They&apos;ll close the line at 5:30 pm.",
    meta: {
      location: "Sacred Heart Pantry",
      until: "Line closes 5:30 pm",
      status: "verified",
    },
    replies: [
      {
        id: "reply-jasmine",
        author: "Jasmine",
        role: "neighbor",
        body: "Thanks! I grabbed extra cartons—happy to share if anyone can&apos;t make it in time.",
        timeAgo: "22 min ago",
      },
    ],
  },
  {
    id: "post-ken",
    author: "Ken",
    role: "neighbor",
    mood: "full",
    kind: "share",
    distance: "0.9 mi",
    timeAgo: "2 hrs ago",
    body: "Harvested more oranges than I can juice. Porch pickup all evening—bag what you need!",
    meta: {
      location: "24th & Broadway",
      until: "Available until 10 pm",
      status: "verified",
    },
    tags: ["Fresh produce"],
  },
];

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

export default function CommunityPage() {
  return (
    <CommunityPageClient
      posts={FEED_POSTS}
      prompts={PROMPTS}
      hotItems={HOT_ITEMS}
      guideMoments={GUIDE_MOMENTS}
      vibeStats={VIBE_STATS}
    />
  );
}
