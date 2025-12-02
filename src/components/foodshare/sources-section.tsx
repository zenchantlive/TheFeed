/**
 * Sources Section Component
 *
 * Displays the sources of information for a resource to build trust.
 * Shows where the data came from (e.g., "Official Website", "Community Submission").
 */

"use client";

import { ExternalLink, Globe, Users, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Source {
    type: "official" | "community" | "aggregator" | "system";
    label: string;
    url?: string;
    date?: Date | string;
}

interface SourcesSectionProps {
    sources: Source[];
    className?: string;
}

function getSourceIcon(type: Source["type"]) {
    switch (type) {
        case "official":
            return Globe;
        case "community":
            return Users;
        case "aggregator":
        case "system":
        default:
            return Database;
    }
}

export function SourcesSection({ sources, className }: SourcesSectionProps) {
    if (!sources || sources.length === 0) return null;

    return (
        <div className={className}>
            <h4 className="text-sm font-semibold mb-2 text-foreground/80">Data Sources</h4>
            <div className="space-y-2">
                {sources.map((source, index) => {
                    const Icon = getSourceIcon(source.type);
                    const dateStr = source.date
                        ? new Date(source.date).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                        })
                        : null;

                    return (
                        <div
                            key={index}
                            className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50 text-sm"
                        >
                            <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{source.label}</span>
                                {dateStr && (
                                    <span className="text-xs text-muted-foreground border-l pl-2 ml-1">
                                        {dateStr}
                                    </span>
                                )}
                            </div>
                            {source.url && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs text-primary hover:text-primary/80"
                                    asChild
                                >
                                    <a
                                        href={source.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1"
                                    >
                                        View <ExternalLink className="w-3 h-3" />
                                    </a>
                                </Button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
