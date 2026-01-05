---
title: "Part 5: Building Community - Posts, Comments, and Social Features"
series: "TheFeed Development Journey"
part: 5
date: 2025-11-07
updated: 2025-12-27
tags: [social, community, database-design, drizzle, nextjs]
reading_time: "13 min"
commits_covered: "d06b57a..20f2576"
---

## From Discovery to Community

The map helped users find food. The AI chat provided guidance. But the **real** vision required something more: **neighbor-to-neighbor** food sharing.

Facebook groups do this, but they're cluttered. Buy Nothing works, but it's not food-focused. Nextdoor exists, but lacks the dignity-preserving design needed for food security.

So on November 7th, I started building the community social layer - posts, comments, karma, and follows.

## The Database Schema

Social features start with data models. Here's what I designed:

```typescript
// src/lib/schema.ts - Community tables
export const posts = pgTable("posts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  content: text("content").notNull(),
  kind: text("kind").notNull(), // 'share' | 'request' | 'update' | 'resource' | 'event'
  mood: text("mood"), // 'hungry' | 'full' | 'neutral'
  location: text("location"), // Free-text: "13th & P St"
  locationCoords: json("location_coords").$type<{ lat: number; lng: number }>(),
  photoUrl: text("photo_url"),
  expiresAt: timestamp("expires_at"),
  urgency: text("urgency"), // 'low' | 'medium' | 'high'

  // Denormalized counters for performance
  helpfulCount: integer("helpful_count").default(0),
  commentCount: integer("comment_count").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: text("user_id").notNull().references(() => user.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userProfiles = pgTable("user_profiles", {
  userId: text("user_id").primaryKey().references(() => user.id),
  karma: integer("karma").default(0),
  role: text("role").default("neighbor"), // 'neighbor' | 'guide' | 'admin'
  bio: text("bio"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const follows = pgTable("follows", {
  followerId: text("follower_id").notNull().references(() => user.id),
  followingId: text("following_id").notNull().references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.followerId, table.followingId] }),
]);

export const helpfulMarks = pgTable("helpful_marks", {
  userId: text("user_id").notNull().references(() => user.id),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.postId] }),
]);
```

### Key Design Decisions

**1. Unified `kind` Field**

Rather than separate tables for shares/requests, a single `kind` column distinguished post types. This:
- Simplified queries
- Made UI rendering consistent
- Enabled future post types without migrations
- Preserved dignity (requests look identical to shares)

**2. Optional Location Coordinates**

Not every post needs a map pin. `locationCoords` is optional, respecting privacy while enabling geographic discovery.

**3. Denormalized Counters**

`helpfulCount` and `commentCount` avoid expensive `COUNT(*)` queries on every post render. The trade-off? Maintaining consistency during updates.

**4. Separate UserProfiles**

Extending Better Auth's `user` table was tempting, but a separate `user_profiles` table kept concerns separated and avoided migration headaches.

## The API Routes

Next.js App Router API routes handle CRUD operations:

### GET /api/posts - List Posts

```typescript
// src/app/api/posts/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  const cursor = searchParams.get('cursor');
  const kind = searchParams.get('kind');
  const mood = searchParams.get('mood');

  let query = db
    .select({
      post: posts,
      author: {
        id: user.id,
        name: user.name,
        image: user.image,
      },
      profile: userProfiles,
    })
    .from(posts)
    .leftJoin(user, eq(posts.userId, user.id))
    .leftJoin(userProfiles, eq(posts.userId, userProfiles.userId))
    .orderBy(desc(posts.createdAt))
    .limit(limit);

  // Apply filters
  if (kind) {
    query = query.where(eq(posts.kind, kind));
  }
  if (mood) {
    query = query.where(eq(posts.mood, mood));
  }
  if (cursor) {
    // Cursor-based pagination
    query = query.where(lt(posts.createdAt, new Date(cursor)));
  }

  const results = await query;

  return Response.json({
    posts: results,
    nextCursor: results.length === limit
      ? results[results.length - 1].post.createdAt.toISOString()
      : null,
  });
}
```

**Cursor-based pagination** was crucial for real-time feeds. Offset pagination (`LIMIT/OFFSET`) breaks when new posts appear mid-scroll.

