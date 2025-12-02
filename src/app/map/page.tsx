import { db } from "@/lib/db";
import { userProfiles } from "@/lib/schema";
import { MapPageClient } from "./pageClient";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { getNormalizedResources } from "@/lib/resource-feed";

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const params = await searchParams;
  const resourceId = (params.resource || params.foodBankId) as string | undefined;

  let isAdmin = false;
  if (session?.user) {
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, session.user.id),
    });
    isAdmin = profile?.role === "admin";
  }

  // Fetch main list (increased limit)
  const normalizedBanks = await getNormalizedResources({ limit: 200 });

  // If a specific resource is requested, ensure it's in the list
  if (resourceId) {
    const alreadyExists = normalizedBanks.some(b => b.id === resourceId);
    if (!alreadyExists) {
      const specificResource = await getNormalizedResources({ id: resourceId });
      if (specificResource.length > 0) {
        normalizedBanks.push(specificResource[0]);
      }
    }
  }

  const services = Array.from(
    new Set(
      normalizedBanks
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

      <MapPageClient foodBanks={normalizedBanks} services={services} isAdmin={isAdmin} />
    </div>
  );
}
