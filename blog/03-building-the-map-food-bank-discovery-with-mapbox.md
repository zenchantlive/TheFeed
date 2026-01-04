---
title: "Part 3: Building the Map - Food Bank Discovery with Mapbox"
series: "TheFeed Development Journey"
part: 3
date: 2025-11-06
updated: 2025-12-27
tags: [mapbox, geolocation, maps, react, spatial-data]
reading_time: "12 min"
commits_covered: "e7ac814..41149ed"
---

## The Map-First Philosophy

When you're building a hyperlocal food discovery app, the map isn't a feature - it's **the interface**.

People don't think "I need food from zip code 95814." They think "What's near me right now?" The map answers that question instantly.

So on Day 2 of the FoodShare pivot (November 6, 2025), I had a clear priority: **get the map working**.

## Why Mapbox Over Google Maps?

The choice of mapping provider mattered. Here's why I went with Mapbox GL JS:

**Pros**:
- Beautiful, customizable styling
- Generous free tier (50,000 loads/month)
- Excellent React integration via `react-map-gl`
- WebGL-based rendering (smooth performance)
- Great documentation

**Cons**:
- Steeper learning curve than Google Maps
- Smaller ecosystem
- More manual work for features like geocoding

The **styling control** was the deciding factor. Mapbox let me create a map that felt like part of the app, not a generic Google Maps embed.

## The Initial Implementation

The first version (`e7ac814`) was delightfully simple:

```tsx
// src/components/map/MapView.tsx
"use client";

import Map, { Marker, Popup } from 'react-map-gl';
import { MapPin } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

export function MapView({ locations, center }: MapViewProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{
        longitude: center.lng,
        latitude: center.lat,
        zoom: 12
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
    >
      {locations.map((location) => (
        <Marker
          key={location.id}
          longitude={location.longitude}
          latitude={location.latitude}
          onClick={() => setSelectedLocation(location.id)}
        >
          <MapPin className="text-primary h-8 w-8" />
        </Marker>
      ))}

      {selectedLocation && (
        <Popup
          longitude={selectedLocation.longitude}
          latitude={selectedLocation.latitude}
          onClose={() => setSelectedLocation(null)}
        >
          <LocationPopup location={selectedLocation} />
        </Popup>
      )}
    </Map>
  );
}
```

Clean, functional, and **working** in under 100 lines. This is the power of good abstractions.

## Seeding Sacramento Data

With the map rendering, I needed data. Rather than building a scraper, I manually researched and seeded Sacramento food banks:

```typescript
// scripts/seed-food-banks.ts
const sacramentoFoodBanks = [
  {
    name: "Sacramento Food Bank & Family Services",
    address: "3333 3rd Ave",
    city: "Sacramento",
    state: "CA",
    zipCode: "95817",
    latitude: 38.5599,
    longitude: -121.4590,
    phone: "(916) 456-1980",
    website: "https://www.sacramentofoodbank.org",
    services: ["Emergency Food", "CalFresh Assistance", "Senior Support"],
    hours: {
      mon: { open: "09:00", close: "16:00" },
      tue: { open: "09:00", close: "16:00" },
      wed: { open: "09:00", close: "16:00" },
      thu: { open: "09:00", close: "16:00" },
      fri: { open: "09:00", close: "16:00" },
      sat: { closed: true },
      sun: { closed: true }
    }
  },
  // ... 15 more hand-curated entries
];
```

This manual process was tedious but valuable. I learned:
- Hours vary wildly (some only open 2 days/week)
- Services aren't standardized ("Food Pantry" vs "Emergency Groceries")
- Many lack websites or have outdated info
- Geocoding street addresses requires care (building entrance vs parking lot)

## The Hours Challenge

Displaying "Open Now" status seems trivial until you implement it:

```typescript
// src/lib/geolocation.ts
export type HoursType = {
  [K in 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun']?: {
    open?: string;
    close?: string;
    closed?: boolean;
  };
};

export function isCurrentlyOpen(hours: HoursType | null): boolean {
  if (!hours) return false;

  const now = new Date();
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const todayKey = dayNames[now.getDay()] as keyof HoursType;
  const todayHours = hours[todayKey];

  if (!todayHours || todayHours.closed) return false;

  const [currentHour, currentMinute] = [now.getHours(), now.getMinutes()];
  const currentTime = currentHour * 60 + currentMinute;

  const [openHour, openMinute] = todayHours.open!.split(':').map(Number);
  const openTime = openHour * 60 + openMinute;

  const [closeHour, closeMinute] = todayHours.close!.split(':').map(Number);
  const closeTime = closeHour * 60 + closeMinute;

  return currentTime >= openTime && currentTime < closeTime;
}
```

