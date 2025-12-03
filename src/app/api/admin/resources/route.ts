"use server";

import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_ALLOWED_STATUSES,
  batchUpdateStatus,
  getResourceStats,
  getUnverifiedResources,
  type AdminVerificationStatus,
  type MissingFieldFilter,
} from "@/lib/admin-queries";
import { withAdminAuth } from "@/lib/auth/admin";

const parsePositiveInt = (value: string | null, fallback: number) => {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const parseMissingFields = (
  value: string | null
): MissingFieldFilter[] | undefined => {
  if (!value) return undefined;
  const allowed: MissingFieldFilter[] = [
    "hours",
    "phone",
    "website",
    "description",
    "address",
  ];
  const fields = value
    .split(",")
    .map((field) => field.trim().toLowerCase())
    .filter((field): field is MissingFieldFilter =>
      allowed.includes(field as MissingFieldFilter)
    );
  return fields.length ? fields : undefined;
};

export const GET = withAdminAuth<NextRequest>(async (request) => {
  const searchParams = request.nextUrl.searchParams;
  const limit = parsePositiveInt(searchParams.get("limit"), 20);
  const offset = parsePositiveInt(searchParams.get("offset"), 0);
  const sort = searchParams.get("sort") === "oldest" ? "oldest" : "newest";
  const requireMissingInfo = searchParams.get("missingOnly") === "true";
  const requireCompleteInfo = searchParams.get("completeOnly") === "true";
  const onlyPotentialDuplicates = searchParams.get("duplicates") === "only";
  const missingFields = parseMissingFields(searchParams.get("missing"));
  const showArchived = searchParams.get("archived") === "true";

  const statuses: AdminVerificationStatus[] = showArchived
    ? ["official", "community_verified", "rejected", "duplicate"]
    : ["unverified"];

  const [{ items, total }, stats] = await Promise.all([
    getUnverifiedResources({
      limit,
      offset,
      sort,
      requireMissingInfo,
      requireCompleteInfo,
      onlyPotentialDuplicates,
      missingFields,
      statuses,
    }),
    getResourceStats(),
  ]);

  return NextResponse.json({
    items,
    pagination: {
      limit,
      offset,
      total,
    },
    filters: {
      sort,
      requireMissingInfo,
      requireCompleteInfo,
      onlyPotentialDuplicates,
      missingFields,
      showArchived,
    },
    stats,
  });
});

type BatchUpdatePayload = {
  ids?: unknown;
  status?: unknown;
};

export const POST = withAdminAuth(async (request, adminSession) => {
  let payload: BatchUpdatePayload;
  try {
    payload = (await request.json()) as BatchUpdatePayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const ids = Array.isArray(payload.ids)
    ? payload.ids.filter(
      (id): id is string => typeof id === "string" && id.trim().length > 0
    )
    : [];

  const status = payload.status;

  if (ids.length === 0) {
    return NextResponse.json(
      { error: "At least one resource id is required" },
      { status: 400 }
    );
  }

  if (typeof status !== "string") {
    return NextResponse.json(
      { error: "A verification status is required" },
      { status: 400 }
    );
  }

  if (!ADMIN_ALLOWED_STATUSES.includes(status as AdminVerificationStatus)) {
    return NextResponse.json(
      { error: "Unsupported verification status" },
      { status: 400 }
    );
  }

  const { updatedIds } = await batchUpdateStatus(
    ids,
    status as AdminVerificationStatus,
    adminSession.userId
  );

  return NextResponse.json({
    updatedIds,
    status,
  });
});
