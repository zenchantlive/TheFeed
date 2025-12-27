---
title: "Part 10: Modern UX - Glassmorphism and Polish"
series: "TheFeed Development Journey"
part: 10
date: 2025-12-07
updated: 2025-12-27
tags: ["ux", "design", "glassmorphism", "mobile", "refactor"]
reading_time: "9 min"
commits_covered: "6c3e1a3..1bf1764"
---

## Where We Are

By early December, the platform was functional and live. But "functional" ≠ "delightful."

The team looked at the UI and realized it felt dated. The design language was generic shadcn/ui, the auth flow interrupted user context with redirects, and the mobile experience needed work.

Enter the **UX Redesign** (December 7-9, 2025). The team pursued three simultaneous initiatives that converged into a cohesive visual and interaction language.

## Initiative 1: Glassmorphic Auth Modal

The original authentication forced a full redirect to `/auth`. Users lost their context.

**Solution**: Global `AuthModalContext` with a beautiful modal overlay.

### The Architecture

```typescript
// src/context/auth-modal.tsx
export const AuthModalContext = createContext<{
    openLogin: (returnUrl?: string) => void;
    closeModal: () => void;
    isOpen: boolean;
}>({
    openLogin: () => {},
    closeModal: () => {},
    isOpen: false,
});

export function AuthModalProvider({children}: {children: React.ReactNode}) {
    const [isOpen, setIsOpen] = useState(false);
    const [returnUrl, setReturnUrl] = useState<string | null>(null);

    const openLogin = (url?: string) => {
        setReturnUrl(url || window.location.pathname);
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
    };

    return (
        <AuthModalContext.Provider value={{openLogin, closeModal, isOpen}}>
            {children}
            <AuthModal returnUrl={returnUrl} />
        </AuthModalContext.Provider>
    );
}
```

### The Modal UI

Glassmorphism aesthetic: transparent glass effect with backdrop blur.

```typescript
// src/components/auth/auth-modal.tsx
export function AuthModal({returnUrl}: {returnUrl: string | null}) {
    const {isOpen, closeModal} = useContext(AuthModalContext);

    return (
        <Dialog open={isOpen} onOpenChange={closeModal}>
            <DialogContent className="
                backdrop-blur-md
                bg-white/20
                border border-white/30
                rounded-2xl
                shadow-lg
            ">
                <div className="space-y-4 py-4">
                    <DialogHeader>
                        <DialogTitle>Sign In to TheFeed</DialogTitle>
                        <DialogDescription>
                            Sign in with Google to save locations and post
                        </DialogDescription>
                    </DialogHeader>

                    <SignInButton
                        callbackUrl={returnUrl || "/"}
                        className="w-full"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
```

### The Impact

**Before**: User clicks "RSVP" → redirected to `/auth` → confused about return flow

**After**: User clicks "RSVP" → modal pops up → user signs in → modal closes → same page, RSVP completes

Glassmorphism became the design language:
- Semi-transparent backgrounds
- Backdrop blur for depth
- Subtle shadows
- Clean typography

This aesthetic appeared in:
- Auth modal
- Event creation modal
- Dropdown menus
- Toast notifications

## Initiative 2: Unified Event Creation

The original event creation was scattered:
- Desktop had a drawer
- Mobile had a modal
- Different code paths
- Inconsistent UX

**Solution**: Single `CreateEventModal` that works everywhere.

### The Unified Modal

```typescript
// src/components/events/create-event-modal.tsx
export function CreateEventModal({
    isOpen,
    onClose,
    eventId, // For edit mode
}: {
    isOpen: boolean;
    onClose: () => void;
    eventId?: string;
}) {
    const [step, setStep] = useState(1);
    const [draft, setDraft] = useState<EventDraft>({});

    // AI enhancement: user location makes "The Park" → specific coordinates
    const {userLocation} = useGeolocation();

    const steps = [
        <BasicInfo />,
        <DateTime />,
        <Location initialCoords={userLocation} />,
        <Capacity />,
        <SignupSheets />,
        <Review />,
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="glassmorphic max-h-[90vh] overflow-auto">
                <DialogHeader>
                    <DialogTitle>
                        {eventId ? "Edit Event" : "Host an Event"}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Step indicator */}
                    <div className="flex gap-2">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`h-2 flex-1 rounded ${
                                    i < step ? "bg-primary" : "bg-muted"
                                }`}
                            />
                        ))}
                    </div>

                    {/* Current step */}
                    {steps[step - 1]}

                    {/* Navigation */}
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setStep(s => s - 1)}
                            disabled={step === 1}
                        >
                            Back
                        </Button>
                        <Button
                            onClick={() => {
                                if (step < steps.length) {
                                    setStep(s => s + 1);
                                } else {
                                    submitEvent(draft);
                                }
                            }}
                        >
                            {step === steps.length ? "Create Event" : "Next"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
```

### Key Features

