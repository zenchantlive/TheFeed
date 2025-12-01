## PHASE 5: COMMUNITY ENGAGEMENT (Optional - Week 9-10)

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

**Claim flow:**
```tsx
// File: /src/components/foodshare/claim-resource-button.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ClaimResourceButton({ resourceId }: { resourceId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/resources/${resourceId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error("Failed to submit claim");

      setIsOpen(false);
      alert("Verification email sent! Check your inbox.");
    } catch (error) {
      alert("Failed to submit claim. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Is this your organization?
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Claim this listing</DialogTitle>
          <DialogDescription>
            Verify ownership by entering your organization's email address.
            We'll send a verification link to confirm.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Organization Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@yourorg.org"
            />
            <p className="text-xs text-muted-foreground">
              Must be an official email from your organization's domain
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!email || isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Verification"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**API endpoint:**
```typescript
// File: /src/app/api/resources/[id]/claim/route.ts
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { email } = await req.json();
  const resourceId = params.id;

  // Get resource
  const [resource] = await db
    .select()
    .from(foodBanks)
    .where(eq(foodBanks.id, resourceId));

  if (!resource) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  // Validate email domain matches resource (optional)
  const emailDomain = email.split("@")[1];
  const resourceDomain = resource.website
    ? new URL(resource.website).hostname.replace("www.", "")
    : null;

  if (resourceDomain && emailDomain !== resourceDomain) {
    return NextResponse.json(
      { error: "Email domain must match organization website" },
      { status: 400 }
    );
  }

  // Generate verification code
  const verificationCode = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Store claim
  await db.insert(providerClaims).values({
    resourceId,
    email,
    verificationCode,
    expiresAt,
  });

  // Send verification email
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-claim?code=${verificationCode}`;

  await sendEmail({
    to: email,
    subject: "Verify your TheFeed listing claim",
    html: `
      <h1>Claim your listing</h1>
      <p>Click the link below to verify ownership of <strong>${resource.name}</strong>:</p>
      <a href="${verifyUrl}">${verifyUrl}</a>
      <p>This link expires in 24 hours.</p>
    `,
  });

  return NextResponse.json({ success: true });
}
```

**Verification page:**
```tsx
// File: /src/app/verify-claim/page.tsx
export default async function VerifyClaimPage({
  searchParams,
}: {
  searchParams: { code: string };
}) {
  const code = searchParams.code;

  const [claim] = await db
    .select()
    .from(providerClaims)
    .where(eq(providerClaims.verificationCode, code));

  if (!claim || claim.expiresAt < new Date()) {
    return (
      <div className="container mx-auto py-12">
        <h1 className="text-2xl font-bold">Invalid or expired claim link</h1>
      </div>
    );
  }

  // Mark as verified
  await db
    .update(providerClaims)
    .set({
      status: "verified",
      verifiedAt: new Date(),
    })
    .where(eq(providerClaims.id, claim.id));

  // Update resource
  await db
    .update(foodBanks)
    .set({
      verificationStatus: "provider_claimed",
    })
    .where(eq(foodBanks.id, claim.resourceId));

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-2xl font-bold">Claim verified!</h1>
      <p>You can now manage this listing from your provider dashboard.</p>
      <Button asChild className="mt-4">
        <a href="/provider/dashboard">Go to Dashboard</a>
      </Button>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] "Claim this listing" button visible
- [ ] Verification email sent to organization email
- [ ] Email link claims listing
- [ ] Resource marked as "provider_claimed"
- [ ] Provider can edit their listing

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

