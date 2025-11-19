import { db } from "../src/lib/db";
import { foodBanks, discoveryEvents } from "../src/lib/schema";
import { eq, sql } from "drizzle-orm";

async function nuke() {
  console.log("☢️  Nuking test discovery data...");

  // 1. Delete Food Banks marked as test runs
  const banksResult = await db
    .delete(foodBanks)
    .where(eq(foodBanks.importSource, "tavily_test_run"))
    .returning({ id: foodBanks.id });

  console.log(`🗑️  Deleted ${banksResult.length} test food banks.`);

  // 2. Delete Discovery Events marked as test
  // Note: metadata is a JSONB column. We check if the JSON contains {"isTest": true}
  // or simply delete events associated with the current admin user if needed, but metadata check is safer.
  // Drizzle's SQL operator for JSON containment is usually @> but depends on driver.
  // We'll use a raw SQL where clause for safety.

  const eventsResult = await db
    .delete(discoveryEvents)
    .where(sql`metadata->>'isTest' = 'true'`)
    .returning({ id: discoveryEvents.id });

  console.log(`🗑️  Deleted ${eventsResult.length} test discovery events.`);

  console.log("✅ Nuke complete. You can now re-run discovery.");
}

nuke()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Nuke failed:", err);
    process.exit(1);
  });
