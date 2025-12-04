import { db } from "./db";
import { foodBanks, type HoursType } from "./schema";
import { sql } from "drizzle-orm";
import { isCurrentlyOpen, type Coordinates } from "./geolocation";

export type FoodBankRecord = typeof foodBanks.$inferSelect;

export type FoodBankSearchParams = {
  userLocation: Coordinates;
  maxDistance?: number;
  openNow?: boolean;
  services?: string[];
  limit?: number;
};

export type FoodBankSearchResult = FoodBankRecord & {
  distance: number;
  isOpen: boolean;
};

export async function getAllFoodBanks(): Promise<FoodBankRecord[]> {
  return db.query.foodBanks.findMany();
}

export async function getFoodBankById(
  id: string
): Promise<FoodBankRecord | undefined> {
  return db.query.foodBanks.findFirst({
    where: (fb, { eq }) => eq(fb.id, id),
  });
}

export async function searchFoodBanks({
  userLocation,
  maxDistance = 10,
  openNow = false,
  services = [],
  limit = 50,
}: FoodBankSearchParams): Promise<FoodBankSearchResult[]> {
  const normalizedServices =
    services?.map((service) => service.trim().toLowerCase()).filter(Boolean) ??
    [];

  // Convert maxDistance from miles to meters for PostGIS
  const maxDistanceMeters = maxDistance * 1609.34;

  // Use PostGIS for spatial query
  // We use ST_DWithin for efficient index usage
  // We reuse the point construction for readability and performance
  const query = sql`
    WITH user_point AS (
      SELECT ST_SetSRID(ST_MakePoint(${userLocation.lng}, ${userLocation.lat}), 4326)::geography AS point
    )
    SELECT
      *,
      ST_Distance(
        geom::geography,
        (SELECT point FROM user_point)
      ) as distance_meters
    FROM food_banks
    WHERE 
      ST_DWithin(
        geom::geography,
        (SELECT point FROM user_point),
        ${maxDistanceMeters}
      )
    ORDER BY distance_meters ASC
  `;

  // Add service filtering if needed (done in memory for now as services are arrays)
  // Note: For 50k+ scale, we should move services to a separate table or use GIN index on array

  const result = await db.execute(query);
  const rows = ("rows" in result ? result.rows : result) as (FoodBankRecord & { distance_meters: number })[];

  return rows
    .map((row) => {
      const bankServices =
        row.services?.map((service) => service.trim().toLowerCase()) ?? [];
      const matchesServices =
        normalizedServices.length === 0 ||
        normalizedServices.every((service) => bankServices.includes(service));

      const distanceMiles = row.distance_meters / 1609.34;

      const hours = row.hours as HoursType | null | undefined;
      const isOpen = hours ? isCurrentlyOpen(hours) : false;

      return {
        ...row,
        distance: distanceMiles,
        isOpen,
        matchesServices,
      };
    })
    .filter((result) => {
      if (openNow && !result.isOpen) {
        return false;
      }
      if (!result.matchesServices) {
        return false;
      }
      return true;
    })
    .slice(0, limit);
}

