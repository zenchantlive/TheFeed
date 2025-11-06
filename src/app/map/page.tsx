import { db } from "@/lib/db";
import { foodBanks } from "@/lib/schema";
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 pb-10 md:py-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Map
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Discover food resources near you
        </h1>
        <p className="text-sm text-muted-foreground">
          Search by neighborhood, filter by services, and get directions to food
          banks across the Bay Area.
        </p>
      </header>

      <MapPageClient foodBanks={banks} services={services} />
    </div>
  );
}
