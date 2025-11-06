import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { foodBanks, savedLocations, type HoursType } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LocationCard } from "@/components/foodshare/location-card";
import { SignInButton } from "@/components/auth/sign-in-button";
import Link from "next/link";
import {
  BookmarkPlus,
  Bell,
  MapPinned,
  Languages,
  ShieldCheck,
  Info,
  LifeBuoy,
} from "lucide-react";
import { isCurrentlyOpen } from "@/lib/geolocation";

type SavedLocationRecord = {
  id: string;
  createdAt: Date | null;
  foodBank: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string | null;
    website: string | null;
    description: string | null;
    services: string[] | null;
    hours: HoursType | null;
    latitude: number;
    longitude: number;
  } | null;
};

export default async function ProfilePage() {
  const headerList = await headers();
  const headerEntries = Array.from(headerList.entries()) as [string, string][];
  const session = await auth.api.getSession({
    headers: new Headers(headerEntries),
  });

  const user = session?.user ?? null;

  const saved: SavedLocationRecord[] = user
    ? await db
        .select({
          id: savedLocations.id,
          createdAt: savedLocations.createdAt,
          foodBank: foodBanks,
        })
        .from(savedLocations)
        .leftJoin(foodBanks, eq(savedLocations.foodBankId, foodBanks.id))
        .where(eq(savedLocations.userId, user.id))
        .orderBy(desc(savedLocations.createdAt))
    : [];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-12 pt-8 md:pt-10">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-primary-start via-primary-end to-primary-start p-6 text-white shadow-lg shadow-primary/30 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-white/80 shadow-lg">
              <AvatarImage
                src={user?.image ?? undefined}
                alt={user?.name ?? "Guest"}
                referrerPolicy="no-referrer"
              />
              <AvatarFallback className="bg-white/20 text-lg font-semibold">
                {(user?.name?.[0] ?? user?.email?.[0] ?? "G").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm font-semibold uppercase tracking-wide text-white/70">
                FoodShare Profile
              </p>
              <h1 className="text-2xl font-bold md:text-3xl">
                {user ? `Welcome back, ${user.name ?? "FoodShare member"}` : "Sign in to personalize FoodShare"}
              </h1>
              <p className="text-sm text-white/80">
                {user
                  ? "Manage saved locations, preferences, and learn more about FoodShare."
                  : "Create an account to save nearby food banks and sync your preferences across devices."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Button asChild variant="secondary" className="bg-white/10 hover:bg-white/20">
                <Link href="/chat">Talk to the assistant</Link>
              </Button>
            ) : (
              <SignInButton />
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Account</CardTitle>
            <CardDescription>
              Access your FoodShare account controls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {user ? (
              <div className="space-y-3 text-sm text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground">Signed in as</p>
                  <p className="truncate">{user.email}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-primary/5 p-3 text-xs text-primary-foreground">
                  Saving food banks helps FoodShare tailor quick suggestions for you.
                </div>
                <Button asChild className="w-full">
                  <Link href="/map">
                    <MapPinned className="mr-2 h-4 w-4" />
                    Find nearby food banks
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Create an account to save your favourite locations.</p>
                <SignInButton />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Settings</CardTitle>
            <CardDescription>
              Preferences coming in Phase 2
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-3 rounded-2xl border border-border/60 px-3 py-2">
              <Bell className="h-4 w-4 text-primary" />
              <div>
                <p className="text-foreground">Notifications</p>
                <p>Get reminders for upcoming community programs.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border/60 px-3 py-2">
              <MapPinned className="h-4 w-4 text-primary" />
              <div>
                <p className="text-foreground">Location services</p>
                <p>Allow FoodShare to find nearby resources faster.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border/60 px-3 py-2">
              <Languages className="h-4 w-4 text-primary" />
              <div>
                <p className="text-foreground">Language</p>
                <p>English and Spanish support planned for Phase 1.5.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">About FoodShare</CardTitle>
            <CardDescription>
              Learn more about the initiative
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-2xl border border-border/60 px-3 py-2 transition hover:border-primary/40 hover:text-primary"
            >
              <Info className="h-4 w-4 text-primary" />
              <div>
                <p className="text-foreground">What is FoodShare?</p>
                <p>Our mission to connect neighbours with food assistance.</p>
              </div>
            </Link>
            <Link
              href="/community"
              className="flex items-center gap-2 rounded-2xl border border-border/60 px-3 py-2 transition hover:border-primary/40 hover:text-primary"
            >
              <LifeBuoy className="h-4 w-4 text-primary" />
              <div>
                <p className="text-foreground">Get help</p>
                <p>Guides, preparation tips, and frequently asked questions.</p>
              </div>
            </Link>
            <Link
              href="#"
              className="flex items-center gap-2 rounded-2xl border border-border/60 px-3 py-2 transition hover:border-primary/40 hover:text-primary"
            >
              <ShieldCheck className="h-4 w-4 text-primary" />
              <div>
                <p className="text-foreground">Privacy commitment</p>
                <p>Your conversations stay private and respectful.</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Saved locations
            </h2>
            <p className="text-sm text-muted-foreground">
              Keep your go-to food banks handy across devices.
            </p>
          </div>
          <div className="hidden md:block">
            <Button asChild variant="outline">
              <Link href="/map">
                <BookmarkPlus className="mr-2 h-4 w-4" />
                Add new
              </Link>
            </Button>
          </div>
        </div>

        {user ? (
          saved.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {saved
                .filter((entry) => entry.foodBank)
                .map((entry) => {
                  const bank = entry.foodBank!;
                  const isOpen = bank.hours ? isCurrentlyOpen(bank.hours) : false;
                  return (
                    <LocationCard
                      key={entry.id}
                      location={bank}
                      isOpen={isOpen}
                      actionSlot={
                        <Button asChild variant="outline" className="w-full">
                          <Link href={`/map?highlight=${bank.id}`}>
                            View on map
                          </Link>
                        </Button>
                      }
                    />
                  );
                })}
            </div>
          ) : (
            <Card className="rounded-3xl border border-dashed border-border/60 bg-muted/40">
              <CardContent className="flex flex-col gap-3 p-6 text-sm text-muted-foreground">
                <p>
                  You haven&apos;t saved any locations yet. Mark a food bank as a
                  favourite from the map or chat to access it quickly later.
                </p>
                <Button asChild>
                  <Link href="/map">Explore the map</Link>
                </Button>
              </CardContent>
            </Card>
          )
        ) : (
          <Card className="rounded-3xl border border-dashed border-border/60 bg-muted/40">
            <CardContent className="flex flex-col gap-3 p-6 text-sm text-muted-foreground">
              <p>
                Sign in to keep track of the food banks you rely on most. We&apos;ll
                sync them across your devices.
              </p>
              <SignInButton />
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
