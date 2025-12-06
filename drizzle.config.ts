import type { Config } from "drizzle-kit";

export default {
  dialect: "postgresql",
  schema: "./src/lib/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    // Use DIRECT_URL for migrations (avoids SSL issues with pooler)
    // Falls back to POSTGRES_URL if DIRECT_URL not set
    url: process.env.DIRECT_URL || process.env.POSTGRES_URL!,
    ssl: {
      // TODO: Security - Replace with Supabase CA certificate for production
      // Current setting disables SSL verification (required for Windows + Supabase)
      // For better security, download CA cert from Supabase dashboard and use:
      // ca: fs.readFileSync(path.join(__dirname, "prod-ca-2021.crt")).toString()
      rejectUnauthorized: false,
    },
  },
  // Ignore PostGIS system tables
  tablesFilter: ["!spatial_ref_sys", "!geography_columns", "!geometry_columns", "!raster_columns", "!raster_overviews"],
} satisfies Config;
