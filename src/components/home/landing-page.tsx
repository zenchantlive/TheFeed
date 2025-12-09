"use client";

import Link from "next/link";
import { ArrowRight, HeartHandshake, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

// Wireframe (mobile-first):
// 1) Gradient shell with blur ambience behind a compact glass card frame.
// 2) Centered headline stack with condensed copy and a pill badge (hidden on xs to save height).
// 3) Two action cards aligned in a single grid row on mobile with tightened padding and short bullets.
// 4) Secondary links tucked below the frame on sm+ only to preserve first-screen height.
export function LandingPage() {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-background">
            {/* Background ambience - subtle gradients */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[18%] -left-[12%] h-[65vh] w-[65vh] rounded-full bg-amber-500/10 blur-[100px] animate-pulse-slow" />
                <div className="absolute top-[36%] -right-[12%] h-[65vh] w-[65vh] rounded-full bg-emerald-500/10 blur-[100px] animate-pulse-slow delay-1000" />
            </div>

            <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center px-3 py-3 sm:px-5 md:px-8 lg:px-10">
                {/* Main glass card container */}
                <div className="w-full max-w-5xl rounded-3xl border border-white/15 bg-background/70 backdrop-blur-2xl shadow-2xl px-4 py-5 sm:px-5 sm:py-6 md:px-8 md:py-10 ring-1 ring-white/10 dark:ring-white/5">
                    <div className="flex flex-col items-center text-center mb-4 sm:mb-6 space-y-2 sm:space-y-3">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight leading-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                            Nourishing Neighborhoods.
                        </h1>
                        <p className="max-w-[560px] text-sm sm:text-base text-muted-foreground md:text-lg text-balance">
                            Food support and neighbors who show up. Trustworthy, anonymous, and free.
                        </p>
                        <p className="hidden sm:inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Serving 146 communities nationwide
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 md:gap-6 lg:gap-8">
                        {/* Crisis path card */}
                        <Link
                            href="/map"
                            className={cn(
                                "group relative flex flex-col items-start justify-between overflow-hidden rounded-2xl border px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 transition-all hover:shadow-2xl hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-amber-500/50",
                                "bg-gradient-to-br from-amber-50/60 to-amber-100/30 dark:from-amber-950/20 dark:to-amber-900/10",
                                "border-amber-200/50 dark:border-amber-800/50 hover:border-amber-400 dark:hover:border-amber-600"
                            )}
                        >
                            <div className="relative z-10 space-y-3">
                                <div className="inline-flex items-center justify-center rounded-xl bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400">
                                    <Utensils className="h-6 w-6 sm:h-7 sm:w-7" />
                                </div>
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground group-hover:text-amber-700 dark:group-hover:text-amber-400">
                                        I Need Food
                                    </h2>
                                    <p className="mt-1.5 text-sm text-muted-foreground">
                                        Find nearby pantries, food banks, and free meals—no sign-in required.
                                    </p>
                                </div>
                                <ul className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                                    <li className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Instant map of what&apos;s open
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Filter by meals, produce, or pantry
                                    </li>
                                </ul>
                            </div>
                            <div className="relative z-10 mt-4 flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                                Find Food <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </div>

                            {/* Decorative background glow */}
                            <div className="absolute -right-12 -bottom-12 h-32 w-32 rounded-full bg-amber-500/10 blur-3xl group-hover:bg-amber-500/20 transition-all duration-500" />
                        </Link>

                        {/* Community path card */}
                        <Link
                            href="/community"
                            className={cn(
                                "group relative flex flex-col items-start justify-between overflow-hidden rounded-2xl border px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 transition-all hover:shadow-2xl hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-emerald-500/50",
                                "bg-gradient-to-br from-emerald-50/60 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10",
                                "border-emerald-200/50 dark:border-emerald-800/50 hover:border-emerald-400 dark:hover:border-emerald-600"
                            )}
                        >
                            <div className="relative z-10 space-y-3">
                                <div className="inline-flex items-center justify-center rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
                                    <HeartHandshake className="h-6 w-6 sm:h-7 sm:w-7" />
                                </div>
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                                        Share & Connect
                                    </h2>
                                    <p className="mt-1.5 text-sm text-muted-foreground">
                                        Share surplus, organize neighbors, and build trust around the table.
                                    </p>
                                </div>
                                <ul className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                                    <li className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Offer meals or groceries quickly
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Host potlucks or pantry swaps
                                    </li>
                                </ul>
                            </div>
                            <div className="relative z-10 mt-4 flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                Join Community <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </div>

                            {/* Decorative background glow */}
                            <div className="absolute -right-12 -bottom-12 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500" />
                        </Link>
                    </div>
                </div>

                {/* Secondary links (hide on xs to save vertical space) */}
                <div className="hidden sm:flex mt-5 md:mt-7 gap-5 text-sm text-muted-foreground">
                    <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
                    <Link href="/help" className="hover:text-foreground transition-colors">Help</Link>
                    <Link href="/legal/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
                </div>
            </div>
        </div>
    );
}
