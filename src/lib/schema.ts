import {
    pgTable,
    text,
    timestamp,
    boolean,
    json,
    jsonb,
    real,
    integer,
    geometry,
    index,
    decimal,
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
    geom: geometry("geom", { type: "point", mode: "xy", srid: 4326 }),
    phone: text("phone"),
    website: text("website"),
    description: text("description"),
    services: text("services").array(),
    hours: json("hours").$type<HoursType>(),
    // Verification & Discovery Fields
    verificationStatus: text("verification_status").notNull().default("unverified"), // "unverified" | "community_verified" | "official" | "rejected" | "duplicate"
    importSource: text("import_source"), // e.g., "tavily", "manual", "seed"
    autoDiscoveredAt: timestamp("auto_discovered_at"),
    communityVerifiedAt: timestamp("community_verified_at"),
    adminVerifiedBy: text("admin_verified_by").references(() => user.id),
    adminVerifiedAt: timestamp("admin_verified_at"),
    // Pipeline Fields
    confidenceScore: real("confidence_score").default(0),
    sourceUrl: text("source_url"),
    rawHours: text("raw_hours"),
    aiSummary: text("ai_summary"),
    potentialDuplicates: text("potential_duplicates").array(), // IDs of potential duplicate resources
    // Provider Ownership (Phase 5.2)
    claimedBy: text("claimed_by").references(() => user.id),
    claimedAt: timestamp("claimed_at"),
    providerRole: text("provider_role"), // "owner" | "manager" | "staff" | "volunteer"
    providerVerified: boolean("provider_verified").default(false),
    providerCanEdit: boolean("provider_can_edit").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
    return {
        geomIndex: index("geom_idx").on(table.geom),
        claimedByIdx: index("food_banks_claimed_by_idx").on(table.claimedBy),
    };
});

/**
 * Discovery Events - Tracks search attempts to prevent duplicate runs
 * Implements the "Circuit Breaker" logic (cooldowns on specific areas)
 */
export const discoveryEvents = pgTable("discovery_events", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => randomUUID()),
    locationHash: text("location_hash").notNull(), // e.g. "sacramento-ca-95814" or "lat:38.5,lng:-121.4"
    status: text("status").notNull(), // "completed", "failed", "no_results"
    provider: text("provider").notNull().default("tavily"),
    resourcesFound: integer("resources_found").notNull().default(0),
    triggeredByUserId: text("triggered_by_user_id").references(() => user.id, { onDelete: "set null" }),
    metadata: json("metadata"), // Store search query details
    searchedAt: timestamp("searched_at").notNull().defaultNow(),
});

/**
 * Tombstone - Blacklist for resources that should not be re-discovered
 * (e.g., permanently closed locations that LLMs keep finding)
 */
export const tombstone = pgTable("tombstone", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => randomUUID()),
    resourceName: text("resource_name").notNull(),
    address: text("address").notNull(),
    reason: text("reason").notNull(), // "closed", "invalid", "duplicate"
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * User Verifications - Tracks individual user votes on resources
 * Used to promote "unverified" -> "community_verified"
 */
export const userVerifications = pgTable("user_verifications", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => randomUUID()),
    resourceId: text("resource_id")
        .notNull()
        .references(() => foodBanks.id, { onDelete: "cascade" }),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    vote: text("vote").notNull(), // "up", "down", "flag"
    field: text("field"), // Optional: specific field verified (e.g., "hours", "location")
    createdAt: timestamp("created_at").notNull().defaultNow(),
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
    // Gamification
    points: integer("points").notNull().default(0),
    level: integer("level").notNull().default(1),
    badges: jsonb("badges").$type<string[]>().default([]),
    verificationCount: integer("verification_count").notNull().default(0),
    accuracyScore: decimal("accuracy_score", { precision: 5, scale: 2 }).default("0.00"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
    pointsIdx: index("idx_user_profiles_points").on(table.points.desc()),
    levelIdx: index("idx_user_profiles_level").on(table.level.desc()),
}));

export const posts = pgTable("posts", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => randomUUID()),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    mood: text("mood"), // "hungry" | "full" | null
    kind: text("kind").notNull().default("update"), // "share" | "request" | "update" | "resource" | "event"
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

export const pointsHistory = pgTable("points_history", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => randomUUID()),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    points: integer("points").notNull(),
    metadata: json("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
    userIdIdx: index("idx_points_history_user_id").on(table.userId),
    createdAtIdx: index("idx_points_history_created_at").on(table.createdAt.desc()),
}));

