type LocationStatus = "idle" | "loading" | "ready" | "error";

type ChatHeaderProps = {
  userName?: string | null;
  locationLabel?: string | null;
  locationStatus?: LocationStatus;
  onRefreshLocation?: () => void;
};

/**
 * Simple, professional header that keeps the assistant always visible.
 */
export function ChatHeader({
  userName,
  locationLabel,
  locationStatus = "idle",
  onRefreshLocation,
}: ChatHeaderProps) {
  const firstName = userName?.split(" ")[0];

  const locationMessage =
    locationStatus === "loading"
      ? "Detecting your location for better recommendations…"
      : locationStatus === "error"
      ? "We couldn't detect your location. Try refreshing or enter a ZIP in chat."
      : locationLabel
      ? `Focusing on options near ${locationLabel}.`
      : "Share your location for hyperlocal suggestions.";

  return (
    <header className="rounded-3xl border border-border bg-card/60 p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        TheFeed Sous-Chef
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-foreground">
        {firstName ? `How can I help you today, ${firstName}?` : "How can I help you today?"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your food + community AI. Ask for nearby resources, community posts, events, or ways to share and help.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>{locationMessage}</span>
        {onRefreshLocation ? (
          <button
            type="button"
            className="font-semibold text-primary transition hover:opacity-80 disabled:opacity-40"
            onClick={onRefreshLocation}
            disabled={locationStatus === "loading"}
          >
            Refresh location
          </button>
        ) : null}
      </div>
    </header>
  );
}
