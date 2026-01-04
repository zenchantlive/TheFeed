---
title: "Part 11: The UX Redesign - Glassmorphic Auth and Mobile-First"
series: "TheFeed Development Journey"
part: 11
date: 2025-12-07
updated: 2025-12-27
tags: [ux, mobile, design, authentication, components]
reading_time: "13 min"
commits_covered: "5d5347d..d2e0661"
---

## The UX Wake-Up Call

Production was live. Users could sign in, browse resources, and create posts.

But the experience was **clunky**:
- Sign-in redirected to a separate page (jarring)
- Map popups covered half the mobile screen
- Creating events/posts required separate flows
- Mobile navigation felt like an afterthought

December 7th began a **UX overhaul sprint**. Three days of intensive redesign.

## The Glassmorphic Auth Modal

### The Problem

Legacy auth flow:

1. User clicks "Sign In"
2. Page redirects to `/login`
3. User signs in with Google
4. Redirects back to original page

This **broke context**. If you were reading a post and wanted to comment, the redirect lost your place.

### The Solution

A **global authentication modal** using React Context:

```tsx
// src/components/auth/auth-modal-context.tsx
const AuthModalContext = createContext<{
  isOpen: boolean;
  openLogin: (returnUrl?: string) => void;
  closeLogin: () => void;
}>({
  isOpen: false,
  openLogin: () => {},
  closeLogin: () => {},
});

export function AuthModalProvider({ children }: { children: React.Node }) {
  const [isOpen, setIsOpen] = useState(false);
  const [returnUrl, setReturnUrl] = useState<string | null>(null);
  const router = useRouter();

  const openLogin = (url?: string) => {
    const finalUrl = url || window.location.href;
    setReturnUrl(finalUrl);
    setIsOpen(true);
  };

  const closeLogin = () => {
    setIsOpen(false);
    if (returnUrl) {
      router.push(returnUrl);
    }
  };

  return (
    <AuthModalContext.Provider value={{ isOpen, openLogin, closeLogin }}>
      {children}
      <AuthModal open={isOpen} onOpenChange={setIsOpen} returnUrl={returnUrl} />
    </AuthModalContext.Provider>
  );
}

export const useAuthModal = () => useContext(AuthModalContext);
```

Now, anywhere in the app:

```tsx
const { openLogin } = useAuthModal();

<Button onClick={() => openLogin(`/community/posts/${postId}#comments`)}>
  Reply
</Button>
```

Clicking "Reply" **while logged out** showed the modal, not a redirect. After signing in, the user landed exactly where they left off.

### The Glassmorphic Design

The modal itself used **glassmorphism** - translucent backgrounds with blur effects:

```tsx
// src/components/auth/auth-modal.tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="glassmorphic max-w-md">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-background/5 rounded-lg blur-xl" />

    <div className="relative z-10 space-y-6">
      <div className="text-center space-y-2">
        <Utensils className="h-12 w-12 mx-auto text-primary" />
        <DialogTitle className="text-2xl font-bold">Welcome to TheFeed</DialogTitle>
        <DialogDescription>
          Sign in to share food, connect with neighbors, and build community.
        </DialogDescription>
      </div>

      <Button
        onClick={() => signIn.social({ provider: "google" })}
        className="w-full glassmorphic-button"
        size="lg"
      >
        <GoogleIcon className="mr-2 h-5 w-5" />
        Continue with Google
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        By signing in, you agree to our Terms and Privacy Policy.
      </p>
    </div>
  </DialogContent>
</Dialog>
```

CSS for glassmorphism:

```css
/* globals.css */
.glassmorphic {
  @apply bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl;
}

.glassmorphic-button {
  @apply bg-background/60 backdrop-blur-md hover:bg-background/80 transition-all;
}
```

**Result**: A **modern, non-intrusive** sign-in experience.

## Mobile-First Map Interaction

### The Problem

Map popups on mobile were **terrible**:

- Covered 50% of screen
- Tap outside to close wasn't obvious
- Scrolling between resources was awkward
- No quick actions (RSVP, directions)

### The Solution: Bottom Sheet

Inspired by Google Maps, I implemented a **bottom sheet** pattern:

```tsx
// src/components/map/resource-bottom-sheet.tsx
import { Drawer } from "vaul";

