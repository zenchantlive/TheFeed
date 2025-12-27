---
title: "Part 3: Community Social - Enabling Peer-to-Peer Food Sharing"
series: "TheFeed Development Journey"
part: 3
date: 2025-11-07
updated: 2025-12-27
tags: ["community", "social", "phase-1", "posts", "karma"]
reading_time: "9 min"
commits_covered: "d06b57a..20f2576"
---

## Where We Are

On November 7, 2025, the team launched **Phase 1: Community Social Infrastructure** (`d06b57a`). This was the pivotal moment when TheFeed transformed from a resource discovery app into a genuine peer-to-peer food-sharing platform. Users could now post offers, requests, and questions—and help each other.

## The Core Challenge

Here's the fundamental problem Phase 1 solved:

> How do you enable neighbors to safely share food with each other?

The tension:
- **Anonymity breeds abuse** (requires verification)
- **Full transparency kills privacy** (requires boundaries)
- **Pure altruism is rare** (requires incentives)
- **Complex systems don't get used** (requires simplicity)

TheFeed's answer: Identity-based community (Better Auth), location-aware sharing (coordinates), and a karma system to build reputation over time.

## The Schema: Posts, Comments, and Karma

Phase 1 added four new core tables:

### Posts Table
```typescript
export const posts = pgTable("posts", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id),
    content: text("content").notNull(),
    mood: text("mood"),           // "hungry" | "full" | null
    kind: text("kind"),           // "share" | "request" | "update" | "event"
    location: text("location"),   // "13th & P St"
    locationCoords: json("location_coords"), // {lat, lng}
    urgency: text("urgency"),     // "asap" | "today" | "this_week"
    helpfulCount: integer(),
    commentCount: integer(),
    createdAt: timestamp(),
    updatedAt: timestamp(),
});
```

**Design Notes:**
- `mood` and `kind` enable filtering ("I'm hungry" shows food shares, not requests)
- `location` is human-readable, `locationCoords` is queryable
- `helpfulCount` and `commentCount` are denormalized for quick pagination

### User Profiles for Karma
```typescript
export const userProfiles = pgTable("user_profiles", {
    userId: text("user_id").unique().references(() => user.id),
    karma: integer().default(0),       // Reputation score
    role: text().default("neighbor"),  // neighbor | guide | admin
    bio: text(),
    postsCount: integer().default(0),
    helpfulMarksReceived: integer(),   // Upvotes from community
    // ... more fields added later for gamification
});
```

### Comments & Follows
```typescript
export const comments = pgTable("comments", {
    postId: text().references(() => posts.id),
    userId: text().references(() => user.id),
    parentCommentId: text(), // Threaded conversations
    // ...
});

export const follows = pgTable("follows", {
    followerId: text().references(() => user.id),
    followingId: text().references(() => user.id),
    // ...
});
```

## The API Layer: Posts CRUD

With the schema in place, the team implemented `src/lib/post-queries.ts`:

```typescript
// Create a post (includes validation, upserting user profile)
export async function createPost(userId: string, input: PostInput) {
    // Validate content, location, mood
    // Upsert userProfiles entry
    // Insert post, increment postsCount
    // Return new post
}

// Search posts by filters
export async function searchPosts(filters: {
    mood?: "hungry" | "full",
    kind?: string,
    location?: string,
    radius?: number,
    limit?: number,
    offset?: number
}) {
    // Build query with filters
    // Support pagination
    // Return posts with user data
}

// Mark helpful (upvote)
export async function markHelpful(userId: string, postId: string) {
    // Insert helpfulMark
    // Increment helpfulCount on post
    // Increment helpfulMarksReceived on user profile
    // Add karma to post creator
}
```

## The Community Page: Where It All Lives

The community page (`src/app/community/page-client.tsx`) became the heart of the experience:

**Layout** (events-first design, but focused on posts here):
1. **Mode Toggle** (top-right)
   - "I'm hungry" filters to food shares
   - "I'm full" filters to requests
   - Critical UX decision: mode affects *priority*, not *visibility*

