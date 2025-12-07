import type { Config } from "drizzle-kit";

export default {
  dialect: "postgresql",
  schema: "./src/lib/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    // Use DIRECT_URL for migrations (avoids SSL issues with pooler)
    // Falls back to POSTGRES_URL if DIRECT_URL not set
    url: process.env.DIRECT_URL || process.env.POSTGRES_URL!,
    ssl: getSSLConfig(),
  },
  // Ignore PostGIS system tables
  tablesFilter: ["!spatial_ref_sys", "!geography_columns", "!geometry_columns", "!raster_columns", "!raster_overviews"],
} satisfies Config;

/**
 * SSL Configuration - Environment-Gated for Security
 *
 * Development/Local:
 *   - rejectUnauthorized: false (required for Windows + Supabase compatibility)
 *
 * Production/CI:
 *   - Uses system CA certificates (secure)
 *   - Set DRIZZLE_USE_SECURE_SSL=true to enable
 *
 * @returns SSL configuration object
 */
function getSSLConfig() {
  // Production/CI: Use secure SSL with system CAs
  if (process.env.DRIZZLE_USE_SECURE_SSL === "true" || process.env.CI === "true") {
    return {
      rejectUnauthorized: true,
      // Supabase uses standard CAs, no custom cert needed
    };
  }

  // Development: Allow self-signed certs (Windows compatibility)
  return {
    rejectUnauthorized: false,
  };
}