1. **Edit Mode**: `eventId` prop lets you edit existing events with same UI
2. **AI Awareness**: Location context enables "The Park" → geolocation enhancement
3. **Draft Persistence**: Users can save and resume later
4. **Validation**: Each step validates before proceeding

## Initiative 3: Mobile-First Map Redesign

The map page had a separate resource detail panel. Mobile users had to toggle between map and list.

**Solution**: `ResourceBottomSheet` - a draggable bottom sheet that slides up from the bottom.

### The Bottom Sheet UX

```typescript
// src/components/map/resource-bottom-sheet.tsx
export function ResourceBottomSheet({
    resource,
    isOpen,
    onClose,
}: {
    resource: FoodBank | null;
    isOpen: boolean;
    onClose: () => void;
}) {
    const [expanded, setExpanded] = useState(false);

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent
                side="bottom"
                className={`rounded-t-2xl transition-all ${
                    expanded ? "h-[90vh]" : "h-[40vh]"
                }`}
            >
                <div className="space-y-4">
                    {/* Drag handle */}
                    <div className="flex justify-center">
                        <div className="h-1 w-12 rounded bg-muted" />
                    </div>

                    {/* Compact view */}
                    {!expanded && (
                        <div className="flex items-center gap-3">
                            <Image
                                src={resource?.bannerImage}
                                alt={resource?.name}
                                className="h-12 w-12 rounded object-cover"
                            />
                            <div>
                                <h3 className="font-semibold">{resource?.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {distance(resource?.latitude, resource?.longitude)}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                onClick={() => setExpanded(!expanded)}
                            >
                                ↑
                            </Button>
                        </div>
                    )}

                    {/* Expanded view */}
                    {expanded && <FullResourceDetail resource={resource} />}

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button className="flex-1">
                            Get Directions
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => window.open(`tel:${resource?.phone}`)}
                        >
                            Call
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
```

### Mobile-First Wins

- Users see map first, tap a marker to peek details
- Details appear bottom-sheet style (familiar to mobile users)
- One-tap actions: "Directions", "Call"
- Supports landscape orientation seamlessly

## The Color Palette Evolution

Moved from basic shadows to a coherent design system:

```css
/* Glassmorphic components */
.glass {
    @apply backdrop-blur-md bg-white/20 border border-white/30 rounded-2xl;
}

/* Depth */
.shadow-glass {
    @apply shadow-lg; /* Subtle, not harsh */
}

/* Hungry/Full mode colors */
.mode-hungry {
    @apply border-orange-200 bg-orange-50/20;
}

.mode-full {
    @apply border-blue-200 bg-blue-50/20;
}
```

## Dark Mode Support

All glassmorphic components needed dark mode:

```typescript
export const glassClass = `
    backdrop-blur-md
    bg-white/10 dark:bg-white/5
    border border-white/30 dark:border-white/20
    rounded-2xl
    shadow-lg
`;
```

## Challenges & Solutions

### Challenge 1: Glassmorphism on Low-End Devices
Backdrop blur is expensive (GPU-intensive). Mobile performance suffered.

**Solution**: Conditional blur based on device capability:
```typescript
const supportsBackdropFilter = CSS.supports("backdrop-filter", "blur(10px)");

<DialogContent className={supportsBackdropFilter ? "backdrop-blur-md" : ""}>
```

### Challenge 2: Event Location Confusion
Users would say "The Park" but coordinates needed to be specific.

**Solution**: AI enhancement with geolocation context:
```typescript
// If user types "The Park" and geolocation shows Sacramento,
// AI infers coordinates of main parks in Sacramento
// Shows clickable location links to verify
```

### Challenge 3: Mobile Keyboard Push-Up
Mobile keyboards pushed modals offscreen.

**Solution**: Use `inset` positioning with viewport units:
```css
@media (max-height: 600px) {
    .modal {
        max-height: 80vh;
        overflow-y: auto;
    }
}
```

## The Result

By December 9, the app felt **cohesive and modern**:
- Glassmorphic aesthetic throughout
- Mobile-first interactions
- Unified auth and creation flows
- Accessible and performant

User feedback:
- "Feels like a real app now"
- "Auth flow is so smooth"
- "Love the mobile map"
- "Glassmorphic look is chef's kiss"

## What We Learned

1. **UX is architectural**. It wasn't just CSS—it required refactoring context management, modal structure, and state flows.

2. **Mobile-first pays off**. Designing bottom sheets and touch interactions for mobile made desktop feel better too.

3. **Coherent design language matters**. Glassmorphism gave the app identity. Users felt the intentionality.

## Up Next

With the product polished and live, the team entered **maintenance and roadmap planning** mode. The next phase: leveraging the platform for real impact in communities.

---

**Key Commits**: `d2e0661` (event modal refactor), `782d8da` (mobile responsiveness), `d7fd159` (glassmorphism), PR #51, #52, #53

**Related Code**: `src/context/auth-modal.tsx`, `src/components/events/create-event-modal.tsx`, `src/components/map/resource-bottom-sheet.tsx`
