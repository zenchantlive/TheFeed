## PHASE 3: TRUST & UX (Week 5-6) - 📋 NEXT

**Goal:** Build user trust with verification indicators and improve data contribution flows
**Success Metrics:**
- Verification badges visible on all resources
- 10+ user-submitted data improvements per week
- 90%+ user satisfaction with missing data CTAs

**Status:** Ready to begin after Phase 1 & 2 completion

### Tasks

#### 3.1 Public Verification Badges

**Files to create:**
- `/src/components/foodshare/verification-badge.tsx`
- `/src/components/ui/tooltip.tsx` (if not exists)

**Implementation:** See detailed code in PART 1 section above

**Update locations:**
- `/src/components/foodshare/location-card.tsx` - Add badge to header
- `/src/components/map/LocationPopup.tsx` - Add badge to popup
- `/src/app/map/pageClient.tsx` - Pass verification status to components

**Acceptance Criteria:**
- [x] Badge shows on location cards
- [x] Badge shows on map popup
- [x] Tooltip explains verification level
- [x] Badge color matches verification tier
- [x] Mobile-friendly badge sizing

---

#### 3.2 Source Attribution Display

**Files to create:**
- `/src/components/foodshare/sources-section.tsx`

**Implementation:** See detailed code in PART 1 section above

**Schema update:**
```sql
-- Add to migration
ALTER TABLE food_banks
ADD COLUMN sources JSONB,
ADD COLUMN discovery_method TEXT,
ADD COLUMN discovered_by TEXT;
```

**Update discovery pipeline:**
```typescript
// File: /src/app/api/discovery/trigger/route.ts
await db.insert(foodBanks).values({
  ...normalized,
  sources: [normalized.sourceUrl], // Track original source
  discoveryMethod: "tavily_scan",
  discoveredBy: userId,
});
```

**Acceptance Criteria:**
- [x] Sources visible in accordion on resource detail
- [x] Source URLs clickable and open in new tab
- [x] Friendly names for known sources (Feeding America, 211, etc.)
- [x] Last updated timestamp shown
- [x] Discovery method indicated

---

#### 3.3 Data Completeness Indicator

**Files to create:**
- `/src/components/foodshare/completeness-indicator.tsx`

**Implementation:** See detailed code in PART 1 section above

**Add to schema for tracking:**
```typescript
// Add computed field helper
export function calculateResourceCompleteness(resource: {
  phone: string | null;
  website: string | null;
  hours: any;
  description: string | null;
  services: string[] | null;
}): number {
  const fields = [
    resource.phone,
    resource.website,
    resource.hours,
    resource.description,
    resource.services?.length
  ];

  const filled = fields.filter(f => f != null).length;
  return Math.round((filled / fields.length) * 100);
}
```

**Acceptance Criteria:**
- [x] Completeness bar shows on resource cards
- [x] Percentage accurate (0-100%)
- [x] Color-coded (green >80%, yellow >50%, gray <50%)
- [x] Optional detailed view shows missing fields
- [ ] Admin dashboard can filter by completeness

---

#### 3.4 Missing Data Contribution Flow

**Files to create:**
- `/src/components/foodshare/missing-info-button.tsx`
- `/src/app/api/resources/suggest-update/route.ts`

**Implementation:** See detailed code in PART 2 section above

**Schema:**
```sql
CREATE TABLE user_suggestions (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL REFERENCES food_banks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  field TEXT NOT NULL, -- 'phone' | 'website' | 'hours' | 'description'
  value TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  reviewed_by TEXT REFERENCES user(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_suggestions_status ON user_suggestions(status);
CREATE INDEX idx_user_suggestions_resource ON user_suggestions(resource_id);
```

