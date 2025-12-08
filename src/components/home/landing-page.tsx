"use client";

import Link from "next/link";
import { ArrowRight, HeartHandshake, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

export function LandingPage() {
    return (
        <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden bg-background">
            {/* Background Ambience - Subtle gradients */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[20%] -left-[10%] h-[70vh] w-[70vh] rounded-full bg-amber-500/10 blur-[100px] animate-pulse-slow" />
                <div className="absolute top-[40%] -right-[10%] h-[70vh] w-[70vh] rounded-full bg-emerald-500/10 blur-[100px] animate-pulse-slow delay-1000" />
            </div>

            <div className="relative z-10 flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center p-4 md:p-8">

                {/* Main Glass Card Container (Desktop) */}
                <div className="w-full max-w-5xl rounded-3xl border border-white/20 bg-background/60 backdrop-blur-xl shadow-2xl p-6 md:p-12 lg:p-16 ring-1 ring-white/10 dark:ring-white/5">

                    <div className="flex flex-col items-center text-center mb-12 space-y-4">
                        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                            Nourishing Neighborhoods.
                        </h1>
                        <p className="max-w-[600px] text-lg text-muted-foreground md:text-xl">
                            Connecting neighbors with food resources and community support.
                            <br className="hidden md:inline" /> Trustworthy, anonymous, and free.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 md:gap-10 lg:gap-16">

                        {/* Crisis Path Card */}
                        <Link
                            href="/map"
                            className={cn(
                                "group relative flex flex-col items-start justify-between overflow-hidden rounded-2xl border p-8 transition-all hover:shadow-2xl hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-amber-500/50",
                                "bg-gradient-to-br from-amber-50/50 to-amber-100/30 dark:from-amber-950/20 dark:to-amber-900/10",
                                "border-amber-200/50 dark:border-amber-800/50 hover:border-amber-400 dark:hover:border-amber-600"
                            )}
                        >
                            <div className="relative z-10 space-y-4">
                                <div className="inline-flex items-center justify-center rounded-xl bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
                                    <Utensils className="h-8 w-8" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight text-foreground group-hover:text-amber-700 dark:group-hover:text-amber-400">
                                        I Need Food
                                    </h2>
                                    <p className="mt-2 text-muted-foreground">
                                        Find local pantries, food banks, and free meals available right now.
                                    </p>
                                </div>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> No sign-in required
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> See what&apos;s open now
                                    </li>
                                </ul>
                            </div>
                            <div className="relative z-10 mt-8 flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                                Find Food <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </div>

                            {/* Decorative background glow */}
                            <div className="absolute -right-12 -bottom-12 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl group-hover:bg-amber-500/20 transition-all duration-500" />
                        </Link>

                        {/* Community Path Card */}
                        <Link
                            href="/community"
                            className={cn(
                                "group relative flex flex-col items-start justify-between overflow-hidden rounded-2xl border p-8 transition-all hover:shadow-2xl hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-emerald-500/50",
                                "bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10",
                                "border-emerald-200/50 dark:border-emerald-800/50 hover:border-emerald-400 dark:hover:border-emerald-600"
                            )}
                        >
                            <div className="relative z-10 space-y-4">
                                <div className="inline-flex items-center justify-center rounded-xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
                                    <HeartHandshake className="h-8 w-8" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                                        Share & Connect
                                    </h2>
                                    <p className="mt-2 text-muted-foreground">
                                        Share surplus food, organize potlucks, and build community connections.
                                    </p>
                                </div>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Share excess food
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Host local events
                                    </li>
                                </ul>
                            </div>
                            <div className="relative z-10 mt-8 flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                Join Community <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </div>

                            {/* Decorative background glow */}
                            <div className="absolute -right-12 -bottom-12 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500" />
                        </Link>

                    </div>

                    <div className="mt-12 text-center">
                        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full backdrop-blur-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Serving 146 communities nationwide
                        </p>
                    </div>
                </div>

                {/* Secondary Links */}
                <div className="mt-8 flex gap-6 text-sm text-muted-foreground">
                    <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
                    <Link href="/help" className="hover:text-foreground transition-colors">Help</Link>
                    <Link href="/legal/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
                </div>

            </div>
        </div>
    );
}
