import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  isOpen: boolean;
  className?: string;
  openLabel?: string;
  closedLabel?: string;
};

export function StatusBadge({
  isOpen,
  className,
  openLabel = "Open",
  closedLabel = "Closed",
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        isOpen
          ? "bg-status-open text-status-open-text"
          : "bg-status-closed text-status-closed-text",
        className
      )}
    >
      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {isOpen ? openLabel : closedLabel}
    </span>
  );
}
