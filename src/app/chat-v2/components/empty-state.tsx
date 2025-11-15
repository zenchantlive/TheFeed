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
    <div className="flex w-full flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-4xl">
        <span role="img" aria-label="soup">
          🥘
        </span>
      </div>
      <div className="max-w-2xl">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">{headline}</h2>
        <p className="mt-3 text-base text-muted-foreground">{description}</p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border/40 bg-muted/60 px-5 py-2 text-xs font-medium uppercase tracking-[0.35em] text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          Quick starts
        </div>
      </div>
      {children && <div className="mt-8 w-full max-w-2xl">{children}</div>}
    </div>
  );
}
