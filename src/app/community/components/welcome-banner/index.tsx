"use client";

import { useEffect, useState } from "react";
import { getTimeBasedQuote } from "./quotes";

/**
 * Welcome Banner
 *
 * Warm greeting with community context.
 * Subtle cork board texture hint in background.
 */
export function WelcomeBanner() {
  const [quote, setQuote] = useState("");

  useEffect(() => {
    setQuote(getTimeBasedQuote());
  }, []);

  return (
    <section
      className="relative overflow-hidden rounded-xl border-2 border-amber-200/60 bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-amber-50/80 px-6 py-8 shadow-sm dark:border-slate-700/60 dark:from-slate-800/90 dark:via-slate-800/80 dark:to-slate-700/90"
    >
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-multiply dark:opacity-[0.05]"
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
           }}
      />

      {/* Content */}
      <div className="relative space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-amber-900 dark:text-amber-100 md:text-3xl">
          {quote || "Welcome to the neighborhood!"}
        </h2>
        <p className="text-sm text-amber-800/80 dark:text-slate-300 md:text-base">
          A neighbor-powered potluck feed for Midtown Sacramento
        </p>
      </div>

      {/* Decorative corner accent */}
      <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-amber-200/30 blur-2xl dark:bg-slate-600/20" />
      <div className="absolute -bottom-4 -left-4 h-12 w-12 rounded-full bg-orange-200/30 blur-xl dark:bg-slate-600/20" />
    </section>
  );
}