export function ResourceBottomSheet({ resources, selectedResource, onSelect }: Props) {
  const [snap, setSnap] = useState<"peek" | "half" | "full">("peek");

  return (
    <Drawer open={!!selectedResource} onClose={() => onSelect(null)} snapPoints={[0.15, 0.5, 0.9]}>
      <DrawerContent>
        {/* Peek view: Just name and distance */}
        {snap === "peek" && (
          <div className="p-4" onClick={() => setSnap("half")}>
            <h3 className="font-semibold">{selectedResource.name}</h3>
            <p className="text-sm text-muted-foreground">
              {selectedResource.distance.toFixed(1)} miles away • Tap for details
            </p>
          </div>
        )}

        {/* Half view: Key info + actions */}
        {snap === "half" && (
          <div className="p-4 space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{selectedResource.name}</h3>
              <p className="text-sm text-muted-foreground">{selected Resource.address}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button asChild>
                <a href={getDirectionsUrl(selectedResource)}>
                  <Navigation className="mr-2 h-4 w-4" />
                  Directions
                </a>
              </Button>

              {selectedResource.phone && (
                <Button variant="outline" asChild>
                  <a href={`tel:${selectedResource.phone}`}>
                    <Phone className="mr-2 h-4 w-4" />
                    Call
                  </a>
                </Button>
              )}
            </div>

            <Button variant="ghost" className="w-full" onClick={() => setSnap("full")}>
              See Full Details
            </Button>
          </div>
        )}

        {/* Full view: Everything */}
        {snap === "full" && (
          <div className="p-4 pb-safe space-y-6 h-full overflow-y-auto">
            <CompactResourceCard resource={selectedResource} showFullDetails />
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
```

**Interaction flow**:
1. **Peek** (15% height): Name and distance
2. **Half** (50% height): Key info + action buttons
3. **Full** (90% height): Complete details

Swiping up/down transitions between states. **Intuitive and familiar** to mobile users.

## Unified Creation Drawer

### The Problem

Creating posts and events had **separate UIs**:
- Posts: Modal dialog
- Events: Multi-step wizard in separate page

Users had to remember which flow for what.

### The Solution

A **unified creation drawer** accessible from:
- Desktop header
- Mobile bottom navigation
- FAB (floating action button) on community page

```tsx
// src/components/creation/unified-creation-drawer.tsx
export function UnifiedCreationDrawer() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"post" | "event">("post");

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button size="lg" className="glassmorphic-button">
          <Plus className="mr-2" />
          Create
        </Button>
      </DrawerTrigger>

      <DrawerContent className="max-h-[90vh]">
        <div className="p-4 space-y-4">
          {/* Mode selector */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as "post" | "event")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="post">
                <MessageSquare className="mr-2 h-4 w-4" />
                Post
              </TabsTrigger>
              <TabsTrigger value="event">
                <Calendar className="mr-2 h-4 w-4" />
                Event
              </TabsTrigger>
            </TabsList>

            <TabsContent value="post">
              <PostComposer onSuccess={() => setOpen(false)} />
            </TabsContent>

            <TabsContent value="event">
              <EventCreationModal onSuccess={() => setOpen(false)} />
            </TabsContent>
          </Tabs>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
```

**One button, two creation flows**. Simplified mental model.

## Event Creation Refactor

The multi-step wizard was replaced with a **single-page modal**:

```tsx
// src/components/events/create-event-modal.tsx
export function CreateEventModal({ onSuccess }: Props) {
  const { user, coords } = useUserContext();
  const [formData, setFormData] = useState<EventFormData>({});

  // AI location awareness
  const suggestedLocation = useMemo(() => {
    if (!coords) return "";
    return `Near ${coords.city || "your location"}`;
  }, [coords]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <Input
          placeholder="Event title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />

        <Textarea
          placeholder="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />

        <Select value={formData.eventType} onValueChange={(v) => setFormData({ ...formData, eventType: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="potluck">🍽️ Potluck</SelectItem>
            <SelectItem value="volunteer">🤝 Volunteer Shift</SelectItem>
            <SelectItem value="cooking_class">👨‍🍳 Cooking Class</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          type="datetime-local"
          value={formData.startTime}
          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
        />
        <Input
          type="datetime-local"
          value={formData.endTime}
          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
        />
      </div>

      {/* Location with AI suggestion */}
      <div className="space-y-2">
        <Input
          placeholder="Location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        />
        {suggestedLocation && (
          <p className="text-xs text-muted-foreground">
            💡 Suggestion: {suggestedLocation}
          </p>
        )}
      </div>

      {/* Capacity */}
      <Input
        type="number"
        placeholder="Max attendees (optional)"
        value={formData.capacity}
        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
      />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" /> : "Create Event"}
      </Button>
    </form>
  );
}
```

**Key improvements**:
- **All fields visible** at once (no wizard steps)
- **AI location awareness** (suggests based on user coords)
- **Clickable Google Maps links** in event details
- **Edit mode** support (same UI for create/edit)

## Public Community Access

Previously, `/community` required authentication. This limited discoverability.

### The Change

Made community **read-only for anonymous users**:

```tsx
// src/app/community/page.tsx
export default async function CommunityPage() {
  const session = await auth.api.getSession({ headers: headers() });

  const posts = await db.select().from(posts).orderBy(desc(posts.createdAt));

  return <CommunityPageClient posts={posts} user={session?.user || null} />;
}

// Client component
export default function CommunityPageClient({ posts, user }: Props) {
  const { openLogin } = useAuthModal();

  const handleReply = (postId: string) => {
    if (!user) {
      openLogin(`/community#post-${postId}`);
      return;
    }

    // Show reply UI
  };

  return (
    <div>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onReply={() => handleReply(post.id)}
          isAuthenticated={!!user}
        />
      ))}
    </div>
  );
}
```

**Interaction gating**: Anonymous users see posts but can't reply/RSVP/create. Clicking those actions opens the glassmorphic auth modal.

**SEO benefit**: Public content improves discoverability and sharing.

## Mobile Landing Page

The landing page needed **extreme compression** for mobile:

```tsx
// src/app/page.tsx - Mobile hero
<section className="min-h-screen flex flex-col justify-center px-4 md:px-8">
  {/* Compressed spacing on mobile */}
  <div className="space-y-4 md:space-y-6">
    <h1 className="text-4xl md:text-6xl font-bold leading-tight">
      Find food.<br />Share meals.<br />Build community.
    </h1>

    {/* Both CTAs fit in first viewport on mobile */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <ActionCard
        title="I'm Hungry"
        description="Find food banks and community resources near you"
        href="/map"
        icon={<UtensilsCrossed />}
      />

      <ActionCard
        title="I'm Full"
        description="Share surplus food with neighbors in need"
        href="/community"
        icon={<Heart />}
      />
    </div>
  </div>

  {/* Hidden on mobile to fit CTAs above fold */}
  <div className="hidden md:block mt-8">
    <SecondaryLinks />
  </div>
</section>
```

**Critical change**: Both CTA cards fit in the first viewport on mobile, no scrolling required.

## What Went Right

1. **Glassmorphic Auth**: Users loved the seamless modal experience

2. **Bottom Sheet**: Familiar mobile pattern, intuitive interaction

3. **Unified Creation**: One flow eliminated confusion

4. **Public Community**: SEO improved, sharing increased

5. **Mobile-First**: Testing on real phones early caught issues

## What I'd Do Differently

**Mistake 1: No Design System**

Colors, spacing, and blur effects were inconsistent. Should have defined design tokens upfront.

**Mistake 2: Late Accessibility Audit**

Keyboard navigation, screen readers, and focus management were afterthoughts.

**Mistake 3: No Animation Library**

Hand-coded transitions were janky. Framer Motion would have smoothed interactions.

## What I Learned

1. **Context Matters**: Keeping users in context (modal vs redirect) drastically improves UX

2. **Mobile Changes Everything**: Bottom sheets, swipe gestures, and thumb-friendly buttons aren't optional

3. **Consistency Beats Novelty**: Unified creation drawer worked because it matched user expectations

4. **Public Content Wins**: Opening community read-only increased engagement

5. **Glassmorphism Is Hard**: Getting blur, transparency, and contrast right requires iteration

## Up Next

In Part 12, I'll cover performance and scale - PostGIS spatial queries for 100x faster food bank searches.

---
**Key Commits**:
- `acc5c13` - Implement global glassmorphic auth modal and unified auth UX
- `5d5347d` - Implement updated application structure with events-first design
- `d2e0661` - Refactor Event Creation UI to Glassmorphic Modal with AI & Edit Mode

**Related Files**:
- `src/components/auth/auth-modal-context.tsx` - Auth modal context
- `src/components/map/resource-bottom-sheet.tsx` - Mobile bottom sheet
- `src/components/events/create-event-modal.tsx` - Event creation modal
