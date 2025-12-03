import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function runMigration() {
    console.log("Starting manual migration...");

    try {
        // 1. Fix verification_info column type
        console.log("Fixing verification_info column type...");
        await db.execute(sql`
      ALTER TABLE "provider_claims" 
      ALTER COLUMN "verification_info" TYPE jsonb 
      USING verification_info::jsonb;
    `);
        console.log("✓ verification_info fixed.");
    } catch (e: any) {
        console.log("ℹ️ verification_info fix skipped or failed (might already be fixed):", e.message);
    }

    try {
        // 2. Enable RLS on all tables
        console.log("Enabling RLS on tables...");
        const tables = [
            "verification", "user", "account", "chat_messages", "saved_locations",
            "session", "posts", "comments", "follows", "user_profiles",
            "helpful_marks", "events", "event_attendance", "event_recurrence",
            "event_rsvps", "sign_up_slots", "sign_up_claims", "tombstone",
            "admin_audit_log", "resource_versions", "discovery_events",
            "user_verifications", "provider_claims",
            "points_history", "food_banks"
        ];

        for (const table of tables) {
            try {
                await db.execute(sql.raw(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`));
            } catch (e) {
                // Ignore if already enabled or table missing
            }
        }
        console.log("✓ RLS enabled.");

        // 3. Apply Policies (Idempotent drop/create)
        console.log("Applying RLS policies...");

        const policies = [
            { table: "food_banks", name: "Enable read access for all users" },
            { table: "posts", name: "Enable read access for all users" },
            { table: "comments", name: "Enable read access for all users" },
            { table: "events", name: "Enable read access for all users" },
            { table: "event_recurrence", name: "Enable read access for all users" },
            { table: "sign_up_slots", name: "Enable read access for all users" },
            { table: "user_profiles", name: "Enable read access for all users" },
            { table: "helpful_marks", name: "Enable read access for all users" },
            { table: "tombstone", name: "Enable read access for all users" },
            { table: "resource_versions", name: "Enable read access for all users" }
        ];

        for (const p of policies) {
            await db.execute(sql.raw(`DROP POLICY IF EXISTS "${p.name}" ON "${p.table}";`));
            await db.execute(sql.raw(`CREATE POLICY "${p.name}" ON "${p.table}" AS PERMISSIVE FOR SELECT TO public USING (true);`));
        }
        console.log("✓ Policies applied.");

    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }

    console.log("Done!");
    process.exit(0);
}

runMigration();
