import {
  getResourceStats,
  getUnverifiedResources,
  type AdminResourceRecord,
} from "@/lib/admin-queries";
import VerificationPageClient, {
  type SerializedAdminResource,
  type VerificationPageData,
} from "./page-client";

const DEFAULT_LIMIT = 20;

function serializeResource(
  record: AdminResourceRecord
): SerializedAdminResource {
  const { resource, ...flags } = record;
  const serializeDate = (value: Date | null | undefined) =>
    value ? value.toISOString() : null;

  return {
    ...flags,
    resource: {
      ...resource,
      services: resource.services ?? [],
      hours: resource.hours
        ? (resource.hours as SerializedAdminResource["resource"]["hours"])
        : null,
      autoDiscoveredAt: serializeDate(resource.autoDiscoveredAt),
      communityVerifiedAt: serializeDate(resource.communityVerifiedAt),
      createdAt: serializeDate(resource.createdAt),
      updatedAt: serializeDate(resource.updatedAt),
    },
  };
}

export default async function VerificationPage() {
  const [resources, stats] = await Promise.all([
    getUnverifiedResources({ limit: DEFAULT_LIMIT, sort: "newest" }),
    getResourceStats(),
  ]);

  const initialData: VerificationPageData = {
    items: resources.items.map(serializeResource),
    pagination: {
      limit: DEFAULT_LIMIT,
      offset: 0,
      total: resources.total,
    },
    filters: {
      sort: "newest",
      requireMissingInfo: false,
      onlyPotentialDuplicates: false,
      missingFields: [],
    },
    stats,
  };

  return <VerificationPageClient initialData={initialData} />;
}
