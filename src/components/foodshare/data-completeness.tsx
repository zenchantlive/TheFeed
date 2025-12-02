/**
 * Data Completeness Component
 *
 * Visualizes how complete the information for a resource is.
 * Encourages users to contribute missing information.
 */

"use client";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HoursType } from "@/lib/schema";

interface DataCompletenessProps {
    location: {
        phone?: string | null;
        website?: string | null;
        hours?: HoursType | null;
        description?: string | null;
        services?: string[] | null;
    };
    onImprove?: () => void;
    className?: string;
}

export function DataCompleteness({ location, onImprove, className }: DataCompletenessProps) {
    // Calculate completeness score
    const fields = [
        { key: "phone", label: "Phone number", present: !!location.phone },
        { key: "website", label: "Website", present: !!location.website },
        { key: "hours", label: "Opening hours", present: !!location.hours },
        { key: "description", label: "Description", present: !!location.description },
        { key: "services", label: "Services", present: (location.services?.length ?? 0) > 0 },
    ];

    const presentCount = fields.filter((f) => f.present).length;
    const totalCount = fields.length;
    const score = Math.round((presentCount / totalCount) * 100);

    const missingFields = fields.filter((f) => !f.present);

    // Determine color based on score
    let colorClass = "bg-red-500";
    if (score >= 80) colorClass = "bg-green-500";
    else if (score >= 50) colorClass = "bg-yellow-500";

    if (score === 100) return null; // Don't show if perfect

    return (
        <div className={cn("rounded-lg border bg-card p-3 shadow-sm", className)}>
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    Listing Completeness
                </h4>
                <span className="text-xs font-bold">{score}%</span>
            </div>

            <Progress value={score} className="h-2 mb-3" indicatorClassName={colorClass} />

            {missingFields.length > 0 && (
                <div className="text-xs text-muted-foreground mb-3">
                    <p className="mb-1">Missing information:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                        {missingFields.slice(0, 3).map((field) => (
                            <li key={field.key}>{field.label}</li>
                        ))}
                        {missingFields.length > 3 && (
                            <li>+ {missingFields.length - 3} more</li>
                        )}
                    </ul>
                </div>
            )}

            {onImprove && (
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-8"
                    onClick={onImprove}
                >
                    <Pencil className="w-3 h-3 mr-2" />
                    Help improve this listing
                </Button>
            )}
        </div>
    );
}
