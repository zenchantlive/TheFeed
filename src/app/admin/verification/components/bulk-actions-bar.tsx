/**
 * Bulk Actions Bar Component
 *
 * Sticky toolbar shown when one or more resources are selected.
 * Provides actions to perform on all selected resources at once.
 */

"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles, XCircle, X } from "lucide-react";

interface BulkActionsBarProps {
  /** Number of selected resources */
  selectedCount: number;

  /** Action callbacks */
  onVerify?: () => void;
  onEnhance?: () => void;
  onReject?: () => void;

  /** Clear selection */
  onClear: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onVerify,
  onEnhance,
  onReject,
  onClear,
}: BulkActionsBarProps) {
  return (
    <div className="sticky top-0 z-10 mb-4">
      {/* Backdrop blur effect */}
      <div
        className="
          bg-primary/10 backdrop-blur-sm border-2 border-primary
          rounded-lg p-4 shadow-lg
        "
      >
        <div className="flex items-center justify-between gap-4">
          {/* Selection count */}
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground text-sm font-bold px-3 py-1.5 rounded-md">
              {selectedCount}
            </div>
            <span className="text-sm font-medium">
              {selectedCount === 1
                ? "resource selected"
                : "resources selected"}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Verify all */}
            {onVerify && (
              <Button
                size="sm"
                onClick={onVerify}
                className="gap-2"
              >
                <CheckCircle size={16} />
                <span className="hidden sm:inline">
                  Verify All ({selectedCount})
                </span>
                <span className="sm:hidden">Verify</span>
              </Button>
            )}

            {/* Enhance all */}
            {onEnhance && (
              <Button
                size="sm"
                variant="secondary"
                onClick={onEnhance}
                className="gap-2"
              >
                <Sparkles size={16} />
                <span className="hidden sm:inline">
                  Batch Enhance
                </span>
                <span className="sm:hidden">Enhance</span>
              </Button>
            )}

            {/* Reject all */}
            {onReject && (
              <Button
                size="sm"
                variant="destructive"
                onClick={onReject}
                className="gap-2"
              >
                <XCircle size={16} />
                <span className="hidden sm:inline">
                  Reject All
                </span>
                <span className="sm:hidden">Reject</span>
              </Button>
            )}

            {/* Clear selection */}
            <Button
              size="sm"
              variant="ghost"
              onClick={onClear}
              className="gap-2"
            >
              <X size={16} />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          </div>
        </div>

        {/* Warning for large selections */}
        {selectedCount > 10 && (
          <div className="mt-3 pt-3 border-t border-primary/20">
            <p className="text-xs text-muted-foreground">
              ⚠️ Bulk actions on {selectedCount} resources may take a few
              minutes. Please be patient.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
