import { db } from "@/lib/db";
import { foodBanks } from "@/lib/schema";
import Link from "next/link";

import { MoodChip } from "@/components/foodshare/mood-chip";
import { Button } from "@/components/ui/button";
import { MapPageClient } from "./pageClient";

export default async function MapPage() {
  const banks = (await db.select().from(foodBanks)) as typeof foodBanks.$inferSelect[];

  const services = Array.from(
    new Set(
      banks
        .flatMap((bank) => bank.services ?? [])
        .filter((service): service is string => Boolean(service))
    )
  ).sort((a, b) => a.localeCompare(b));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 pb-10 md:gap-6 md:py-8">
      <header className="space-y-3 rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Map
        </p>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Plot tonight’s free food trail
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Filter by vibes, see what’s hot right now, and send directions straight
            to the neighbors you’re helping.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MoodChip mood="hungry" compact />
          <MoodChip mood="full" compact />
          <Button asChild variant="ghost" size="sm" className="rounded-full">
            <Link href="/community">Peek at community posts</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-full border-dashed">
            <Link href="/chat">Ask the sous-chef</Link>
          </Button>
        </div>
      </header>

      <MapPageClient foodBanks={banks} services={services} />
    </div>
  );
}
