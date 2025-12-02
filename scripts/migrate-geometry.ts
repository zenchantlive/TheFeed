
import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";
import postgres from "postgres";

async function migrateGeometry() {
  console.log("Starting geometry migration...");

  try {
    // 1. Enable PostGIS if not already enabled (idempotent)
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS postgis;`);
    console.log("✅ PostGIS extension enabled");

    // 2. Update all rows where lat/lng are non-zero
    // We use ::geometry casting to ensure types match the new column
    const result = await db.execute(sql`
      UPDATE food_banks
      SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
      WHERE latitude != 0 AND longitude != 0 AND geom IS NULL;
    `);

    // Drizzle/Postgres.js returns count in the result object
    const rows = result as postgres.RowList<postgres.Row[]>;
    const count = rows.count || rows.length || 0;
    console.log(`✅ Updated geometry for ${count} resources`);

    // 3. Verify a few records
    const check = await db.execute(sql`
      SELECT id, name, ST_AsText(geom) as geom_text 
      FROM food_banks 
      WHERE geom IS NOT NULL 
      LIMIT 5
    `);

    const checkRows = check as postgres.RowList<postgres.Row[]>;
    console.log("Sample updated records:", checkRows);

  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }

  console.log("Done!");
  process.exit(0);
}

migrateGeometry();
