import { db } from "./db";
import { foodBanks, type HoursType } from "./schema";
import { calculateDistance, isCurrentlyOpen, type Coordinates } from "./geolocation";

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
  limit,
}: FoodBankSearchParams): Promise<FoodBankSearchResult[]> {
  const rows = await getAllFoodBanks();

  const normalizedServices =
    services?.map((service) => service.trim().toLowerCase()).filter(Boolean) ??
    [];

  const results = rows
    .map((row) => {
      const bankServices =
        row.services?.map((service) => service.trim().toLowerCase()) ?? [];
      const matchesServices =
        normalizedServices.length === 0 ||
        normalizedServices.every((service) => bankServices.includes(service));

      const distance = calculateDistance(
        userLocation,
        {
          lat: row.latitude,
          lng: row.longitude,
        }
      );

      const hours = row.hours as HoursType | null | undefined;
      const isOpen = hours ? isCurrentlyOpen(hours) : false;

      return {
        ...row,
        distance,
        isOpen,
        matchesServices,
      };
    })
    .filter((result) => {
      if (Number.isFinite(maxDistance) && result.distance > maxDistance) {
        return false;
      }
      if (openNow && !result.isOpen) {
        return false;
      }
      if (!result.matchesServices) {
        return false;
      }
      return true;
    })
    .sort((a, b) => a.distance - b.distance)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ matchesServices, ...rest }) => rest);

  return typeof limit === "number" ? results.slice(0, limit) : results;
}
