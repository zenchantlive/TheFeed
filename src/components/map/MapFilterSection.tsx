import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { useState } from "react";


type MapFilterSectionProps = {
    eventTypeFilter: "all" | "potluck" | "volunteer";
    setEventTypeFilter: (type: "all" | "potluck" | "volunteer") => void;
    dateRangeFilter: "week" | "month";
    setDateRangeFilter: (range: "week" | "month") => void;
    // Removed postKindFilter props as posts are no longer displayed
    isLoadingEvents: boolean;
};

/**
 * Component to display filter buttons for Events.
 * Allows users to toggle between different types and time ranges.
 * Minimizable to save space.
 */
export function MapFilterSection({
    eventTypeFilter,
    setEventTypeFilter,
    dateRangeFilter,
    setDateRangeFilter,
    isLoadingEvents,
}: MapFilterSectionProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="space-y-2 rounded-xl border border-border/40 bg-card/30 p-2">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
            >
                <div className="flex items-center gap-2">
                    <Filter className="h-3 w-3" />
                    <span>Event Filters</span>
                </div>
                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {isExpanded && (
                <div className="space-y-3 pt-2 animate-in slide-in-from-top-1 fade-in duration-200">
                    <div className="space-y-1.5">
                        <span className="text-[10px] text-muted-foreground">Type</span>
                        <div className="flex flex-wrap items-center gap-2">
                            {["all", "potluck", "volunteer"].map((type) => (
                                <Button
                                    key={type}
                                    size="sm"
                                    variant={eventTypeFilter === type ? "default" : "secondary"}
                                    className="h-7 rounded-full px-3 text-xs"
                                    onClick={() =>
                                        setEventTypeFilter(type as typeof eventTypeFilter)
                                    }
                                >
                                    {type === "all"
                                        ? "All"
                                        : type === "potluck"
                                            ? "Potluck"
                                            : "Volunteer"}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <span className="text-[10px] text-muted-foreground">Time</span>
                        <div className="flex flex-wrap items-center gap-2">
                            {["week", "month"].map((range) => (
                                <Button
                                    key={range}
                                    size="sm"
                                    variant={dateRangeFilter === range ? "default" : "secondary"}
                                    className="h-7 rounded-full px-3 text-xs"
                                    onClick={() =>
                                        setDateRangeFilter(range as typeof dateRangeFilter)
                                    }
                                >
                                    {range === "week" ? "This week" : "This month"}
                                </Button>
                            ))}
                            {isLoadingEvents && (
                                <span className="text-xs text-muted-foreground animate-pulse">
                                    Loading…
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
