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
        // 1.5 Add role column to user table if missing
        console.log("Adding role column to user table...");
        await db.execute(sql`
            ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'user';
        `);
        console.log("✓ role column added.");
    } catch (e: any) {
        console.log("ℹ️ role column addition failed:", e.message);
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
            // Public Read Access
            { table: "food_banks", name: "Enable read access for all users", cmd: `CREATE POLICY "Enable read access for all users" ON "food_banks" AS PERMISSIVE FOR SELECT TO public USING (true);` },
            { table: "posts", name: "Enable read access for all users", cmd: `CREATE POLICY "Enable read access for all users" ON "posts" AS PERMISSIVE FOR SELECT TO public USING (true);` },
            { table: "comments", name: "Enable read access for all users", cmd: `CREATE POLICY "Enable read access for all users" ON "comments" AS PERMISSIVE FOR SELECT TO public USING (true);` },
            { table: "events", name: "Enable read access for all users", cmd: `CREATE POLICY "Enable read access for all users" ON "events" AS PERMISSIVE FOR SELECT TO public USING (true);` },
            { table: "event_recurrence", name: "Enable read access for all users", cmd: `CREATE POLICY "Enable read access for all users" ON "event_recurrence" AS PERMISSIVE FOR SELECT TO public USING (true);` },
            { table: "sign_up_slots", name: "Enable read access for all users", cmd: `CREATE POLICY "Enable read access for all users" ON "sign_up_slots" AS PERMISSIVE FOR SELECT TO public USING (true);` },
            { table: "helpful_marks", name: "Enable read access for all users", cmd: `CREATE POLICY "Enable read access for all users" ON "helpful_marks" AS PERMISSIVE FOR SELECT TO public USING (true);` },
            { table: "tombstone", name: "Enable read access for all users", cmd: `CREATE POLICY "Enable read access for all users" ON "tombstone" AS PERMISSIVE FOR SELECT TO public USING (true);` },
            { table: "resource_versions", name: "Enable read access for all users", cmd: `CREATE POLICY "Enable read access for all users" ON "resource_versions" AS PERMISSIVE FOR SELECT TO public USING (true);` },

            // Authenticated Access
            { table: "user_profiles", name: "Enable read access for authenticated users", cmd: `CREATE POLICY "Enable read access for authenticated users" ON "user_profiles" AS PERMISSIVE FOR SELECT TO authenticated USING (true);` },

            // Auth Tables (User Owns Data)
            { table: "user", name: "Users can read own data", cmd: `CREATE POLICY "Users can read own data" ON "user" AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid()::text = id);` },
            { table: "account", name: "Users can read own account", cmd: `CREATE POLICY "Users can read own account" ON "account" AS PERMISSIVE FOR SELECT TO authenticated USING ("userId" = auth.uid()::text);` },
            { table: "session", name: "Users can read own session", cmd: `CREATE POLICY "Users can read own session" ON "session" AS PERMISSIVE FOR SELECT TO authenticated USING ("userId" = auth.uid()::text);` },

            // Provider Claims
            { table: "provider_claims", name: "Admins can read all claims", cmd: `CREATE POLICY "Admins can read all claims" ON "provider_claims" AS PERMISSIVE FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM "user" WHERE id = auth.uid()::text AND role = 'admin'));` },
            { table: "provider_claims", name: "Users can read own claims", cmd: `CREATE POLICY "Users can read own claims" ON "provider_claims" AS PERMISSIVE FOR SELECT TO authenticated USING (user_id = auth.uid()::text);` }
        ];

        await db.transaction(async (tx) => {
            for (const p of policies) {
                try {
                    await tx.execute(sql.raw(`DROP POLICY IF EXISTS "${p.name}" ON "${p.table}";`));
                    await tx.execute(sql.raw(p.cmd));
                    console.log(`✓ Policy applied: ${p.name} on ${p.table}`);
                } catch (err: any) {
                    console.error(`✗ Failed to apply policy ${p.name} on ${p.table}: ${err.message}`);
                    throw err; // Re-throw to trigger rollback
                }
            }
        });
        console.log("✓ All policies applied successfully.");

    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }

    console.log("Done!");
    process.exit(0);
}

runMigration();