### POST /api/posts - Create Post

```typescript
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { content, kind, mood, location, locationCoords, urgency, expiresAt } = body;

  // Validation
  if (!content || content.length < 10) {
    return Response.json({ error: 'Content must be at least 10 characters' }, { status: 400 });
  }

  const postId = crypto.randomUUID();

  await db.insert(posts).values({
    id: postId,
    userId: session.user.id,
    content,
    kind: kind || 'update',
    mood,
    location,
    locationCoords,
    urgency,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
  });

  return Response.json({ id: postId }, { status: 201 });
}
```

Simple, functional, and **type-safe** thanks to Drizzle's inference.

### POST /api/posts/[id]/helpful - Upvote

```typescript
// src/app/api/posts/[id]/helpful/route.ts
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: postId } = await params;

  // Check if already marked helpful
  const existing = await db
    .select()
    .from(helpfulMarks)
    .where(
      and(
        eq(helpfulMarks.userId, session.user.id),
        eq(helpfulMarks.postId, postId)
      )
    );

  if (existing.length > 0) {
    // Remove mark (toggle)
    await db.delete(helpfulMarks).where(
      and(
        eq(helpfulMarks.userId, session.user.id),
        eq(helpfulMarks.postId, postId)
      )
    );

    // Decrement counter
    await db
      .update(posts)
      .set({ helpfulCount: sql`${posts.helpfulCount} - 1` })
      .where(eq(posts.id, postId));

    return Response.json({ marked: false });
  }

  // Add mark
  await db.insert(helpfulMarks).values({
    userId: session.user.id,
    postId,
  });

  // Increment counter
  await db
    .update(posts)
    .set({ helpfulCount: sql`${posts.helpfulCount} + 1` })
    .where(eq(posts.id, postId));

  return Response.json({ marked: true });
}
```

This toggle behavior feels natural - click once to mark helpful, click again to unmark.

## The Community Page

With APIs ready, I built the UI:

```tsx
// src/app/community/page.tsx - Server component
export default async function CommunityPage() {
  const posts = await db
    .select({
      post: posts,
      author: { id: user.id, name: user.name, image: user.image },
      profile: userProfiles,
    })
    .from(posts)
    .leftJoin(user, eq(posts.userId, user.id))
    .leftJoin(userProfiles, eq(posts.userId, userProfiles.userId))
    .orderBy(desc(posts.createdAt))
    .limit(20);

  return <CommunityPageClient initialPosts={posts} />;
}
```

Server components fetch data; client components handle interactivity:

```tsx
// src/app/community/page-client.tsx
'use client';

export default function CommunityPageClient({ initialPosts }: Props) {
  const [posts, setPosts] = useState(initialPosts);
  const [filter, setFilter] = useState<PostKind | 'all'>('all');

  const filteredPosts = useMemo(() => {
    if (filter === 'all') return posts;
    return posts.filter((p) => p.post.kind === filter);
  }, [posts, filter]);

  return (
    <div className="container max-w-4xl py-8">
      <PostFilters activeFilter={filter} onFilterChange={setFilter} />
      <PostComposer onPostCreated={(newPost) => setPosts([newPost, ...posts])} />
      <PostFeed posts={filteredPosts} />
    </div>
  );
}
```

## The Post Composer

Creating posts required a thoughtful UI:

