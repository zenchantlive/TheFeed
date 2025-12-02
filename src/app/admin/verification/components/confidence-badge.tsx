/**
 * Confidence Badge Component
 *
 * Visual indicator showing resource confidence score with color coding:
 * - Green (🟢): 80%+ confidence
 * - Yellow (🟡): 60-79% confidence
 * - Red (🔴): <60% confidence
 */

"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getConfidenceTier } from "../lib/queue-logic";
import type { ConfidenceTier } from "../types";

interface ConfidenceBadgeProps {
  /** Confidence score from 0-1 scale */
  score: number;

  /** Optional breakdown of confidence factors to show in tooltip */
  breakdown?: {
    completeness: number;
    sourceAuthority: number;
    dataFreshness: number;
    multiSourceConfirmation: number;
  };

  /** Size variant */
  size?: "sm" | "md" | "lg";

  /** Show detailed tooltip with breakdown */
  showTooltip?: boolean;
}

/**
 * Get color classes for confidence tier
 */
function getTierColors(tier: ConfidenceTier): {
  bg: string;
  text: string;
  emoji: string;
} {
  switch (tier) {
    case "high":
      return {
        bg: "bg-green-500/10 hover:bg-green-500/20",
        text: "text-green-700 dark:text-green-400",
        emoji: "🟢",
      };
    case "medium":
      return {
        bg: "bg-yellow-500/10 hover:bg-yellow-500/20",
        text: "text-yellow-700 dark:text-yellow-400",
        emoji: "🟡",
      };
    case "low":
      return {
        bg: "bg-red-500/10 hover:bg-red-500/20",
        text: "text-red-700 dark:text-red-400",
        emoji: "🔴",
      };
  }
}

/**
 * Get size classes for badge
 */
function getSizeClasses(size: "sm" | "md" | "lg"): string {
  switch (size) {
    case "sm":
      return "text-xs px-2 py-0.5";
    case "md":
      return "text-sm px-2.5 py-1";
    case "lg":
      return "text-base px-3 py-1.5";
  }
}

export function ConfidenceBadge({
  score,
  breakdown,
  size = "md",
  showTooltip = true,
}: ConfidenceBadgeProps) {
  // Convert 0-1 scale to percentage
  const percent = Math.round(score * 100);

  // Get confidence tier for color coding
  const tier = getConfidenceTier(score);
  const colors = getTierColors(tier);

  // Badge content
  const badgeContent = (
    <Badge
      variant="outline"
      className={`${colors.bg} ${colors.text} ${getSizeClasses(size)} font-semibold border-none`}
    >
      <span className="mr-1">{colors.emoji}</span>
      {percent}%
    </Badge>
  );

  // If no tooltip needed, return badge directly
  if (!showTooltip || !breakdown) {
    return badgeContent;
  }

  // Render with tooltip showing confidence breakdown
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
        <TooltipContent className="w-72 p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Confidence Score</h4>
              <span className="text-lg font-bold">{percent}%</span>
            </div>

            {/* Breakdown */}
            <div className="space-y-2 text-xs">
              <BreakdownRow
                label="Field Completeness"
                score={breakdown.completeness}
                max={40}
              />
              <BreakdownRow
                label="Source Authority"
                score={breakdown.sourceAuthority}
                max={30}
              />
              <BreakdownRow
                label="Data Freshness"
                score={breakdown.dataFreshness}
                max={20}
              />
              {breakdown.multiSourceConfirmation > 0 && (
                <BreakdownRow
                  label="Multi-Source Confirmation"
                  score={breakdown.multiSourceConfirmation}
                  max={10}
                />
              )}
            </div>

            {/* Explanation */}
            <div className="text-xs text-muted-foreground pt-2 border-t">
              {tier === "high" && "High confidence - ready to verify"}
              {tier === "medium" && "Medium confidence - may need review"}
              {tier === "low" && "Low confidence - needs enhancement"}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Single row in confidence breakdown
 */
function BreakdownRow({
  label,
  score,
  max,
}: {
  label: string;
  score: number;
  max: number;
}) {
  // Calculate percentage for this factor
  const percent = (score / max) * 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {score}/{max}
        </span>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
