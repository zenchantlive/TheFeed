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
    <div className="flex w-full flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16 text-center">
      <div className="mb-5 sm:mb-6 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl sm:rounded-3xl bg-primary/10 text-3xl sm:text-4xl transition-all duration-300 hover:scale-110 hover:bg-primary/15 hover:rotate-6">
        <span role="img" aria-label="soup" className="animate-in fade-in zoom-in duration-500">
          🥘
        </span>
      </div>
      <div className="max-w-2xl">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-3 duration-500">{headline}</h2>
        <p className="mt-2 sm:mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100">{description}</p>
        <div className="mt-4 sm:mt-5 inline-flex items-center gap-2 rounded-full border border-border/40 bg-muted/60 px-4 py-1.5 sm:px-5 sm:py-2 text-[0.65rem] sm:text-xs font-medium uppercase tracking-[0.3em] sm:tracking-[0.35em] text-muted-foreground transition-all duration-200 hover:bg-muted/80 hover:border-border/60 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-200">
          <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-primary animate-pulse" />
          Quick starts
        </div>
      </div>
      {children && <div className="mt-6 sm:mt-8 w-full max-w-2xl animate-in fade-in slide-in-from-bottom-3 duration-500 delay-300">{children}</div>}
    </div>
  );
}
