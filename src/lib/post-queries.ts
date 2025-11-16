import { db } from "./db";
import { posts, comments, userProfiles, user, follows } from "./schema";
import { eq, desc, and, lt, or, isNull, gt, inArray, sql, isNotNull } from "drizzle-orm";

export type PostRecord = typeof posts.$inferSelect;
export type CommentRecord = typeof comments.$inferSelect;

export type PostWithAuthor = PostRecord & {
  author: {
    id: string;
    name: string;
    image: string | null;
    karma: number;
    role: string;
  };
};

export type CommentWithAuthor = CommentRecord & {
  author: {
    id: string;
    name: string;
    image: string | null;
  };
};

export type PostCursor = {
  createdAt: string;
  id: string;
};

export type GetPostsParams = {
  cursor?: PostCursor | null;
  limit?: number;
  kind?: "share" | "request" | "update" | "resource" | "event";
  mood?: "hungry" | "full";
  userId?: string; // Filter by specific user
  followingUserId?: string; // Show posts from users this user follows
  includeExpired?: boolean;
  onlyWithCoords?: boolean; // Only posts with location coordinates
};

export type GetPostsResult = {
  items: PostWithAuthor[];
  nextCursor: PostCursor | null;
};

/**
 * Get posts with cursor-based pagination
 */
export async function getPosts({
  cursor = null,
  limit = 20,
  kind,
  mood,
  userId,
  followingUserId,
  includeExpired = false,
  onlyWithCoords = false,
}: GetPostsParams = {}): Promise<GetPostsResult> {
  // Build WHERE conditions
  const conditions = [];

  // Cursor pagination
  if (cursor) {
    conditions.push(
      or(
        lt(posts.createdAt, new Date(cursor.createdAt)),
        and(
          eq(posts.createdAt, new Date(cursor.createdAt)),
          lt(posts.id, cursor.id)
        )
      )
    );
  }

  // Filters
  if (kind) {
    conditions.push(eq(posts.kind, kind));
  }
  if (mood) {
    conditions.push(eq(posts.mood, mood));
  }
  if (userId) {
    conditions.push(eq(posts.userId, userId));
  }

  // Only posts with location coordinates
  if (onlyWithCoords) {
    conditions.push(isNotNull(posts.locationCoords));
  }

  // Hide expired posts unless explicitly included
  if (!includeExpired) {
    conditions.push(
      or(isNull(posts.expiresAt), gt(posts.expiresAt, new Date()))
    );
  }

  // If filtering by following, get followed user IDs first
  let followedUserIds: string[] = [];
  if (followingUserId) {
    const followedUsers = await db
      .select({ userId: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, followingUserId));
    followedUserIds = followedUsers.map((f) => f.userId);

    if (followedUserIds.length > 0) {
      conditions.push(inArray(posts.userId, followedUserIds));
    } else {
      // User follows nobody, return empty result
      return { items: [], nextCursor: null };
    }
  }

  // Execute query
  const rows = await db
    .select({
      post: posts,
      userName: user.name,
      userImage: user.image,
      userId: user.id,
      karma: userProfiles.karma,
      role: userProfiles.role,
    })
    .from(posts)
    .leftJoin(user, eq(posts.userId, user.id))
    .leftJoin(userProfiles, eq(user.id, userProfiles.userId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(limit + 1); // Fetch one extra to determine if there's a next page

  // Separate results and next cursor
  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).map((row) => ({
    ...row.post,
    author: {
      id: row.userId || "",
      name: row.userName || "Unknown User",
      image: row.userImage,
      karma: row.karma || 0,
      role: row.role || "neighbor",
    },
  }));

  const nextCursor = hasMore
    ? {
        createdAt: rows[limit - 1].post.createdAt!.toISOString(),
        id: rows[limit - 1].post.id,
      }
    : null;

  return { items, nextCursor };
}

/**
 * Get a single post by ID with author details
 */
export async function getPostById(
  id: string
): Promise<PostWithAuthor | undefined> {
  const rows = await db
    .select({
      post: posts,
      userName: user.name,
      userImage: user.image,
      userId: user.id,
      karma: userProfiles.karma,
      role: userProfiles.role,
    })
    .from(posts)
    .leftJoin(user, eq(posts.userId, user.id))
    .leftJoin(userProfiles, eq(user.id, userProfiles.userId))
    .where(eq(posts.id, id))
    .limit(1);

  if (rows.length === 0) {
    return undefined;
  }

  const row = rows[0];
  return {
    ...row.post,
    author: {
      id: row.userId || "",
      name: row.userName || "Unknown User",
      image: row.userImage,
      karma: row.karma || 0,
      role: row.role || "neighbor",
    },
  };
}

/**
 * Create a new post
 */
export async function createPost(data: {
  userId: string;
  content: string;
  mood?: "hungry" | "full" | null;
  kind?: "share" | "request" | "update" | "resource" | "event";
  location?: string;
  locationCoords?: { lat: number; lng: number };
  expiresAt?: Date;
  urgency?: "asap" | "today" | "this_week";
  photoUrl?: string;
  metadata?: { tags?: string[] };
}): Promise<PostRecord> {
  const [post] = await db
    .insert(posts)
    .values({
      ...data,
      kind: data.kind || "update",
    })
    .returning();

  // Increment user's posts count
  await db
    .update(userProfiles)
    .set({ postsCount: sql`${userProfiles.postsCount} + 1` })
    .where(eq(userProfiles.userId, data.userId));

  return post;
}

/**
 * Update a post
 */
export async function updatePost(
  id: string,
  data: {
    content?: string;
    mood?: "hungry" | "full" | null;
    kind?: "share" | "request" | "update" | "resource" | "event";
    location?: string;
    locationCoords?: { lat: number; lng: number };
    expiresAt?: Date;
    urgency?: "asap" | "today" | "this_week";
    photoUrl?: string;
    metadata?: { tags?: string[] };
  }
): Promise<PostRecord | undefined> {
  const [updated] = await db
    .update(posts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(posts.id, id))
    .returning();

  return updated;
}

/**
 * Delete a post
 */
export async function deletePost(id: string): Promise<boolean> {
  const [deleted] = await db.delete(posts).where(eq(posts.id, id)).returning();

  // Note: User's postsCount will need to be decremented separately if needed
  return !!deleted;
}

/**
 * Get comments for a post
 */
export async function getPostComments(
  postId: string
): Promise<CommentWithAuthor[]> {
  const rows = await db
    .select({
      comment: comments,
      userName: user.name,
      userImage: user.image,
      userId: user.id,
    })
    .from(comments)
    .leftJoin(user, eq(comments.userId, user.id))
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt));

  return rows.map((row) => ({
    ...row.comment,
    author: {
      id: row.userId || "",
      name: row.userName || "Unknown User",
      image: row.userImage,
    },
  }));
}

/**
 * Create a comment on a post
 */
export async function createComment(data: {
  postId: string;
  userId: string;
  content: string;
  parentCommentId?: string;
}): Promise<CommentRecord> {
  const [comment] = await db.insert(comments).values(data).returning();

  // Increment post's comment count
  await db
    .update(posts)
    .set({ commentCount: sql`${posts.commentCount} + 1` })
    .where(eq(posts.id, data.postId));

  return comment;
}

/**
 * Delete a comment
 */
export async function deleteComment(id: string): Promise<boolean> {
  const [deleted] = await db
    .delete(comments)
    .where(eq(comments.id, id))
    .returning();

  // Note: Post's commentCount will need to be decremented separately if needed
  return !!deleted;
}
