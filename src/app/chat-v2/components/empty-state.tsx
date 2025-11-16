"use client";

import * as React from "react";

interface EmptyStateProps {
  headline?: string;
  description?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  headline = "Hi, I'm Sous-Chef",
  description = "Your personal guide to TheFeed. Ask me to find a potluck, browse the pantry, or get assistance.",
  children,
}: EmptyStateProps) {
  return (
    <div className="flex w-full flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16 text-center">
      <div className="max-w-2xl space-y-4 sm:space-y-6">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white animate-in fade-in slide-in-from-bottom-3 duration-500">
          {headline}
        </h2>
        <p className="text-base sm:text-lg text-white/80 leading-relaxed max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100">
          {description}
        </p>
      </div>
      {children && <div className="mt-8 sm:mt-10 w-full max-w-3xl animate-in fade-in slide-in-from-bottom-3 duration-500 delay-200">{children}</div>}
    </div>
  );
}
