import { db } from "@/lib/db";
import { userProfiles, user } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BADGES } from "@/lib/gamification";

export async function Leaderboard({ period }: { period: "week" | "month" | "alltime" }) {
    // TODO: Implement period filtering (requires pointsHistory aggregation)
    // For now, we'll just show all-time leaders based on total points

    const leaders = await db
        .select({
            userId: userProfiles.userId,
            name: user.name,
            image: user.image,
            points: userProfiles.points,
            level: userProfiles.level,
            badges: userProfiles.badges,
        })
        .from(userProfiles)
        .innerJoin(user, eq(userProfiles.userId, user.id))
        .orderBy(desc(userProfiles.points))
        .limit(10);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Top Contributors</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {leaders.map((leader, idx) => (
                        <div key={leader.userId} className="flex items-center gap-3">
                            <div className="text-2xl font-bold text-muted-foreground w-8 text-center">
                                #{idx + 1}
                            </div>
                            <Avatar>
                                <AvatarImage src={leader.image || undefined} />
                                <AvatarFallback>{leader.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="font-medium">{leader.name}</div>
                                <div className="text-xs text-muted-foreground">
                                    Level {leader.level} • {leader.points} points
                                </div>
                            </div>
                            <div className="flex gap-1">
                                {Array.isArray(leader.badges) && leader.badges.slice(0, 3).map((badgeId: string) => {
                                    const badge = BADGES[badgeId as keyof typeof BADGES];
                                    if (!badge) return null;
                                    return (
                                        <span key={badgeId} className="text-lg" title={badge.name}>
                                            {badge.icon}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
