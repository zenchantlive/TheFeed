"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

interface EmptyStateProps {
  headline?: string;
  description?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  headline = "Welcome to TheFeed Sous-Chef",
  description = "Your AI neighbor for food resources and community support",
  children,
}: EmptyStateProps) {
  return (
    <div className="flex w-full flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-16 text-center">
      <div className="mb-4 sm:mb-6 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl sm:rounded-3xl bg-primary/10 text-3xl sm:text-4xl">
        <span role="img" aria-label="soup">
          🥘
        </span>
      </div>
      <div className="max-w-full sm:max-w-2xl px-2">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">{headline}</h2>
        <p className="mt-2 sm:mt-3 text-sm sm:text-base text-muted-foreground">{description}</p>
        <div className="mt-4 sm:mt-5 inline-flex items-center gap-2 rounded-full border border-border/40 bg-muted/60 px-4 sm:px-5 py-2 text-xs font-medium uppercase tracking-[0.3em] sm:tracking-[0.35em] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
          Quick starts
        </div>
      </div>
      {children && <div className="mt-6 sm:mt-8 w-full max-w-full sm:max-w-2xl px-2 sm:px-4">{children}</div>}
    </div>
  );
}