This function has subtle bugs (timezone handling, midnight crossover), but it worked well enough for MVP.

## The Popup Problem

Initial map markers showed a popup on click:

```tsx
// src/components/map/LocationPopup.tsx
export function LocationPopup({ location }: { location: FoodBank }) {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${location.address}, ${location.city}, ${location.state}`
  )}`;

  return (
    <div className="max-w-sm p-4 space-y-3">
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-lg">{location.name}</h3>
        <StatusBadge isOpen={isCurrentlyOpen(location.hours)} />
      </div>

      <div className="text-sm text-muted-foreground">
        <MapPin className="inline h-4 w-4 mr-1" />
        {location.address}, {location.city}
      </div>

      {location.phone && (
        <Button asChild variant="outline" size="sm">
          <a href={`tel:${location.phone}`}>
            <Phone className="h-4 w-4 mr-2" />
            Call
          </a>
        </Button>
      )}

      <Button asChild className="w-full">
        <a href={directionsUrl} target="_blank">
          <Navigation className="h-4 w-4 mr-2" />
          Get Directions
        </a>
      </Button>
    </div>
  );
}
```

This worked but had UX issues:
- **Mobile**: Popups covered half the screen
- **Accessibility**: Clicking outside to close wasn't obvious
- **Content**: Limited space for full location details

These problems would eventually lead to a **bottom sheet redesign** (Part 11), but for MVP, popups were good enough.

## Geolocation and User Position

A food discovery app must answer "What's near **me**?" So I added browser geolocation:

```tsx
// src/app/map/pageClient.tsx
export default function MapPageClient({ initialLocations }: Props) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [center, setCenter] = useState<[number, number]>([-121.4944, 38.5816]); // Sacramento default

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [
            position.coords.longitude,
            position.coords.latitude
          ];
          setUserLocation(coords);
          setCenter(coords); // Re-center map on user
        },
        (error) => {
          console.warn('Geolocation denied:', error);
          // Fall back to Sacramento default
        }
      );
    }
  }, []);

  return (
    <MapView
      locations={initialLocations}
      center={center}
      userLocation={userLocation}
    />
  );
}
```

This introduced the **server/client split pattern** that would become standard:
- **Server component** (`page.tsx`): Fetch data from database
- **Client component** (`pageClient.tsx`): Handle interactivity, geolocation, state

Clean separation of concerns.

## The Distance Calculation

Once I had user location, I could show "X miles away":

```typescript
// src/lib/geolocation.ts
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles

  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal
}
```

The Haversine formula - a classic that every geo app eventually implements. It's accurate enough for walking distances (< 10 miles), though it assumes a perfect sphere (Earth isn't).

## The Search Bar

Finding food banks by address required a search interface:

```tsx
// src/components/map/MapSearchBar.tsx
export function MapSearchBar({ onSearch }: MapSearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();

    // Use Mapbox Geocoding API
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
    );

    const data = await response.json();
    if (data.features && data.features[0]) {
      const [lng, lat] = data.features[0].center;
      onSearch({ lat, lng });
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <Input
        type="text"
        placeholder="Search address..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pr-10"
      />
      <Button type="submit" size="icon" className="absolute right-1 top-1">
        <Search className="h-4 w-4" />
      </Button>
    </form>
  );
}
```

This worked but highlighted a pattern: **every API call to Mapbox exposed the public token**. Fine for MVP, but a reverse geocoding proxy would be better long-term.

## The Food Bank Queries

Fetching food banks required efficient database queries:

```typescript
// src/lib/food-bank-queries.ts
export async function searchFoodBanks(params: {
  latitude: number;
  longitude: number;
  radiusMiles?: number;
  limit?: number;
}) {
  const { latitude, longitude, radiusMiles = 10, limit = 50 } = params;

  // Simple implementation: fetch all, filter in memory
  const allBanks = await db.select().from(foodBanks);

  const results = allBanks
    .map((bank) => ({
      ...bank,
      distance: calculateDistance(latitude, longitude, bank.latitude, bank.longitude)
    }))
    .filter((bank) => bank.distance <= radiusMiles)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);

  return results;
}
```

This in-memory filtering was **shockingly slow** with 500+ food banks. It worked for Sacramento's 20 locations, but foreshadowed the **PostGIS migration** needed later (Part 12).

