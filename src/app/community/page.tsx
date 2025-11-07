"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Flame,
  Leaf,
  MapPin,
  MessageCircle,
  Sparkles,
  Users,
} from "lucide-react";

import { MoodChip, type Mood } from "@/components/foodshare/mood-chip";
import { BigActionButton } from "@/components/foodshare/big-action-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type SharePost = {
  id: string;
  type: "share";
  author: string;
  distance: string;
  postedAt: string;
  headline: string;
  description: string;
  pickup: string;
  availableUntil: string;
  tags: string[];
};

type RequestPost = {
  id: string;
  type: "request";
  author: string;
  distance: string;
  postedAt: string;
  request: string;
  replies: { author: string; text: string }[];
};

type GuidePost = {
  id: string;
  type: "guide";
  author: string;
  postedAt: string;
  distance: string;
  update: string;
  locationName: string;
  address: string;
  verifiedBy: string;
};

type LocationPost = {
  id: string;
  type: "location";
  author: string;
  distance: string;
  postedAt: string;
  name: string;
  address: string;
  status: "community" | "verified";
  description: string;
};

type FeedPost = SharePost | RequestPost | GuidePost | LocationPost;

const feedPosts: FeedPost[] = [
  {
    id: "post-share-1",
    type: "share",
    author: "Nia B.",
    distance: "0.3 mi away",
    postedAt: "4 min ago",
    headline: "Leftover coconut curry (2 servings)",
    description:
      "Mild spice, coconut milk base. Comes with jasmine rice + lime wedges. Bring your own container if you can!",
    pickup: "12th & Broadway stoop",
    availableUntil: "7:30 pm tonight",
    tags: ["Vegetarian", "Contains coconut"],
  },
  {
    id: "post-request-1",
    type: "request",
    author: "Marco L.",
    distance: "0.6 mi away",
    postedAt: "11 min ago",
    request: "Looking for halal-friendly pantry options for tomorrow (Friday).",
    replies: [
      {
        author: "Guide Zahra",
        text: "City Harvest Hub on 21st & T has halal meat Fridays after 3pm. Show up early!",
      },
      {
        author: "Samira",
        text: "Al Noor Market is stocking fresh halal chicken today. Prices are decent.",
      },
    ],
  },
  {
    id: "post-guide-1",
    type: "guide",
    author: "Guide Maria",
    distance: "1.1 mi away",
    postedAt: "35 min ago",
    update: "Fresh produce drop just landed — think peaches, greens, and pantry staples.",
    locationName: "Oak Park Community Pantry",
    address: "3725 MLK Jr Blvd",
    verifiedBy: "Guide Maria",
  },
  {
    id: "post-location-1",
    type: "location",
    author: "Kevin P.",
    distance: "0.9 mi away",
    postedAt: "1 hr ago",
    name: "Midtown Fridge Collective",
    address: "18th & Q St",
    status: "community",
    description:
      "Shared community fridge stocked with meals every evening. Looking for a few more volunteers to restock on Sundays.",
  },
];

const trendingTags = ["Halal", "Vegan bites", "Kid friendly", "Late night", "Pantry restock"];

const moodOptions: { key: Mood; title: string; description: string }[] = [
  {
    key: "hungry",
    title: "I’m hungry",
    description: "Ask neighbors for a plate or tips",
  },
  {
    key: "full",
    title: "I’m full",
    description: "Offer leftovers or volunteer",
  },
];

