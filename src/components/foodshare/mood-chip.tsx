import { cn } from "@/lib/utils";

export type Mood = "hungry" | "full";

type MoodChipProps = {
  mood: Mood;
  compact?: boolean;
  className?: string;
};

const moodCopy: Record<Mood, { label: string; caption: string }> = {
  hungry: { label: "I'm hungry", caption: "Need a bite" },
  full: { label: "I'm full", caption: "Got leftovers" },
};

export function MoodChip({ mood, compact = false, className }: MoodChipProps) {
  const copy = moodCopy[mood];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border/80 bg-secondary/70 px-3 py-1 text-xs font-semibold text-muted-foreground shadow-sm",
        mood === "hungry" && "bg-[rgba(244,162,97,0.12)] text-accent border-accent/30",
        mood === "full" && "bg-[rgba(143,169,152,0.15)] text-primary border-primary/30",
        className
      )}
    >
      <span className="text-lg" aria-hidden>
        {mood === "hungry" ? "🍽️" : "🥡"}
      </span>
      <span className="flex flex-col leading-none">
        <span>{copy.label}</span>
        {compact ? null : (
          <span className="text-[0.6rem] font-medium uppercase tracking-[0.16em] text-muted-foreground opacity-80">
            {copy.caption}
          </span>
        )}
      </span>
    </span>
  );
}
