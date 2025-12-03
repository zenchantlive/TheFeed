import { and, asc, count, desc, inArray, not, or, sql, type SQL } from "drizzle-orm";
import { db } from "./db";
import { foodBanks } from "./schema";

const DEFAULT_LIMIT = 20;
const DEFAULT_MISSING_FIELDS: MissingFieldFilter[] = ["hours", "phone", "address"];

export type MissingFieldFilter =
  | "phone"
  | "hours"
  | "website"
  | "description"
  | "address";

export type GetUnverifiedResourcesOptions = {
  limit?: number;
  offset?: number;
  sort?: "newest" | "oldest";
  missingFields?: MissingFieldFilter[];
  requireMissingInfo?: boolean;
  requireCompleteInfo?: boolean;
  onlyPotentialDuplicates?: boolean;
  statuses?: AdminVerificationStatus[];
};

export type AdminResourceRecord = {
  resource: Omit<
    typeof foodBanks.$inferSelect,
    | "geom"
    | "claimedBy"
    | "claimedAt"
    | "providerRole"
    | "providerVerified"
    | "providerCanEdit"
  >;
  missingHours: boolean;
  missingPhone: boolean;
  missingWebsite: boolean;
  missingDescription: boolean;
  missingAddress: boolean;
  potentialDuplicate: boolean;
};

const missingFieldExpressions: Record<MissingFieldFilter, SQL<boolean>> = {
  hours: sql<boolean>`${foodBanks.hours} IS NULL`,
  phone: sql<boolean>`${foodBanks.phone} IS NULL OR ${foodBanks.phone} = ''`,
  website: sql<boolean>`${foodBanks.website} IS NULL OR ${foodBanks.website} = ''`,
  description: sql<boolean>`${foodBanks.description} IS NULL OR ${foodBanks.description} = ''`,
  address: sql<boolean>`
    ${foodBanks.address} IS NULL
    OR ${foodBanks.address} = ''
    OR ${foodBanks.city} IS NULL
    OR ${foodBanks.city} = ''
    OR ${foodBanks.state} IS NULL
    OR ${foodBanks.state} = ''
  `,
};

const potentialDuplicateExpr = sql<boolean>`
  EXISTS (
    SELECT 1 FROM food_banks fb2
    WHERE fb2.id != ${foodBanks.id}
      AND LOWER(fb2.address) = LOWER(${foodBanks.address})
      AND LOWER(fb2.city) = LOWER(${foodBanks.city})
      AND LOWER(fb2.state) = LOWER(${foodBanks.state})
  )
`;

const resourceSelection = {
  id: foodBanks.id,
  name: foodBanks.name,
  address: foodBanks.address,
  city: foodBanks.city,
  state: foodBanks.state,
  zipCode: foodBanks.zipCode,
  latitude: foodBanks.latitude,
  longitude: foodBanks.longitude,
  phone: foodBanks.phone,
  website: foodBanks.website,
  description: foodBanks.description,
  bannerImage: foodBanks.bannerImage,
  services: foodBanks.services,
  hours: foodBanks.hours,
  verificationStatus: foodBanks.verificationStatus,
  importSource: foodBanks.importSource,
  autoDiscoveredAt: foodBanks.autoDiscoveredAt,
  communityVerifiedAt: foodBanks.communityVerifiedAt,
  adminVerifiedBy: foodBanks.adminVerifiedBy,
  adminVerifiedAt: foodBanks.adminVerifiedAt,
  // Pipeline Fields
  confidenceScore: foodBanks.confidenceScore,
  sourceUrl: foodBanks.sourceUrl,
  rawHours: foodBanks.rawHours,
  aiSummary: foodBanks.aiSummary,
  potentialDuplicates: foodBanks.potentialDuplicates,
  createdAt: foodBanks.createdAt,
  updatedAt: foodBanks.updatedAt,
};

