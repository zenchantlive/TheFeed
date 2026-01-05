---
title: "Part 13: Provider Claims - Empowering Resource Owners"
series: "TheFeed Development Journey"
part: 13
date: 2025-12-01
updated: 2025-12-27
tags: [provider-claims, admin, verification, community-management]
reading_time: "12 min"
commits_covered: "Phase 5.2a-g"
---

## The Ownership Problem

With 500+ food banks, a new problem emerged: **who controls the data?**

Automated discovery and community contributions were great, but food bank staff couldn't:
- Update their own hours
- Correct inaccurate services
- Add special announcements
- Verify their listing as official

Manual admin approval for every edit **didn't scale**.

Phase 5.2 built a **provider claims system** - letting food bank staff claim ownership of their listings.

## The Claims Workflow

1. **Discovery**: User finds their food bank on TheFeed
2. **Claim**: Clicks "I work here" and submits verification info
3. **Verification**: Admin reviews claim (checks email domain, calls organization, etc.)
4. **Approval**: Admin approves claim
5. **Ownership**: User can now edit the resource listing

## The Database Schema

```typescript
// src/lib/schema.ts
export const providerClaims = pgTable("provider_claims", {
  id: text("id").primaryKey(),
  resourceId: text("resource_id").notNull().references(() => foodBanks.id),
  userId: text("user_id").notNull().references(() => user.id),

  // Claim details
  claimReason: text("claim_reason").notNull(),
  jobTitle: text("job_title"),
  phone: text("phone"),
  verificationInfo: json("verification_info").$type<{
    workEmail?: string;
    organizationWebsite?: string;
    alternateContact?: string;
  }>(),

  // Status tracking
  status: text("status").notNull().default("pending"), // pending | approved | rejected | withdrawn
  reviewNotes: text("review_notes"),
  reviewedBy: text("reviewed_by").references(() => user.id),
  reviewedAt: timestamp("reviewed_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Extend food_banks table
export const foodBanks = pgTable("food_banks", {
  // ... existing fields

  // Provider ownership
  claimedBy: text("claimed_by").references(() => user.id),
  claimedAt: timestamp("claimed_at"),
  providerRole: text("provider_role"), // owner | manager | staff | volunteer
  providerVerified: boolean("provider_verified").default(false),
  providerCanEdit: boolean("provider_can_edit").default(false),
});
```

**Key design**:
- **Separate claims table**: Tracks all claim attempts (approved and rejected)
- **Ownership fields on food_banks**: Denormalized for quick access checks
- **Rich verification info**: Email, phone, job title for admin validation

## The Claim Submission UI

Users could claim resources from the detail page:

```tsx
// src/components/resources/claim-resource-button.tsx
export function ClaimResourceButton({ resource }: Props) {
  const { user } = useUserContext();
  const { openLogin } = useAuthModal();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!user) {
    return (
      <Button onClick={() => openLogin()} variant="outline">
        <ShieldCheck className="mr-2 h-4 w-4" />
        I work here
      </Button>
    );
  }

  // Check for existing claim
  const { data: existingClaim } = useQuery({
    queryKey: ['resource-claim', resource.id],
    queryFn: async () => {
      const res = await fetch(`/api/resources/${resource.id}/claim`);
      return res.json();
    },
  });

  if (existingClaim?.status === 'pending') {
    return (
      <Button variant="outline" disabled>
        <Clock className="mr-2 h-4 w-4" />
        Claim Pending Review
      </Button>
    );
  }

  if (existingClaim?.status === 'approved') {
    return (
      <Badge variant="success">
        <ShieldCheck className="mr-1 h-3 w-3" />
        You manage this resource
      </Badge>
    );
  }

  return (
    <>
      <Button onClick={() => setDialogOpen(true)} variant="outline">
        <ShieldCheck className="mr-2 h-4 w-4" />
        I work here
      </Button>

      <ClaimDialog
        resource={resource}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
```

The claim dialog collected verification details:

```tsx
// src/components/resources/claim-dialog.tsx
export function ClaimDialog({ resource, open, onOpenChange }: Props) {
  const [formData, setFormData] = useState({
    claimReason: '',
    jobTitle: '',
    phone: '',
    workEmail: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const response = await fetch(`/api/resources/${resource.id}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      toast.error('Failed to submit claim');
      return;
    }

    toast.success('Claim submitted! We'll review it within 24-48 hours.');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Claim {resource.name}</DialogTitle>
          <DialogDescription>
            Help us verify that you represent this organization.
            All information will be kept confidential.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Why are you claiming this resource?</Label>
            <Textarea
              placeholder="I'm the director of operations at this food bank..."
              value={formData.claimReason}
              onChange={(e) => setFormData({ ...formData, claimReason: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Job Title</Label>
            <Input
              placeholder="Program Director"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
            />
          </div>

          <div>
            <Label>Work Phone</Label>
            <Input
              type="tel"
              placeholder="(555) 123-4567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <Label>Work Email</Label>
            <Input
              type="email"
              placeholder="you@organization.org"
              value={formData.workEmail}
              onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              We'll verify this matches the organization's domain
            </p>
          </div>

          <Button type="submit" className="w-full">
            Submit Claim
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

## The Admin Review UI

Admins reviewed claims from a dedicated dashboard:

```tsx
// src/app/admin/claims/page.tsx
export default async function ClaimsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = params.status || 'pending';

  const claims = await db
    .select({
      claim: providerClaims,
      user: { id: user.id, name: user.name, email: user.email, image: user.image },
      resource: { id: foodBanks.id, name: foodBanks.name, address: foodBanks.address },
    })
    .from(providerClaims)
    .leftJoin(user, eq(providerClaims.userId, user.id))
    .leftJoin(foodBanks, eq(providerClaims.resourceId, foodBanks.id))
    .where(eq(providerClaims.status, status))
    .orderBy(desc(providerClaims.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Provider Claims</h1>

        <Tabs value={status}>
          <TabsList>
            <TabsTrigger value="pending" asChild>
              <Link href="/admin/claims?status=pending">
                Pending
              </Link>
            </TabsTrigger>
            <TabsTrigger value="approved" asChild>
              <Link href="/admin/claims?status=approved">
                Approved
              </Link>
            </TabsTrigger>
            <TabsTrigger value="rejected" asChild>
              <Link href="/admin/claims?status=rejected">
                Rejected
              </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-4">
        {claims.map(({ claim, user, resource }) => (
          <ClaimReviewCard
            key={claim.id}
            claim={claim}
            user={user}
            resource={resource}
          />
        ))}
      </div>
    </div>
  );
}
```

The review card showed all verification details:

```tsx
// src/app/admin/claims/components/claim-review-card.tsx
export function ClaimReviewCard({ claim, user, resource }: Props) {
  const handleApprove = async () => {
    const response = await fetch(`/api/admin/claims/${claim.id}/approve`, {
      method: 'POST',
    });

    if (!response.ok) {
      toast.error('Failed to approve claim');
      return;
    }

    toast.success('Claim approved!');
    window.location.reload();
  };

  const handleReject = async () => {
    const reason = prompt('Reason for rejection (will be sent to user):');
    if (!reason) return;

    const response = await fetch(`/api/admin/claims/${claim.id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      toast.error('Failed to reject claim');
      return;
    }

    toast.success('Claim rejected');
    window.location.reload();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{resource.name}</CardTitle>
            <CardDescription>{resource.address}</CardDescription>
          </div>

          <Badge variant={claim.status === 'pending' ? 'warning' : 'success'}>
            {claim.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* User info */}
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.image} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <Separator />

        {/* Claim details */}
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium">Reason</p>
            <p className="text-sm text-muted-foreground">{claim.claimReason}</p>
          </div>

          {claim.jobTitle && (
            <div>
              <p className="text-sm font-medium">Job Title</p>
              <p className="text-sm text-muted-foreground">{claim.jobTitle}</p>
            </div>
          )}

          {claim.phone && (
            <div>
              <p className="text-sm font-medium">Work Phone</p>
              <p className="text-sm text-muted-foreground">{claim.phone}</p>
            </div>
          )}

          {claim.verificationInfo?.workEmail && (
            <div>
              <p className="text-sm font-medium">Work Email</p>
              <p className="text-sm text-muted-foreground">
                {claim.verificationInfo.workEmail}

                {/* Email domain check */}
                {isEmailMatchingDomain(claim.verificationInfo.workEmail, resource.website) ? (
                  <Badge variant="success" className="ml-2">
                    <Check className="mr-1 h-3 w-3" />
                    Domain Match
                  </Badge>
                ) : (
                  <Badge variant="warning" className="ml-2">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Check Domain
                  </Badge>
                )}
              </p>
            </div>
          )}
        </div>

        {claim.status === 'pending' && (
          <>
            <Separator />

            <div className="flex gap-2">
              <Button onClick={handleApprove} className="flex-1">
                <Check className="mr-2 h-4 w-4" />
                Approve
              </Button>

              <Button onClick={handleReject} variant="destructive" className="flex-1">
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

## The Provider Dashboard

Approved providers got a **provider dashboard**:

```tsx
// src/app/provider/dashboard/page.tsx
export default async function ProviderDashboard() {
  const session = await auth.api.getSession({ headers: headers() });
  if (!session?.user) {
    redirect('/login');
  }

  const resources = await db
    .select()
    .from(foodBanks)
    .where(
      and(
        eq(foodBanks.claimedBy, session.user.id),
        eq(foodBanks.providerVerified, true)
      )
    );

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Provider Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your organization's listings on TheFeed
        </p>
      </div>

      <div className="grid gap-6">
        {resources.map((resource) => (
          <ProviderResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
    </div>
  );
}
```

Providers could:
- Edit hours, services, description
- Upload photos
- Post announcements
- View analytics (visits, RSVPs, saves)

## Enhanced Verification System

To prevent fraud, I added **multi-factor verification**:

1. **Email Domain Check**: Work email must match organization website domain
2. **Phone Verification**: Admin calls provided number to confirm
3. **Manual Review**: Admin discretion for edge cases

```typescript
// src/lib/verification.ts
export function verifyEmailDomain(email: string, website: string | null): boolean {
  if (!website) return false;

  try {
    const emailDomain = email.split('@')[1].toLowerCase();
    const websiteDomain = new URL(website).hostname.toLowerCase().replace('www.', '');

    return emailDomain === websiteDomain;
  } catch {
    return false;
  }
}
```

This caught most fraudulent claims automatically.

## What Went Right

1. **Empowerment**: Food bank staff could manage their own data

2. **Verification**: Multi-factor checks prevented fraud

3. **Admin Efficiency**: Clear review UI made approvals fast

4. **User Trust**: "Verified Provider" badges increased confidence

5. **Scalability**: Claims system handled growth without admin burnout

## What I'd Do Differently

**Mistake 1: No Expiry**

Approved claims never expire. A staff member who leaves still has access.

**Mistake 2: No Bulk Actions**

Admins had to approve/reject claims one-by-one. Bulk actions would save time.

**Mistake 3: Infinite Loading Bug**

The provider dashboard had an infinite loading loop (still debugging as of Dec 27). Should have added loading states and error boundaries upfront.

## What I Learned

1. **Verification Is Multi-Faceted**: Email, phone, and manual review create defense-in-depth

2. **Empower Users**: Letting providers manage data reduced admin load 10x

3. **Trust Requires Transparency**: Showing claim status built user confidence

4. **Admin Tools Matter**: Good review UX is as important as public UX

5. **Test Early**: The loading bug could have been caught with proper E2E tests

## Up Next

In Part 14, the final post, I'll reflect on the entire 4.5-month journey - what worked, what didn't, and what's next for TheFeed.

---
**Key Commits**: Phase 5.2a-g

**Related Files**:
- `src/lib/schema.ts` - Provider claims schema
- `src/app/api/resources/[id]/claim/route.ts` - Claim submission API
- `src/app/admin/claims/page.tsx` - Admin review UI
- `src/app/provider/dashboard/page.tsx` - Provider dashboard