// Community Event Hosting Tables (Phase 3)

/**
 * Events table - Main event details for community potlucks and volunteer opportunities
 * Links to posts table to create feed integration (every event has a corresponding post)
 */
export const events = pgTable("events", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => randomUUID()),
    // Link to the feed post about this event (for discovery in feed)
    postId: text("post_id")
        .notNull()
        .references(() => posts.id, { onDelete: "cascade" }),
    // Event host (organizer)
    hostId: text("host_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    // Basic event info
    title: text("title").notNull(),
    description: text("description").notNull(),
    // Event type: "potluck" (shared meals) or "volunteer" (food bank shifts, etc.)
    eventType: text("event_type").notNull(), // "potluck" | "volunteer"
    // Time and duration
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time").notNull(),
    // Location details
    location: text("location").notNull(), // Free text: "15th & P St Park"
    locationCoords: json("location_coords").$type<{
        lat: number;
        lng: number;
    }>(),
    // Encourage public spaces for safety (UI will show tip, but not enforced)
    isPublicLocation: boolean("is_public_location").notNull().default(true),
    // Capacity management
    capacity: integer("capacity"), // null = unlimited
    rsvpCount: integer("rsvp_count").notNull().default(0), // Denormalized for performance
    waitlistCount: integer("waitlist_count").notNull().default(0), // Denormalized
    // Event lifecycle status
    status: text("status").notNull().default("upcoming"), // "upcoming" | "in_progress" | "completed" | "cancelled"
    // Guide verification for trust and safety
    isVerified: boolean("is_verified").notNull().default(false),
    // Recurring event support (links to eventRecurrence table)
    recurrenceId: text("recurrence_id"), // FK to eventRecurrence if recurring
    parentEventId: text("parent_event_id"), // For recurring instances, links to parent event
    // Metadata
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Event RSVPs - Tracks who's attending, waitlisted, or declined an event
 * Includes guest count (bring a +1) and dietary notes
 */
export const eventRsvps = pgTable("event_rsvps", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => randomUUID()),
    eventId: text("event_id")
        .notNull()
        .references(() => events.id, { onDelete: "cascade" }),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    // RSVP status: "attending" (confirmed), "waitlisted" (event full), "declined"
    status: text("status").notNull().default("attending"), // "attending" | "waitlisted" | "declined"
    // Guest count: 1 = just the user, 2 = user + 1 guest, etc.
    guestCount: integer("guest_count").notNull().default(1),
    // Optional notes: dietary restrictions, allergies, accessibility needs
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Sign-up slots - Categories for potluck coordination
 * Example: "Main dish", "Salad", "Dessert", "Drinks"
 * Each slot can have multiple claims (maxClaims)
 */
export const signUpSlots = pgTable("sign_up_slots", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => randomUUID()),
    eventId: text("event_id")
        .notNull()
        .references(() => events.id, { onDelete: "cascade" }),
    // Slot category name
    slotName: text("slot_name").notNull(), // "Main dish", "Salad", "Dessert"
    // How many people can sign up for this slot (e.g., 3 people can bring salads)
    maxClaims: integer("max_claims").notNull(),
    // Denormalized count of current claims for quick checks
    claimCount: integer("claim_count").notNull().default(0),
    // Optional description/instructions: "Serves 8-10 people"
    description: text("description"),
    // Display order for UI rendering
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Sign-up claims - Who signed up for what slot and what they're bringing
 * Example: Alice claimed "Dessert" slot and is bringing "Chocolate cake"
 */
export const signUpClaims = pgTable("sign_up_claims", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => randomUUID()),
    slotId: text("slot_id")
        .notNull()
        .references(() => signUpSlots.id, { onDelete: "cascade" }),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    // What the user is bringing: "Veggie lasagna", "Caesar salad", etc.
    details: text("details").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Event recurrence patterns - For recurring events (weekly potlucks, etc.)
 * Stores the pattern (frequency, day of week/month) for generating instances
 */
export const eventRecurrence = pgTable("event_recurrence", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => randomUUID()),
    // The original event that serves as template for recurrence
    parentEventId: text("parent_event_id")
        .notNull()
        .references(() => events.id, { onDelete: "cascade" }),
    // Frequency: "daily", "weekly", "biweekly", "monthly"
    frequency: text("frequency").notNull(), // "daily" | "weekly" | "biweekly" | "monthly"
    // For weekly/biweekly: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    dayOfWeek: integer("day_of_week"),
    // For monthly: 1-31 (day of month)
    dayOfMonth: integer("day_of_month"),
    // Interval: every N days/weeks/months (e.g., interval=2 with frequency="weekly" = every 2 weeks)
    interval: integer("interval").notNull().default(1),
    // When to stop generating recurrences (null = no end date)
    endsAt: timestamp("ends_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Event attendance - Check-in tracking for completed events
 * Used for karma calculation and event analytics
 */
export const eventAttendance = pgTable("event_attendance", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => randomUUID()),
    eventId: text("event_id")
        .notNull()
        .references(() => events.id, { onDelete: "cascade" }),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    // When the attendee was checked in by host
    checkedInAt: timestamp("checked_in_at").notNull().defaultNow(),
    // Optional notes from host: "Brought amazing lasagna!"
    notes: text("notes"),
});