export async function getUnverifiedResources(
  options: GetUnverifiedResourcesOptions = {}
): Promise<{ items: AdminResourceRecord[]; total: number }> {
  const limit = Math.min(options.limit ?? DEFAULT_LIMIT, 100);
  const offset = options.offset ?? 0;

  const statuses = options.statuses && options.statuses.length > 0
    ? options.statuses
    : ["unverified"];

  const whereConditions: SQL<boolean>[] = [
    inArray(foodBanks.verificationStatus, statuses) as SQL<boolean>,
  ];

  const requestedFields = options.missingFields?.filter(
    (field): field is MissingFieldFilter =>
      field === "hours" ||
      field === "phone" ||
      field === "website" ||
      field === "description"
  );

  const missingFiltersToUse =
    requestedFields && requestedFields.length > 0
      ? requestedFields
      : options.requireMissingInfo
        ? DEFAULT_MISSING_FIELDS
        : [];

  if (missingFiltersToUse.length > 0) {
    whereConditions.push(
      or(...missingFiltersToUse.map((field) => missingFieldExpressions[field])) as SQL<boolean>
    );
  } else if (options.requireCompleteInfo) {
    // Require that NONE of the default missing fields are true
    const condition = or(
      ...DEFAULT_MISSING_FIELDS.map((field) => missingFieldExpressions[field])
    ) as SQL<boolean> | undefined;
    if (condition) {
      whereConditions.push(not(condition) as SQL<boolean>);
    }
  }

  if (options.onlyPotentialDuplicates) {
    whereConditions.push(potentialDuplicateExpr);
  }

  const whereClause =
    whereConditions.length > 1
      ? and(...whereConditions)
      : whereConditions[0];

  const totalResult = await db
    .select({ count: count() })
    .from(foodBanks)
    .where(whereClause);

  const rows = await db
    .select({
      resource: resourceSelection,
      missingHours: missingFieldExpressions.hours,
      missingPhone: missingFieldExpressions.phone,
      missingWebsite: missingFieldExpressions.website,
      missingDescription: missingFieldExpressions.description,
      missingAddress: missingFieldExpressions.address,
      potentialDuplicate: potentialDuplicateExpr,
    })
    .from(foodBanks)
    .where(whereClause)
    .orderBy(
      options.sort === "oldest"
        ? asc(foodBanks.createdAt)
        : desc(foodBanks.createdAt)
    )
    .limit(limit)
    .offset(offset);

  return {
    items: rows,
    total: Number(totalResult[0]?.count ?? 0),
  };
}

export const ADMIN_ALLOWED_STATUSES = [
  "unverified",
  "community_verified",
  "official",
  "rejected",
  "duplicate",
] as const;

export type AdminVerificationStatus = (typeof ADMIN_ALLOWED_STATUSES)[number];

export async function batchUpdateStatus(
  ids: string[],
  status: AdminVerificationStatus,
  adminUserId: string
): Promise<{ updatedIds: string[] }> {
  if (!ids.length) {
    return { updatedIds: [] };
  }

  if (!ADMIN_ALLOWED_STATUSES.includes(status)) {
    throw new Error(`Unsupported status: ${status}`);
  }

  const now = new Date();
  const updatePayload: Partial<typeof foodBanks.$inferInsert> = {
    verificationStatus: status,
    updatedAt: now,
  };

  if (status === "official" || status === "community_verified") {
    updatePayload.adminVerifiedBy = adminUserId;
  } else if (status === "unverified") {
    updatePayload.adminVerifiedBy = null;
  }

  const updatedRecords = await db
    .update(foodBanks)
    .set(updatePayload)
    .where(inArray(foodBanks.id, ids))
    .returning({ id: foodBanks.id });

  return { updatedIds: updatedRecords.map((record) => record.id) };
}

export type ResourceStats = {
  unverified: number;
  communityVerified: number;
  official: number;
  rejected: number;
  duplicate: number;
  total: number;
};

export async function getResourceStats(): Promise<ResourceStats> {
  const rows = await db
    .select({
      status: foodBanks.verificationStatus,
      count: count(),
    })
    .from(foodBanks)
    .groupBy(foodBanks.verificationStatus);

  const stats: ResourceStats = {
    unverified: 0,
    communityVerified: 0,
    official: 0,
    rejected: 0,
    duplicate: 0,
    total: 0,
  };

  for (const row of rows) {
    const value = Number(row.count ?? 0);
    stats.total += value;

    switch (row.status) {
      case "unverified":
        stats.unverified = value;
        break;
      case "community_verified":
        stats.communityVerified = value;
        break;
      case "official":
        stats.official = value;
        break;
      case "rejected":
        stats.rejected = value;
        break;
      case "duplicate":
        stats.duplicate = value;
        break;
    }
  }

  return stats;
}