2. **Composer** (prominent, center)
   - Create posts (offers, requests, questions)
   - Mood selector ("Are you hungry or full?")
   - Location input with geolocation
   - Photo upload

3. **Post Feed** (main content)
   - Display posts with user avatar, timestamp, karma
   - "Helpful" button (upvote)
   - Comment button
   - Location badge showing distance

4. **Sidebar Widgets** (future expansion)
   - Active members
   - Hot items (trending posts)
   - Resources near you (integration coming)

## The Moderation Strategy

**Karma System**:
- **+5 points** when your post gets marked helpful
- **+3 points** per helpful comment
- **+10 points** when hosting an event
- Posts from users with low karma are deprioritized (not hidden)

**Safety Mechanisms**:
- All users have real Google identities
- Profile shows karma and number of posts
- Admins can flag users, hide posts, ban accounts
- Anonymous posts not allowed (by design)

## The Feature Expansion

Between November 7-8, the implementation solidified:

1. **Post Creation Working** (`20f2576`)
   - Form validation
   - Geolocation capture
   - Real-time save

2. **Comment Threading** (supporting infrastructure)
   - `parentCommentId` enables replies to replies
   - Threaded comment rendering on detail view
   - Notification ready (when we add them)

3. **Follow System** (social graph)
   - Users can follow each other
   - Foundation for personalized feeds (future)
   - Ready for "following" feed view

## Design Insights

**Mood + Location as Core Concepts:**
The decision to make "hungry/full" a top-level concept (not a mood inside comments) was crucial. It shaped every subsequent feature:
- Events inherited the mood system
- Map filters use mood
- AI chat uses mood as context
- Admin moderation uses mood for trending

**Karma Over Ratings:**
Why a single karma score instead of five-star reviews?
- Simpler for users ("is this person trustworthy?")
- Harder to game (harder to know what increases karma)
- More inclusive (new users aren't immediately downvoted)
- Matches research on prosocial incentives

## Challenges and Learnings

### Challenge 1: Data Consistency
Early implementations had issues:
- `helpfulCount` and `commentCount` could drift from reality
- Deleting a post should decrement karma (but didn't initially)
- Solution: API routes became single source of truth; cache invalidation later

### Challenge 2: Location Ambiguity
Users would say "near the park" or "downtown" instead of exact addresses.
- Decision: Allow free-text location AND coordinates
- Display: Show location badge but don't require precision
- Later: AI enhancement to geocode free-text locations

### Challenge 3: Scope Creep
The team wanted to add:
- Rich text editor (Markdown support)
- Photo galleries
- Event embeddings
- Urgent flags with notifications

Decision: Defer all of these. Keep Phase 1 minimal.

Result: Faster launch, easier iteration, user feedback drives priorities.

## The Community Philosophy

This phase established a core principle: **Dignity through design**.

Every feature had to ask:
- Does this assume the user is desperate? (No)
- Does this feel transactional? (No)
- Does this build relationship or just solve logistics? (Both)
- Would I want to use this? (Yes)

This philosophy would guide every later decision.

## What We Learned

1. **Social features are harder than resource discovery.** Finding a food bank is a fact lookup. Enabling peer sharing requires trust mechanics, moderation, incentives, and community norms. They're entirely different domains.

2. **The schema design was right.** The `posts` table with `mood`, `kind`, `location`, and `urgency` proved flexible enough to support everything: events, resources, coordination. We never needed to change the core structure.

3. **Mode-based UX scales.** By making "hungry/full" a first-class toggle, not a tag, we unlocked powerful filtering and personalization. This one decision would influence the entire product strategy.

## Up Next

With the social layer live, the natural next step was **events**. Users were posting "potluck next Saturday at 13th & P" in comments. We needed first-class event hosting.

---

**Key Commits**: `d06b57a` (Phase 1 infrastructure), `20f2576` (post functionality), related PRs #9, #15

**Related Code**: `src/lib/post-queries.ts`, `src/lib/schema.ts` (posts, comments, follows, userProfiles), `src/app/community/page-client.tsx`