## UI Polish: The Location Card

Food banks needed a consistent visual treatment:

```tsx
// src/components/foodshare/location-card.tsx
export function LocationCard({ location, distance }: LocationCardProps) {
  const isOpen = isCurrentlyOpen(location.hours);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{location.name}</CardTitle>
            <CardDescription>
              <MapPin className="inline h-3 w-3 mr-1" />
              {location.address}, {location.city}
            </CardDescription>
          </div>
          <StatusBadge isOpen={isOpen} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {distance && (
          <p className="text-sm font-medium text-muted-foreground">
            {distance.toFixed(1)} miles away
          </p>
        )}

        {location.services && (
          <div className="flex flex-wrap gap-2">
            {location.services.map((service) => (
              <Badge key={service} variant="outline">
                {service}
              </Badge>
            ))}
          </div>
        )}

        {location.hours && (
          <Accordion type="single" collapsible>
            <AccordionItem value="hours">
              <AccordionTrigger>
                <Clock className="inline h-4 w-4 mr-2" />
                Hours
              </AccordionTrigger>
              <AccordionContent>
                <HoursDisplay hours={location.hours} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        <BigActionButton
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
            `${location.address}, ${location.city}, ${location.state}`
          )}`}
          icon={<Navigation className="h-5 w-5" />}
        >
          Get Directions
        </BigActionButton>
      </CardContent>
    </Card>
  );
}
```

The `BigActionButton` component became a pattern - **high-contrast, large tap targets** for critical mobile actions.

## What Went Right

Several decisions paid off:

1. **Mapbox Choice**: The styling control and performance were worth the learning curve

2. **Manual Seeding**: Taking time to curate data meant every food bank was accurate

3. **Server/Client Split**: Clear separation made the codebase maintainable

4. **Distance-First**: Showing "X miles away" made locations immediately relevant

5. **Mobile-First**: Building for small screens first ensured good UX everywhere

## What I'd Do Differently

Looking back, some early mistakes:

### Mistake 1: In-Memory Filtering

Fetching all food banks and filtering in JavaScript was wasteful. Should have used SQL `WHERE` clauses from day one:

```sql
-- Better approach (added later)
SELECT * FROM food_banks
WHERE ST_DWithin(
  geom::geography,
  ST_MakePoint($1, $2)::geography,
  $3 * 1609.34  -- miles to meters
)
ORDER BY ST_Distance(geom::geography, ST_MakePoint($1, $2)::geography)
LIMIT $4;
```

This PostGIS query (Part 12) made searches 100x faster.

### Mistake 2: Public Token Exposure

Putting `NEXT_PUBLIC_MAPBOX_TOKEN` in client code exposed it to abuse. Should have proxied geocoding requests through API routes.

### Mistake 3: No Caching

Every map load fetched food banks from database. A simple Redis cache (or even SWR on client) would have reduced load.

## What I Learned

This map implementation taught key lessons:

1. **Start Simple**: The first version was <200 lines total. It worked. Don't over-engineer upfront.

2. **Manual Work Teaches**: Hand-seeding data forced me to understand food bank operations deeply.

3. **Performance Comes Later**: In-memory filtering worked for MVP. Optimize when metrics demand it.

4. **Visual Hierarchy Matters**: StatusBadge, distance display, and BigActionButton made the interface scannable.

5. **Mobile Changes Everything**: Desktop map UX patterns don't translate. Test on real phones early.

## The User Experience

With the map working, users could:
- See nearby food banks visually
- Check if locations were currently open
- Get one-tap directions
- View services offered
- Access phone numbers and websites

This was **functional** but not yet **magical**. The magic would come when we connected the map to AI chat (Part 4), letting users ask "I'm hungry, what's open now?" and get instant, personalized answers.

## Up Next

In Part 4, I'll cover building the AI Sous-Chef - integrating OpenRouter, implementing tool calling, and creating a chat experience that could search food banks, generate directions, and provide empathetic guidance.

---
**Key Commits**:
- `e7ac814` - Added Sacramento food bank data
- `41149ed` - Complete FoodShare branding and save location feature

**Related Files**:
- `src/components/map/MapView.tsx` - Map rendering component
- `src/components/map/LocationPopup.tsx` - Popup UI
- `src/lib/geolocation.ts` - Distance calculations and hours parsing
- `src/lib/food-bank-queries.ts` - Database queries
- `scripts/seed-food-banks.ts` - Data seeding script