/**
 * Provider Claims (Phase 5.2) - Resource ownership claims for admin approval
 * Allows food bank staff/volunteers to claim ownership of their organization's listing
 */
export const providerClaims = pgTable("provider_claims", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => randomUUID()),
    resourceId: text("resource_id")
        .notNull()
        .references(() => foodBanks.id, { onDelete: "cascade" }),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    // Claim lifecycle: pending → approved/rejected/withdrawn
    status: text("status").notNull().default("pending"), // "pending" | "approved" | "rejected" | "withdrawn"
    // User-provided claim justification
    claimReason: text("claim_reason"),
    // Optional verification details (email, phone, etc.) as JSON string
    verificationInfo: text("verification_info"),
    // Admin review metadata
    reviewedBy: text("reviewed_by").references(() => user.id),
    reviewedAt: timestamp("reviewed_at"),
    reviewNotes: text("review_notes"),
    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
    // Performance indices
    resourceIdIdx: index("provider_claims_resource_id_idx").on(table.resourceId),
    userIdIdx: index("provider_claims_user_id_idx").on(table.userId),
    statusIdx: index("provider_claims_status_idx").on(table.status),
    createdAtIdx: index("provider_claims_created_at_idx").on(table.createdAt.desc()),
}));

// Type exports - inferred from table schemas
export type FoodBank = typeof foodBanks.$inferSelect;
export type DiscoveryEvent = typeof discoveryEvents.$inferSelect;
export type Tombstone = typeof tombstone.$inferSelect;
export type UserVerification = typeof userVerifications.$inferSelect;
export type SavedLocation = typeof savedLocations.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Follow = typeof follows.$inferSelect;
export type HelpfulMark = typeof helpfulMarks.$inferSelect;
export type Event = typeof events.$inferSelect;
export type EventRsvp = typeof eventRsvps.$inferSelect;
export type SignUpSlot = typeof signUpSlots.$inferSelect;
export type SignUpClaim = typeof signUpClaims.$inferSelect;
export type EventRecurrence = typeof eventRecurrence.$inferSelect;
export type EventAttendance = typeof eventAttendance.$inferSelect;
export type PointsHistory = typeof pointsHistory.$inferSelect;
export type ProviderClaim = typeof providerClaims.$inferSelect;

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
    // Event-related relations
    hostedEvents: many(events), // Events this user is hosting
    eventRsvps: many(eventRsvps), // Events this user has RSVPed to
    signUpClaims: many(signUpClaims), // Sign-up slots this user has claimed
    eventAttendance: many(eventAttendance), // Events this user has attended
    // Verification relations
    verifications: many(userVerifications),
    triggeredDiscoveries: many(discoveryEvents),
    // Provider claims relations
    providerClaims: many(providerClaims), // Claims submitted by this user
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

// Event Relations
export const eventsRelations = relations(events, ({ one, many }) => ({
    // The feed post associated with this event
    post: one(posts, {
        fields: [events.postId],
        references: [posts.id],
    }),
    // The host (organizer) of the event
    host: one(user, {
        fields: [events.hostId],
        references: [user.id],
    }),
    // Parent event for recurring instances
    parentEvent: one(events, {
        fields: [events.parentEventId],
        references: [events.id],
        relationName: "recurringInstances",
    }),
    // Child instances if this is a recurring event template
    recurringInstances: many(events, { relationName: "recurringInstances" }),
    // All RSVPs for this event
    rsvps: many(eventRsvps),
    // Sign-up slots for potluck coordination
    signUpSlots: many(signUpSlots),
    // Attendance records for completed event
    attendance: many(eventAttendance),
    // Recurrence pattern if this is a recurring event
    recurrence: one(eventRecurrence, {
        fields: [events.recurrenceId],
        references: [eventRecurrence.id],
    }),
}));

