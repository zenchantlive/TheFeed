import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  json,
  real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { randomUUID } from "crypto";

// Define PostgreSQL enums for data integrity
export const communityPostMood = pgEnum("community_post_mood", [
  "hungry",
  "full",
  "update",
]);
export const communityPostKind = pgEnum("community_post_kind", [
  "share",
  "request",
  "update",
  "resource",
]);
export const communityPostStatus = pgEnum("community_post_status", [
  "verified",
  "community",
  "needs-love",
]);
export const reactionType = pgEnum("reaction_type", ["on-it", "helpful"]);

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

export const communityPosts = pgTable("community_posts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(), // Cached from user.name for display
  mood: communityPostMood("mood").notNull(),
  kind: communityPostKind("kind").notNull(),
  body: text("body").notNull(),
  location: text("location"), // Optional location string like "13th & P St"
  availableUntil: text("available_until"), // Optional time string like "8:30 pm"
  tags: text("tags").array(), // ["Veggie friendly", "Warm meal"]
  status: communityPostStatus("status").default("community"),
  latitude: real("latitude"), // Optional coordinates for proximity
  longitude: real("longitude"),
  isDemo: boolean("is_demo").default(false), // Flag for demo/seed data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const postComments = pgTable("post_comments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  postId: text("post_id")
    .notNull()
    .references(() => communityPosts.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(), // Cached for display
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const postReactions = pgTable(
  "post_reactions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    postId: text("post_id")
      .notNull()
      .references(() => communityPosts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: reactionType("type").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    unq: unique().on(table.postId, table.userId, table.type),
  }),
);

export const commentReactions = pgTable("comment_reactions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  commentId: text("comment_id")
    .notNull()
    .references(() => postComments.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: reactionType("type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type FoodBank = typeof foodBanks.$inferSelect;
export type SavedLocation = typeof savedLocations.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type CommunityPost = typeof communityPosts.$inferSelect;
export type PostComment = typeof postComments.$inferSelect;
export type PostReaction = typeof postReactions.$inferSelect;
export type CommentReaction = typeof commentReactions.$inferSelect;

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

export const communityPostsRelations = relations(communityPosts, ({ one, many }) => ({
  user: one(user, {
    fields: [communityPosts.userId],
    references: [user.id],
  }),
  comments: many(postComments),
  reactions: many(postReactions),
}));

export const postCommentsRelations = relations(postComments, ({ one, many }) => ({
  post: one(communityPosts, {
    fields: [postComments.postId],
    references: [communityPosts.id],
  }),
  user: one(user, {
    fields: [postComments.userId],
    references: [user.id],
  }),
  reactions: many(commentReactions),
}));

export const postReactionsRelations = relations(postReactions, ({ one }) => ({
  post: one(communityPosts, {
    fields: [postReactions.postId],
    references: [communityPosts.id],
  }),
  user: one(user, {
    fields: [postReactions.userId],
    references: [user.id],
  }),
}));

export const commentReactionsRelations = relations(commentReactions, ({ one }) => ({
  comment: one(postComments, {
    fields: [commentReactions.commentId],
    references: [postComments.id],
  }),
  user: one(user, {
    fields: [commentReactions.userId],
    references: [user.id],
  }),
}));
