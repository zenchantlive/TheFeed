import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.POSTGRES_URL as string;

if (!connectionString) {
  throw new Error("POSTGRES_URL environment variable is not set");
}

// CRITICAL: Configure for Supabase transaction pooling (Supavisor)
// See: https://supabase.com/docs/guides/database/connecting-to-postgres/serverless-drivers
const client = postgres(connectionString, {
  prepare: false, // Required for Supabase transaction mode pooling
  max: 10,        // Allow more connections for parallel RSC requests
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Timeout after 10 seconds if connection fails
});

export const db = drizzle(client, { schema });