export const eventRsvpsRelations = relations(eventRsvps, ({ one }) => ({
    // The event this RSVP is for
    event: one(events, {
        fields: [eventRsvps.eventId],
        references: [events.id],
    }),
    // The user who RSVPed
    user: one(user, {
        fields: [eventRsvps.userId],
        references: [user.id],
    }),
}));

export const signUpSlotsRelations = relations(signUpSlots, ({ one, many }) => ({
    // The event this slot belongs to
    event: one(events, {
        fields: [signUpSlots.eventId],
        references: [events.id],
    }),
    // All claims (user sign-ups) for this slot
    claims: many(signUpClaims),
}));

export const signUpClaimsRelations = relations(signUpClaims, ({ one }) => ({
    // The slot this claim is for
    slot: one(signUpSlots, {
        fields: [signUpClaims.slotId],
        references: [signUpSlots.id],
    }),
    // The user who claimed this slot
    user: one(user, {
        fields: [signUpClaims.userId],
        references: [user.id],
    }),
}));

export const eventRecurrenceRelations = relations(eventRecurrence, ({ one }) => ({
    // The parent event that serves as the recurrence template
    parentEvent: one(events, {
        fields: [eventRecurrence.parentEventId],
        references: [events.id],
    }),
}));

export const eventAttendanceRelations = relations(eventAttendance, ({ one }) => ({
    // The event this attendance record is for
    event: one(events, {
        fields: [eventAttendance.eventId],
        references: [events.id],
    }),
    // The user who attended
    user: one(user, {
        fields: [eventAttendance.userId],
        references: [user.id],
    }),
}));

export const providerClaimsRelations = relations(providerClaims, ({ one }) => ({
    // The resource being claimed
    resource: one(foodBanks, {
        fields: [providerClaims.resourceId],
        references: [foodBanks.id],
    }),
    // The user submitting the claim
    claimer: one(user, {
        fields: [providerClaims.userId],
        references: [user.id],
    }),
    // The admin who reviewed the claim
    reviewer: one(user, {
        fields: [providerClaims.reviewedBy],
        references: [user.id],
    }),
}));

export const userVerificationsRelations = relations(userVerifications, ({ one }) => ({
    resource: one(foodBanks, {
        fields: [userVerifications.resourceId],
        references: [foodBanks.id],
    }),
    user: one(user, {
        fields: [userVerifications.userId],
        references: [user.id],
    }),
}));

export const discoveryEventsRelations = relations(discoveryEvents, ({ one }) => ({
    triggeredBy: one(user, {
        fields: [discoveryEvents.triggeredByUserId],
        references: [user.id],
    }),
}));

/**
 * Resource Versions - Complete change history for every resource
 * Enables rollback and audit trail functionality
 */
export const resourceVersions = pgTable("resource_versions", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => randomUUID()),
    resourceId: text("resource_id")
        .notNull()
        .references(() => foodBanks.id, { onDelete: "cascade" }),
    version: integer("version").notNull(), // 1, 2, 3, etc.

    // Snapshot of full resource at this version
    snapshot: json("snapshot").notNull().$type<Record<string, any>>(),

    // What changed
    changedFields: json("changed_fields").$type<string[]>(),

    // Who changed it
    changedBy: text("changed_by").notNull(), // User ID or "system"
    changeReason: text("change_reason"), // "ai_enhancement" | "admin_edit" | "provider_claim"

    // Source attribution
    sources: json("sources").$type<string[]>(),

    createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Admin Audit Log - Tracks all admin actions for security and compliance
 */
export const adminAuditLog = pgTable("admin_audit_log", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => randomUUID()),
    adminId: text("admin_id")
        .notNull()
        .references(() => user.id),
    action: text("action").notNull(), // "approve" | "reject" | "merge" | "edit" | "delete"
    resourceId: text("resource_id").references(() => foodBanks.id, { onDelete: "set null" }),

    // Batch operations
    affectedIds: json("affected_ids").$type<string[]>(),

    // Change details
    changes: json("changes").$type<Record<string, { old: any; new: any }>>(),
    reason: text("reason"),

    // IP for security audit
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
});
