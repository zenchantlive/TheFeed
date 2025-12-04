import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
    try {
        console.log("Checking for drizzle_migrations table...");
        const result = await db.execute(sql`SELECT * FROM drizzle.drizzle_migrations`);
        console.log("Migrations found:", result);
    } catch (error: any) {
        console.error("Error querying migrations:", error.message);
        if (error.message.includes("relation \"drizzle.drizzle_migrations\" does not exist")) {
            console.log("drizzle_migrations table does not exist in 'drizzle' schema.");
            // Try public schema as fallback
            try {
                const publicResult = await db.execute(sql`SELECT * FROM drizzle_migrations`);
                console.log("Migrations found in public schema:", publicResult);
            } catch (e: any) {
                console.log("drizzle_migrations table does not exist in public schema either.");
            }
        }
    }
}

main().catch(console.error);
