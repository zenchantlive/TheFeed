/**
 * Resource Versioning System
 *
 * Provides complete change history and rollback capability for food bank resources.
 */

import { db } from "./db";
import { foodBanks, resourceVersions } from "./schema";
import { eq } from "drizzle-orm";

export async function createResourceVersion(
  resourceId: string,
  changedBy: string,
  changeReason: string,
  changedFields?: string[],
  sources?: string[]
) {
  // Get current resource state
  const [resource] = await db
    .select()
    .from(foodBanks)
    .where(eq(foodBanks.id, resourceId));

  if (!resource) throw new Error("Resource not found");

  // Get current version number
  const versions = await db
    .select()
    .from(resourceVersions)
    .where(eq(resourceVersions.resourceId, resourceId));

  const nextVersion = versions.length + 1;

  // Create version snapshot
  await db.insert(resourceVersions).values({
    resourceId,
    version: nextVersion,
    snapshot: resource as any,
    changedFields,
    changedBy,
    changeReason,
    sources,
  });

  return nextVersion;
}

export async function getResourceHistory(resourceId: string) {
  return db
    .select()
    .from(resourceVersions)
    .where(eq(resourceVersions.resourceId, resourceId))
    .orderBy(resourceVersions.version);
}

export async function rollbackResourceVersion(
  resourceId: string,
  targetVersion: number,
  rolledBackBy: string
) {
  // Get target version
  const versions = await db
    .select()
    .from(resourceVersions)
    .where(eq(resourceVersions.resourceId, resourceId));

  const version = versions.find(v => v.version === targetVersion);

  if (!version) throw new Error("Version not found");

  // Restore snapshot
  const snapshot = version.snapshot as any;
  await db
    .update(foodBanks)
    .set({
      ...snapshot,
      updatedAt: new Date(),
    })
    .where(eq(foodBanks.id, resourceId));

  // Create new version showing rollback
  await createResourceVersion(
    resourceId,
    rolledBackBy,
    `rollback_to_v${targetVersion}`,
    Object.keys(snapshot),
    []
  );
}