```tsx
// src/app/community/components/composer/index.tsx
export function PostComposer({ onPostCreated }: PostComposerProps) {
  const [content, setContent] = useState('');
  const [kind, setKind] = useState<PostKind>('share');
  const [mood, setMood] = useState<'hungry' | 'full' | 'neutral'>('neutral');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, kind, mood }),
      });

      if (!response.ok) throw new Error('Failed to create post');

      const { id } = await response.json();

      // Optimistically update UI
      onPostCreated({ id, content, kind, mood, createdAt: new Date() });

      // Reset form
      setContent('');
      toast.success('Posted successfully!');
    } catch (error) {
      toast.error('Failed to post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Share food, ask for help, or post an update..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />

          <div className="flex items-center gap-4">
            <Select value={kind} onValueChange={(v) => setKind(v as PostKind)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="share">Sharing Food</SelectItem>
                <SelectItem value="request">Requesting Help</SelectItem>
                <SelectItem value="update">Update</SelectItem>
              </SelectContent>
            </Select>

            <Button type="submit" disabled={isSubmitting || content.length < 10}>
              {isSubmitting ? <Spinner /> : 'Post'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

### The Intent Toggle

The "mood" concept - "I'm hungry" vs "I'm full" - became central to the UX. It sets context for the AI and filters the feed.

Later iterations (Part 11) moved this to a header toggle, but the initial inline version validated the concept.

## The Post Card Component

Each post needed consistent rendering:

```tsx
// src/app/community/components/post-feed/post-card.tsx
export function PostCard({ post, author, profile }: PostCardProps) {
  const [helpfulCount, setHelpfulCount] = useState(post.helpfulCount);
  const [isMarkedHelpful, setIsMarkedHelpful] = useState(false);

  const handleHelpful = async () => {
    const response = await fetch(`/api/posts/${post.id}/helpful`, {
      method: 'POST',
    });

    if (!response.ok) return;

    const { marked } = await response.json();
    setIsMarkedHelpful(marked);
    setHelpfulCount((prev) => prev + (marked ? 1 : -1));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={author.image} alt={author.name} />
            <AvatarFallback>{author.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{author.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(post.createdAt)} ago
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="whitespace-pre-wrap">{post.content}</p>

        {post.location && (
          <div className="mt-3 flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            {post.location}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleHelpful}
          className={isMarkedHelpful ? 'text-primary' : ''}
        >
          <ThumbsUp className="h-4 w-4 mr-1" />
          Helpful ({helpfulCount})
        </Button>

        <Button variant="ghost" size="sm">
          <MessageCircle className="h-4 w-4 mr-1" />
          {post.commentCount} Replies
        </Button>
      </CardFooter>
    </Card>
  );
}
```

## The Dignity-Preserving Design

The most important UX decision: **shares and requests look identical**.

No visual hierarchy. No color coding. Just a subtle badge:

```tsx
<Badge variant="outline">
  {post.kind === 'share' ? '🌿 Sharing' : post.kind === 'request' ? '🌱 Requesting' : '📝 Update'}
</Badge>
```

Users couldn't tell at a glance who was asking vs giving. This **removed stigma** - the core value proposition.

## Realtime Updates (Planned)

The initial version required manual refresh to see new posts. I planned to add **Supabase Realtime**:

```typescript
// Future implementation
useEffect(() => {
  const channel = supabase
    .channel('posts')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'posts',
    }, (payload) => {
      setPosts((prev) => [payload.new, ...prev]);
      toast.info('New post!');
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

But polling every 30s was simpler for MVP and avoided WebSocket complexity.

## What Went Right

1. **Server/Client Split**: Server components for data, client for interactivity worked beautifully

2. **Cursor Pagination**: No weird bugs when new posts appeared mid-scroll

3. **Denormalized Counters**: Read performance was instant; write consistency manageable

4. **Dignity-First Design**: Making requests indistinguishable was the right call

## What I'd Do Differently

**Mistake 1: No Comment Threading**

Flat comments were simple but limiting. Reddit-style threading would have improved conversations.

**Mistake 2: No Moderation Tools**

I assumed manual moderation, but even small communities need flagging, hiding, and admin actions.

**Mistake 3: No Draft Saves**

Losing a long post due to accidental navigation was frustrating. LocalStorage drafts should have been day one.

## What I Learned

1. **Social Features Are Complex**: Comments, karma, follows - each adds multiplicative complexity

2. **Denormalization Is Worth It**: Sacrificing write simplicity for read speed was correct

3. **Dignity Requires Design**: Stigma-free UX isn't cosmetic; it's core functionality

4. **Start With Polling**: WebSockets add complexity; defer until proven necessary

## Up Next

In Part 6, I'll cover the event hosting system - enabling neighbors to organize potlucks, volunteer shifts, and community gatherings.

---
**Key Commits**:
- `d06b57a` - Implement Phase 1 community social infrastructure
- `20f2576` - Fix post button functionality on community page

**Related Files**:
- `src/lib/schema.ts` - Social tables schema
- `src/app/api/posts/route.ts` - Posts CRUD API
- `src/app/community/page.tsx` - Community page server component
