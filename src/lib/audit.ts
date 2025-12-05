/**
 * Admin Audit Logging
 *
 * Tracks all administrative actions for security, compliance, and accountability.
 */

import { db } from "./db";
import { adminAuditLog } from "./schema";
import { eq } from "drizzle-orm";

export async function logAdminAction(params: {
  adminId: string;
  action: string;
  resourceId?: string;
  affectedIds?: string[];
  changes?: Record<string, { old: unknown; new: unknown }>;
  reason?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  await db.insert(adminAuditLog).values({
    adminId: params.adminId,
    action: params.action,
    resourceId: params.resourceId,
    affectedIds: params.affectedIds,
    changes: params.changes,
    reason: params.reason,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}

export async function getAdminActions(adminId: string, limit = 50) {
  return db
    .select()
    .from(adminAuditLog)
    .where(eq(adminAuditLog.adminId, adminId))
    .orderBy(adminAuditLog.createdAt)
    .limit(limit);
}

export async function getResourceAuditTrail(resourceId: string) {
  return db
    .select()
    .from(adminAuditLog)
    .where(eq(adminAuditLog.resourceId, resourceId))
    .orderBy(adminAuditLog.createdAt);
}
