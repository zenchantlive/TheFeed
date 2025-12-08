"use client";

import Link from "next/link";
import { ArrowRight, Heart, MapPin, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AboutContent() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">

            {/* Hero Section */}
            <section className="relative overflow-hidden py-24 lg:py-32">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 blur-[120px] rounded-full" />
                </div>
                <div className="container relative z-10 mx-auto px-4 text-center">
                    <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6">
                        <Sparkles className="mr-2 h-4 w-4" /> TheFeed Mission
                    </div>
                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent mb-6">
                        Nourishing Neighborhoods,<br /> Together.
                    </h1>
                    <p className="mx-auto max-w-[700px] text-lg text-muted-foreground md:text-xl leading-relaxed">
                        Our mission is to end local hunger by unlocking the abundance already present in our communities through trust, technology, and radical generosity.
                    </p>
                </div>
            </section>

            {/* Pillars Grid */}
            <section className="container mx-auto px-4 py-16">
                <div className="grid gap-8 md:grid-cols-3">
                    <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-muted/30 border border-border/50">
                        <div className="p-4 rounded-full bg-amber-500/10 text-amber-600 mb-4">
                            <Heart className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Dignity First</h3>
                        <p className="text-muted-foreground">For neighbors in need, we provide anonymous, stigma-free access to food resources. No questions asked.</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-muted/30 border border-border/50">
                        <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-600 mb-4">
                            <Users className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Community Powered</h3>
                        <p className="text-muted-foreground">We empower neighbors to share surplus food and organize potlucks, turning waste into sustenance.</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-muted/30 border border-border/50">
                        <div className="p-4 rounded-full bg-blue-500/10 text-blue-600 mb-4">
                            <ShieldCheck className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Trust & Safety</h3>
                        <p className="text-muted-foreground">Our platform verifies resources and fosters a safe environment for sharing and connection.</p>
                    </div>
                </div>
            </section>

            {/* Tech Section */}
            <section className="py-24 bg-muted/20">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="md:w-1/2 space-y-6">
                            <h2 className="text-3xl font-bold tracking-tight">Technology for Good</h2>
                            <p className="text-muted-foreground text-lg">
                                TheFeed isn&apos;t just a list; it&apos;s a dynamic engine connecting supply with demand in real-time.
                            </p>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <MapPin className="h-6 w-6 text-primary mt-1" />
                                    <div>
                                        <h4 className="font-semibold">Real-Time Resource Map</h4>
                                        <p className="text-sm text-muted-foreground">See what&apos;s open now, verified by the community.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Sparkles className="h-6 w-6 text-primary mt-1" />
                                    <div>
                                        <h4 className="font-semibold">AI Sous-Chef</h4>
                                        <p className="text-sm text-muted-foreground">Smart assistance to find resources, plan meals, and coordinate events.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                        <div className="md:w-1/2 rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-background/50 h-[400px] flex items-center justify-center relative">
                            {/* Abstract Tech Visual */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 opacity-50" />
                            <div className="text-center p-8 relative z-10">
                                <span className="text-6xl block mb-4">🤖 + ❤️</span>
                                <span className="text-xl font-medium text-foreground">High Tech, High Touch</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 text-center">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold tracking-tight mb-6">Ready to join the movement?</h2>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" className="rounded-full text-base h-12 px-8" asChild>
                            <Link href="/community">
                                Join the Community <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="rounded-full text-base h-12 px-8" asChild>
                            <Link href="/map">
                                Explore Resources
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

        </div>
    );
}
