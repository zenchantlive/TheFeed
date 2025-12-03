## PHASE 5: COMMUNITY ENGAGEMENT (ACTIVE - December 2025)

**Status:** 1/12 subphases complete ✅
**Branch:** `feat/phase-5.1a-points-indices` (current), merging to `phase-5`
**Detailed Plan:** `/home/zenchant/.claude/plans/purrfect-forging-avalanche.md`

**Progress Tracker:**
- ✅ 5.1a: Database indices for gamification (commit 44d8611)
- 🔄 5.1b: Points integration (NEXT)
- ⏳ 5.1c-5.1f: Badge system, verification, leaderboard, profile
- ⏳ 5.2a-5.2f: Provider claims workflow (admin approval, no email)

---

**Goal:** Incentivize quality contributions
**Success Metrics:**
- 50+ active contributors per month
- 10+ user-submitted resources per week
- 90%+ approval rate on suggestions

### Tasks

#### 5.1 Gamification System

**Schema:**
```sql
ALTER TABLE user_profiles
ADD COLUMN points INTEGER DEFAULT 0,
ADD COLUMN level INTEGER DEFAULT 1,
ADD COLUMN badges JSONB DEFAULT '[]'::jsonb,
ADD COLUMN verification_count INTEGER DEFAULT 0,
ADD COLUMN accuracy_score DECIMAL(3,2) DEFAULT 0.00;

CREATE INDEX idx_user_profiles_points ON user_profiles(points DESC);
CREATE INDEX idx_user_profiles_level ON user_profiles(level DESC);
```

**Points system:**
```typescript
// File: /src/lib/gamification.ts
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
};

export async function awardPoints(
  userId: string,
  action: keyof typeof POINTS,
  metadata?: Record<string, any>
) {
  const points = POINTS[action];

  await db
    .update(userProfiles)
    .set({
      points: sql`${userProfiles.points} + ${points}`,
    })
    .where(eq(userProfiles.userId, userId));

  // Check for level up
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId));

  const newLevel = calculateLevel(profile.points);
  if (newLevel > profile.level) {
    await db
      .update(userProfiles)
      .set({ level: newLevel })
      .where(eq(userProfiles.userId, userId));

    // Award level-up badge
    await awardBadge(userId, `level_${newLevel}`);
  }

  // Log points transaction
  await db.insert(pointsHistory).values({
    userId,
    action,
    points,
    metadata,
  });
}

function calculateLevel(points: number): number {
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
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId));

  const badges = profile.badges || [];
  if (badges.includes(badgeId)) return; // Already has badge

  await db
    .update(userProfiles)
    .set({
      badges: [...badges, badgeId],
    })
    .where(eq(userProfiles.userId, userId));

  // TODO: Send notification
}
```

**Badges:**
```typescript
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
  // ... more badges
};
```

**Leaderboard:**
```tsx
// File: /src/components/community/leaderboard.tsx
export async function Leaderboard({ period }: { period: "week" | "month" | "alltime" }) {
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
        <CardTitle>Top Contributors ({period})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaders.map((leader, idx) => (
            <div key={leader.userId} className="flex items-center gap-3">
              <div className="text-2xl font-bold text-muted-foreground">
                #{idx + 1}
              </div>
              <Avatar>
                <AvatarImage src={leader.image} />
                <AvatarFallback>{leader.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">{leader.name}</div>
                <div className="text-xs text-muted-foreground">
                  Level {leader.level} • {leader.points} points
                </div>
              </div>
              <div className="flex gap-1">
                {leader.badges?.slice(0, 3).map((badgeId: string) => (
                  <span key={badgeId} className="text-lg">
                    {BADGES[badgeId as keyof typeof BADGES]?.icon}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Acceptance Criteria:**
- [ ] Points awarded for contributions
- [ ] Levels calculated automatically
- [ ] Badges unlocked on milestones
- [ ] Leaderboard visible on community page
- [ ] User profile shows points/level/badges

---

#### 5.2 Provider Claim Workflow

**Schema:**
```sql
CREATE TABLE provider_claims (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL REFERENCES food_banks(id) ON DELETE CASCADE,
  email TEXT NOT NULL, -- Email to verify
  verification_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'verified' | 'expired'
  claimed_by TEXT REFERENCES user(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_provider_claims_resource ON provider_claims(resource_id);
CREATE INDEX idx_provider_claims_email ON provider_claims(email);
```

**Claim flow (Implemented - Admin Approval):**
1. User clicks "Claim this Listing" on resource page.
2. Fills out `ClaimResourceDialog` with Job Title, Work Phone, Verification Method.
3. `POST /api/claims` creates a `pending` claim in `provider_claims`.
4. Admin reviews claim in `/admin/claims`.
5. Admin approves -> User becomes `owner` of the resource.

**Provider Dashboard (Next Step):**
- Route: `/provider/dashboard`
- Features:
  - List of managed resources.
  - "Edit Resource" form (update hours, services, description).
  - View basic stats (optional).

**Acceptance Criteria:**
- [x] "Claim this listing" button visible
- [x] Enhanced verification form (Job Title, Phone)
- [x] Admin review workflow (Approve/Reject)
- [x] Resource marked as "provider_claimed" upon approval
- [ ] Provider can edit their listing (Implemented but page hangs/infinite loads)

**Next Session Goal:**
- Debug and fix the infinite loading issue on `/provider/dashboard`.
- Verify the edit flow end-to-end manually.

---

### Phase 5 Deliverables Checklist

- [ ] **5.1** Gamification system active
- [ ] **5.2** Provider claim workflow working
- [ ] Leaderboard visible on community page
- [ ] Email templates created
- [ ] User onboarding flow updated

**Estimated Effort:** 20-24 hours
**Required Skills:** Full-stack, email integration, UI/UX

---