**Admin review UI:**
```tsx
// File: /src/app/admin/suggestions/page.tsx
export default async function SuggestionsPage() {
  const suggestions = await db
    .select()
    .from(userSuggestions)
    .where(eq(userSuggestions.status, "pending"))
    .orderBy(userSuggestions.createdAt.desc());

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">User Suggestions</h1>

      {suggestions.map(suggestion => (
        <Card key={suggestion.id}>
          <CardHeader>
            <CardTitle>{suggestion.field}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">{suggestion.value}</p>

            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  // Apply suggestion to resource
                  await fetch(`/api/admin/resources/${suggestion.resourceId}`, {
                    method: "PUT",
                    body: JSON.stringify({ [suggestion.field]: suggestion.value })
                  });

                  // Mark as approved
                  await fetch(`/api/admin/suggestions/${suggestion.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({ status: "approved" })
                  });

                  window.location.reload();
                }}
              >
                Approve & Apply
              </Button>

              <Button
                variant="outline"
                onClick={async () => {
                  await fetch(`/api/admin/suggestions/${suggestion.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({ status: "rejected" })
                  });

                  window.location.reload();
                }}
              >
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] "Add phone" / "Add website" / "Add hours" buttons visible
- [ ] Dialog opens for authenticated users
- [ ] Suggestions stored in database
- [ ] Admin can approve/reject suggestions
- [ ] User gets points for approved suggestions
- [ ] Email notification on approval (optional)

---

#### 3.5 Mobile-First Progressive Disclosure

**File:** `/src/components/foodshare/location-card-mobile.tsx` (new)

```tsx
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Phone, Globe, Clock, MapPin, Navigation } from "lucide-react";
import { VerificationBadge } from "./verification-badge";

export function LocationCardMobile({ location, distance }: any) {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${location.address}, ${location.city}, ${location.state} ${location.zipCode}`
  )}`;

  return (
    <Card className="rounded-2xl">
      {/* Always visible - critical info */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg line-clamp-2">
              {location.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <VerificationBadge
                status={location.verificationStatus}
                lastVerified={location.adminVerifiedAt}
              />
            </div>
          </div>

          <Badge variant={location.isOpen ? "default" : "secondary"}>
            {location.isOpen ? "Open" : "Closed"}
          </Badge>
        </div>

        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mr-1.5 shrink-0" />
          <span className="line-clamp-1">
            {location.address}, {location.city}
          </span>
        </div>

        {distance && (
          <p className="text-xs font-medium text-muted-foreground">
            {distance.toFixed(1)} miles away
          </p>
        )}

        {/* Primary actions - one tap */}
        <div className="grid grid-cols-2 gap-2">
          <Button asChild className="w-full">
            <a href={directionsUrl} target="_blank" rel="noreferrer">
              <Navigation className="h-4 w-4 mr-2" />
              Directions
            </a>
          </Button>

          {location.phone && (
            <Button asChild variant="outline" className="w-full">
              <a href={`tel:${location.phone}`}>
                <Phone className="h-4 w-4 mr-2" />
                Call
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Progressive disclosure - expandable sections */}
      <Accordion type="single" collapsible className="border-t">
        <AccordionItem value="hours" className="border-none px-4">
          <AccordionTrigger className="text-sm py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>Hours</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            {location.hours ? (
              <div className="space-y-1 text-sm">
                {Object.entries(location.hours).map(([day, hours]: any) => (
                  <div key={day} className="flex items-center justify-between">
                    <span className="capitalize text-muted-foreground">{day}</span>
                    <span className="font-medium">
                      {hours?.closed ? "Closed" : `${hours?.open} - ${hours?.close}`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Hours not available</p>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="services" className="border-none px-4">
          <AccordionTrigger className="text-sm py-3 hover:no-underline">
            Services Offered
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="flex flex-wrap gap-2">
              {location.services?.map((service: string) => (
                <Badge key={service} variant="outline">
                  {service}
                </Badge>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {location.description && (
          <AccordionItem value="about" className="border-none px-4">
            <AccordionTrigger className="text-sm py-3 hover:no-underline">
              About
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <p className="text-sm text-muted-foreground">
                {location.description}
              </p>
            </AccordionContent>
          </AccordionItem>
        )}

        {location.website && (
          <AccordionItem value="website" className="border-none px-4">
            <AccordionTrigger className="text-sm py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <span>Website</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <Button asChild variant="outline" className="w-full">
                <a href={location.website} target="_blank" rel="noreferrer">
                  Visit Website
                </a>
              </Button>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </Card>
  );
}
```

**Responsive switching:**
```tsx
// File: /src/components/foodshare/location-card.tsx
import { LocationCardMobile } from "./location-card-mobile";

export function LocationCard(props: LocationCardProps) {
  return (
    <>
      {/* Mobile */}
      <div className="lg:hidden">
        <LocationCardMobile {...props} />
      </div>

      {/* Desktop */}
      <div className="hidden lg:block">
        {/* Existing full LocationCard */}
      </div>
    </>
  );
}
```

**Acceptance Criteria:**
- [ ] Mobile card shows critical info first
- [ ] Directions/Call buttons one-tap accessible
- [ ] Hours/services hidden in accordion
- [ ] Accordion smooth expand/collapse
- [ ] Works on iOS Safari and Android Chrome

---

### Phase 3 Deliverables Checklist

- [x] **3.1** Verification badges visible on all resources
- [x] **3.2** Source attribution shown
- [x] **3.3** Completeness indicator added
- [ ] **3.4** User suggestion flow working
- [ ] **3.5** Mobile progressive disclosure implemented
- [ ] User testing completed
- [ ] Mobile performance optimized (<3s load)

**Estimated Effort:** 18-22 hours
**Required Skills:** React, UI/UX, mobile optimization

---

