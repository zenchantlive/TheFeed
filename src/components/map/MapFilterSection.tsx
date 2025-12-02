import { Button } from "@/components/ui/button";

type MapFilterSectionProps = {
    eventTypeFilter: "all" | "potluck" | "volunteer";
    setEventTypeFilter: (type: "all" | "potluck" | "volunteer") => void;
    dateRangeFilter: "week" | "month";
    setDateRangeFilter: (range: "week" | "month") => void;
    postKindFilter: "all" | "share" | "request";
    setPostKindFilter: (kind: "all" | "share" | "request") => void;
    isLoadingEvents: boolean;
    isLoadingPosts: boolean;
};

/**
 * Component to display filter buttons for Events and Posts.
 * Allows users to toggle between different types and time ranges.
 */
export function MapFilterSection({
    eventTypeFilter,
    setEventTypeFilter,
    dateRangeFilter,
    setDateRangeFilter,
    postKindFilter,
    setPostKindFilter,
    isLoadingEvents,
    isLoadingPosts,
}: MapFilterSectionProps) {
    return (
        <>
            {/* Event Filters */}
            <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Event filters
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {["all", "potluck", "volunteer"].map((type) => (
                        <Button
                            key={type}
                            size="sm"
                            variant={eventTypeFilter === type ? "default" : "secondary"}
                            className="rounded-full"
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
                <div className="flex flex-wrap items-center gap-2">
                    {["week", "month"].map((range) => (
                        <Button
                            key={range}
                            size="sm"
                            variant={dateRangeFilter === range ? "default" : "secondary"}
                            className="rounded-full"
                            onClick={() =>
                                setDateRangeFilter(range as typeof dateRangeFilter)
                            }
                        >
                            {range === "week" ? "This week" : "This month"}
                        </Button>
                    ))}
                    {isLoadingEvents && (
                        <span className="text-xs text-muted-foreground">
                            Loading events…
                        </span>
                    )}
                </div>
            </div>

            {/* Post Filters */}
            <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Community posts
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {["all", "share", "request"].map((kind) => (
                        <Button
                            key={kind}
                            size="sm"
                            variant={postKindFilter === kind ? "default" : "secondary"}
                            className="rounded-full"
                            onClick={() =>
                                setPostKindFilter(kind as typeof postKindFilter)
                            }
                        >
                            {kind === "all" && "All posts"}
                            {kind === "share" && "🍽️ Shares"}
                            {kind === "request" && "🙏 Requests"}
                        </Button>
                    ))}
                    {isLoadingPosts && (
                        <span className="text-xs text-muted-foreground">
                            Loading posts…
                        </span>
                    )}
                </div>
            </div>
        </>
    );
}