export default function CommunityPage() {
  const [activeMood, setActiveMood] = useState<Mood>("hungry");
  const [composerValue, setComposerValue] = useState("");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-28 pt-6 md:space-y-8 md:pt-8">
      <header className="space-y-3">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          Community
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          What neighbors within 2 miles are cooking up
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Swap bites, ask for help, and keep the warmth going. TheFeed automatically
          nudges your AI sous-chef and our map when a post needs backup.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <section className="flex flex-col gap-6">
          <Card className="rounded-3xl border border-border/70 bg-card/90 shadow-sm">
            <CardContent className="flex flex-col gap-5 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Serving radius
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    Midtown • Within 2 miles
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4 text-accent" />
                  14 neighbors sharing right now · 3 guides on duty
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm" className="rounded-full border-dashed">
                  <Link href="/map">Peek at the map</Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="rounded-full">
                  <Link href="/chat">Ask the AI sous-chef</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-border/70 bg-card/95 shadow-md">
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Start something delicious</p>
                  <p className="text-xs text-muted-foreground">
                    Pick your vibe, drop the details, and neighbors within 2 miles will be pinged.
                  </p>
                </div>
                <div className="flex gap-2">
                  {moodOptions.map((mood) => (
                    <Button
                      key={mood.key}
                      type="button"
                      variant={activeMood === mood.key ? "default" : "outline"}
                      className="rounded-full px-4"
                      onClick={() => setActiveMood(mood.key)}
                    >
                      {mood.title}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <textarea
                  value={composerValue}
                  onChange={(event) => setComposerValue(event.target.value)}
                  rows={3}
                  placeholder={
                    activeMood === "hungry"
                      ? "Example: “Anyone have extra tortillas or know a pantry open after 7?”"
                      : "Example: “Two trays of tamales up for grabs. Pickup near Broadway & 10th.”"
                  }
                  className="w-full resize-none rounded-2xl border border-border/70 bg-background/60 p-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <div className="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <span>Automatic cross-post to chat & map if neighbors need more info.</span>
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-full px-4"
                    disabled={composerValue.trim().length === 0}
                  >
                    {activeMood === "hungry" ? "Send my hunger flare" : "Share my leftovers"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {feedPosts.map((post) => (
              <article
                key={post.id}
                className="rounded-3xl border border-border/70 bg-card/95 p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
              >
                {renderFeedPost(post)}
              </article>
            ))}
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <Card className="rounded-3xl border border-border/70 bg-card/90 shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Tonight’s energy
                </h2>
                <Flame className="h-4 w-4 text-accent" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <StatBlock label="Hot meals" value="9" sublabel="Cooking right now" />
                <StatBlock label="Requests" value="5" sublabel="Need backup" />
                <StatBlock label="Pantries open" value="7" sublabel="Verified" />
                <StatBlock label="Volunteers" value="12" sublabel="On call" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Trending filters
                </p>
                <div className="flex flex-wrap gap-2">
                  {trendingTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="rounded-full border-accent/30 bg-accent/10 text-xs text-accent"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Quick jumps
                </p>
                <div className="flex flex-col gap-2">
                  <Button asChild variant="outline" size="sm" className="justify-start rounded-2xl">
                    <Link href="/map" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Open map with these filters
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm" className="justify-start rounded-2xl">
                    <Link href="/chat" className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Ask AI for pantry hours
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3 rounded-3xl border border-dashed border-primary/30 bg-primary/5 p-5 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Need a vibe check?</p>
            <p>
              Switch tabs anytime — TheFeed keeps your map pins, chat suggestions, and dashboard reminders synced automatically.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <BigActionButton
                variant="hungry"
                title="Ping the AI sous-chef"
                description={`It already knows you’re ${activeMood}.`}
                className="text-sm"
                onClick={() => {
                  setActiveMood("hungry");
                }}
              />
              <BigActionButton
                variant="full"
                title="Spotlight a pantry"
                description="Drop it on the map & feed this feed."
                className="text-sm"
                onClick={() => {
                  setActiveMood("full");
                }}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function renderFeedPost(post: FeedPost) {
  switch (post.type) {
    case "share":
      return (
        <div className="space-y-4">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{post.author}</span>
                <span>•</span>
                <span>{post.distance}</span>
                <span>•</span>
                <span>{post.postedAt}</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">{post.headline}</h3>
            </div>
            <MoodChip mood="full" compact className="rounded-2xl" />
          </header>
          <p className="text-sm text-muted-foreground">{post.description}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/80 px-3 py-1">
              <MapPin className="h-3 w-3 text-accent" /> {post.pickup}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/80 px-3 py-1">
              <Clock className="h-3 w-3 text-accent" /> {post.availableUntil}
            </span>
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-primary"
              >
                <Leaf className="h-3 w-3" /> {tag}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" className="rounded-full px-4">
              <Link href="/chat" className="flex items-center gap-2">
                Claim these leftovers
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-full px-4">
              <Link href="/community" className="flex items-center gap-2">
                Add a comment
                <MessageCircle className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      );
    case "request":
      return (
        <div className="space-y-4">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{post.author}</span>
                <span>•</span>
                <span>{post.distance}</span>
                <span>•</span>
                <span>{post.postedAt}</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Needs a recommendation</h3>
            </div>
            <MoodChip mood="hungry" compact className="rounded-2xl" />
          </header>
          <p className="text-sm text-muted-foreground">{post.request}</p>
          <div className="space-y-3 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Neighbor replies</p>
            <ul className="space-y-3">
              {post.replies.map((reply) => (
                <li key={`${post.id}-${reply.author}`} className="text-sm text-foreground">
                  <span className="font-semibold">{reply.author}:</span> {reply.text}
                </li>
              ))}
            </ul>
            <Button asChild variant="ghost" size="sm" className="self-start rounded-full px-4">
              <Link href="/community#reply" className="flex items-center gap-2">
                Add your tip
                <MessageCircle className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      );
    case "guide":
      return (
        <div className="space-y-4">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{post.author}</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Guide</span>
                <span>•</span>
                <span>{post.distance}</span>
                <span>•</span>
                <span>{post.postedAt}</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">{post.locationName}</h3>
            </div>
            <MoodChip mood="full" compact className="rounded-2xl" />
          </header>
          <p className="text-sm text-muted-foreground">{post.update}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/80 px-3 py-1">
              <MapPin className="h-3 w-3 text-accent" /> {post.address}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-primary">
              ✓ Verified by {post.verifiedBy}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" className="rounded-full px-4">
              <Link href="/map" className="flex items-center gap-2">
                Get directions
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-full px-4">
              <Link href="/chat" className="flex items-center gap-2">
                Ask the guide
                <MessageCircle className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      );
    case "location":
      return (
        <div className="space-y-4">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{post.author}</span>
                <span>•</span>
                <span>{post.distance}</span>
                <span>•</span>
                <span>{post.postedAt}</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">New spot added: {post.name}</h3>
            </div>
            <MoodChip mood="full" compact className="rounded-2xl" />
          </header>
          <p className="text-sm text-muted-foreground">{post.description}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/80 px-3 py-1">
              <MapPin className="h-3 w-3 text-accent" /> {post.address}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-accent/40 bg-accent/10 px-3 py-1 text-accent">
              {post.status === "verified" ? "Community verified" : "Awaiting neighbor check-ins"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" className="rounded-full px-4">
              <Link href="/map" className="flex items-center gap-2">
                Pin it on the map
                <MapPin className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-full px-4">
              <Link href="/community#verify" className="flex items-center gap-2">
                I can verify
                <Sparkles className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      );
  }

  return null;
}

type StatBlockProps = {
  label: string;
  value: string;
  sublabel: string;
};

function StatBlock({ label, value, sublabel }: StatBlockProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground opacity-80">{sublabel}</p>
    </div>
  );
}
