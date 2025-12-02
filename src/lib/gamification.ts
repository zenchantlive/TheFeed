import { db } from "@/lib/db";
import { userProfiles, pointsHistory } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

export const POINTS = {
    SUBMIT_RESOURCE: 50,
    VERIFY_RESOURCE: 10,
    ADD_PHOTO: 5,
    ADD_HOURS: 15,
    UPDATE_CLOSED_STATUS: 20,
    CREATE_POST: 5,
    HELPFUL_MARK_RECEIVED: 2,
    COMMENT: 1,
    HOST_EVENT: 100,
    ATTEND_EVENT: 10,
    FULFILL_SIGNUP_SLOT: 25,
    FALSE_REPORT: -50,
    SPAM_SUBMISSION: -100,
} as const;

export type PointAction = keyof typeof POINTS;

export const BADGES = {
    first_steps: {
        id: "first_steps",
        name: "First Steps",
        description: "Submit your first resource",
        icon: "🌱",
    },
    community_hero: {
        id: "community_hero",
        name: "Community Hero",
        description: "Verify 10 resources",
        icon: "🦸",
    },
    trusted_source: {
        id: "trusted_source",
        name: "Trusted Source",
        description: "90%+ accuracy on 20+ verifications",
        icon: "✅",
    },
    event_champion: {
        id: "event_champion",
        name: "Event Champion",
        description: "Host 5 events",
        icon: "🎉",
    },
} as const;

export async function awardPoints(
    userId: string,
    action: PointAction,
    metadata?: Record<string, any>
) {
    const points = POINTS[action];

    await db.transaction(async (tx) => {
        // We select the current points and level first to determine the new level.
        const [currentProfile] = await tx
            .select({ points: userProfiles.points, level: userProfiles.level })
            .from(userProfiles)
            .where(eq(userProfiles.userId, userId));

        if (!currentProfile) {
            // Optionally, handle case where user profile doesn't exist, maybe create it.
            // For now, we'll exit if no profile is found.
            console.warn(`User profile not found for userId: ${userId}. Skipping point award.`);
            return;
        }

        const newPoints = currentProfile.points + points;
        const newLevel = calculateLevel(newPoints);

        await tx
            .update(userProfiles)
            .set({
                points: newPoints,
                level: newLevel > currentProfile.level ? newLevel : currentProfile.level,
            })
            .where(eq(userProfiles.userId, userId));

        // Log points transaction
        await tx.insert(pointsHistory).values({
            userId,
            action,
            points,
            metadata,
        });
    });
}

export function calculateLevel(points: number): number {
    // Level 1: 0-99
    // Level 2: 100-249
    // Level 3: 250-499
    // Level 4: 500-999
    // Level 5: 1000+
    if (points >= 1000) return 5;
    if (points >= 500) return 4;
    if (points >= 250) return 3;
    if (points >= 100) return 2;
    return 1;
}

export async function awardBadge(userId: string, badgeId: string) {
    const [profile] = await db
        .select({ badges: userProfiles.badges })
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId));

    if (!profile) return;

    const currentBadges = Array.isArray(profile.badges) ? profile.badges : [];
    if (currentBadges.includes(badgeId)) return; // Already has badge

    await db
        .update(userProfiles)
        .set({
            badges: [...currentBadges, badgeId],
        })
        .where(eq(userProfiles.userId, userId));

    // TODO: Send notification
}
