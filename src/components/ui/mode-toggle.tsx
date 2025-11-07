"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition hover:border-primary/40 hover:text-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      )}
      aria-pressed={isDark}
    >
      <span
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary transition",
          isDark && "bg-accent/20 text-accent"
        )}
        aria-hidden
      >
        <Sun
          className={cn(
            "h-3.5 w-3.5 transition-all",
            isDark ? "scale-0 opacity-0" : "scale-100 opacity-100"
          )}
        />
        <Moon
          className={cn(
            "absolute h-3.5 w-3.5 transition-all",
            isDark ? "scale-100 opacity-100" : "scale-0 opacity-0"
          )}
        />
      </span>
      <span className="flex flex-col leading-4 text-left">
        <span className="text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
          {isDark ? "Night bites" : "Lights on"}
        </span>
        <span className="text-[0.8rem] font-semibold text-foreground">
          {isDark ? "Cozy mode" : "Sunny mode"}
        </span>
      </span>
    </button>
  );
}
