import {
  pgTable,
  text,
  timestamp,
  boolean,
  json,
  real,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { randomUUID } from "crypto";

export type HoursType = Record<
  string,
  {
    open: string;
    close: string;
    closed?: boolean;
  }
>;

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified"),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const foodBanks = pgTable("food_banks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  phone: text("phone"),
  website: text("website"),
  description: text("description"),
  services: text("services").array(),
  hours: json("hours").$type<HoursType>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const savedLocations = pgTable("saved_locations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  foodBankId: text("food_bank_id")
    .notNull()
    .references(() => foodBanks.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  sessionId: text("session_id"),
  role: text("role").notNull(),
  content: text("content").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Community Social Tables
export const userProfiles = pgTable("user_profiles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  karma: integer("karma").notNull().default(0),
  role: text("role").notNull().default("neighbor"), // neighbor, guide, admin
  bio: text("bio"),
  postsCount: integer("posts_count").notNull().default(0),
  helpfulMarksReceived: integer("helpful_marks_received").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const posts = pgTable("posts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  mood: text("mood"), // "hungry" | "full" | null
  kind: text("kind").notNull().default("update"), // "share" | "request" | "update" | "resource"
  location: text("location"), // Free text: "13th & P St"
  locationCoords: json("location_coords").$type<{ lat: number; lng: number }>(),
  expiresAt: timestamp("expires_at"),
  urgency: text("urgency"), // "asap" | "today" | "this_week"
  photoUrl: text("photo_url"),
  metadata: json("metadata").$type<{ tags?: string[] }>(),
  helpfulCount: integer("helpful_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const comments = pgTable("comments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  postId: text("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  parentCommentId: text("parent_comment_id"), // For threaded comments
  helpfulCount: integer("helpful_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const follows = pgTable("follows", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  followerId: text("follower_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  followingId: text("following_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const helpfulMarks = pgTable("helpful_marks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  targetType: text("target_type").notNull(), // "post" | "comment"
  targetId: text("target_id").notNull(), // ID of post or comment
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type FoodBank = typeof foodBanks.$inferSelect;
export type SavedLocation = typeof savedLocations.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Follow = typeof follows.$inferSelect;
export type HelpfulMark = typeof helpfulMarks.$inferSelect;

// Relations
export const savedLocationsRelations = relations(savedLocations, ({ one }) => ({
  user: one(user, {
    fields: [savedLocations.userId],
    references: [user.id],
  }),
  foodBank: one(foodBanks, {
    fields: [savedLocations.foodBankId],
    references: [foodBanks.id],
  }),
}));

export const userRelations = relations(user, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [user.id],
    references: [userProfiles.userId],
  }),
  posts: many(posts),
  comments: many(comments),
  savedLocations: many(savedLocations),
  followers: many(follows, { relationName: "following" }),
  following: many(follows, { relationName: "follower" }),
  helpfulMarks: many(helpfulMarks),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(user, {
    fields: [userProfiles.userId],
    references: [user.id],
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(user, {
    fields: [posts.userId],
    references: [user.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(user, {
    fields: [comments.userId],
    references: [user.id],
  }),
  parentComment: one(comments, {
    fields: [comments.parentCommentId],
    references: [comments.id],
    relationName: "replies",
  }),
  replies: many(comments, { relationName: "replies" }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(user, {
    fields: [follows.followerId],
    references: [user.id],
    relationName: "follower",
  }),
  following: one(user, {
    fields: [follows.followingId],
    references: [user.id],
    relationName: "following",
  }),
}));

export const helpfulMarksRelations = relations(helpfulMarks, ({ one }) => ({
  user: one(user, {
    fields: [helpfulMarks.userId],
    references: [user.id],
  }),
}));
