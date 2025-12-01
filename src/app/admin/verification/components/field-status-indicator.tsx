/**
 * Field Status Indicator Component
 *
 * Shows visual status for resource fields:
 * - ✅ Complete: Field has valid data
 * - ⚠️ Incomplete: Field has data but needs review
 * - ❌ Missing: Field is empty
 */

"use client";

import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import type { FieldStatus } from "../types";

interface FieldStatusIndicatorProps {
  /** Field name to display */
  label: string;

  /** Status of the field */
  status: FieldStatus;

  /** Size variant */
  size?: "sm" | "md" | "lg";

  /** Show only icon (no label) */
  iconOnly?: boolean;
}

/**
 * Get icon component and colors for field status
 */
function getStatusConfig(status: FieldStatus): {
  Icon: typeof CheckCircle2;
  color: string;
  bgColor: string;
} {
  switch (status) {
    case "complete":
      return {
        Icon: CheckCircle2,
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-500/10",
      };
    case "incomplete":
      return {
        Icon: AlertCircle,
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-500/10",
      };
    case "missing":
      return {
        Icon: XCircle,
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-500/10",
      };
  }
}

/**
 * Get icon size based on variant
 */
function getIconSize(size: "sm" | "md" | "lg"): number {
  switch (size) {
    case "sm":
      return 14;
    case "md":
      return 16;
    case "lg":
      return 20;
  }
}

/**
 * Get text size classes
 */
function getTextSize(size: "sm" | "md" | "lg"): string {
  switch (size) {
    case "sm":
      return "text-xs";
    case "md":
      return "text-sm";
    case "lg":
      return "text-base";
  }
}

export function FieldStatusIndicator({
  label,
  status,
  size = "md",
  iconOnly = false,
}: FieldStatusIndicatorProps) {
  const { Icon, color, bgColor } = getStatusConfig(status);
  const iconSize = getIconSize(size);
  const textSize = getTextSize(size);

  // Icon-only mode (compact display)
  if (iconOnly) {
    return (
      <div
        className={`inline-flex items-center justify-center ${bgColor} rounded-full p-1`}
        title={`${label}: ${status}`}
      >
        <Icon size={iconSize} className={color} />
      </div>
    );
  }

  // Full display with label
  return (
    <div
      className={`inline-flex items-center gap-1.5 ${bgColor} rounded-md px-2 py-1`}
    >
      <Icon size={iconSize} className={color} />
      <span className={`${textSize} font-medium ${color}`}>{label}</span>
    </div>
  );
}

/**
 * Compact row of field status indicators
 * Shows multiple fields in a horizontal layout
 */
interface FieldStatusRowProps {
  fields: Array<{
    label: string;
    status: FieldStatus;
  }>;
  size?: "sm" | "md" | "lg";
}

export function FieldStatusRow({ fields, size = "sm" }: FieldStatusRowProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {fields.map((field) => (
        <FieldStatusIndicator
          key={field.label}
          label={field.label}
          status={field.status}
          size={size}
        />
      ))}
    </div>
  );
}

/**
 * Summary indicator showing count of complete/incomplete/missing
 */
interface FieldSummaryProps {
  complete: number;
  incomplete: number;
  missing: number;
  total: number;
}

export function FieldSummary({
  complete,
  incomplete,
  missing,
  total,
}: FieldSummaryProps) {
  // Calculate percentage complete
  const percentComplete = Math.round((complete / total) * 100);

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all"
          style={{ width: `${percentComplete}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <CheckCircle2 size={12} className="text-green-600" />
          <span>{complete} complete</span>
        </div>

        {incomplete > 0 && (
          <div className="flex items-center gap-1">
            <AlertCircle size={12} className="text-yellow-600" />
            <span>{incomplete} incomplete</span>
          </div>
        )}

        {missing > 0 && (
          <div className="flex items-center gap-1">
            <XCircle size={12} className="text-red-600" />
            <span>{missing} missing</span>
          </div>
        )}
      </div>
    </div>
  );
}
