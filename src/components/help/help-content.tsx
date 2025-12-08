"use client";

import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Phone, Map, Users, AlertCircle } from "lucide-react";

export function HelpContent() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground pb-20">

            {/* Header */}
            <section className="bg-muted/30 py-16 border-b">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-3xl font-bold tracking-tight mb-4">How can we help?</h1>
                    <p className="text-muted-foreground max-w-[600px] mx-auto">
                        Find answers, get support, or connect with crisis resources.
                    </p>
                </div>
            </section>

            <div className="container mx-auto px-4 py-12 max-w-4xl space-y-16">

                {/* Crisis Support Section - High Visibility */}
                <section className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-2xl p-6 md:p-8">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-full text-red-600 dark:text-red-400 mt-1">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">Crisis Support</h2>
                            <p className="text-muted-foreground mb-6">If you are in immediate need of emergency shelter or help, please contact these resources directly.</p>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="bg-background rounded-lg p-4 border flex items-center gap-4">
                                    <Phone className="h-5 w-5 text-primary" />
                                    <div>
                                        <div className="font-bold">Call 2-1-1</div>
                                        <div className="text-sm text-muted-foreground">Essential Community Services</div>
                                    </div>
                                </div>
                                <div className="bg-background rounded-lg p-4 border flex items-center gap-4">
                                    <Phone className="h-5 w-5 text-primary" />
                                    <div>
                                        <div className="font-bold">Call 9-8-8</div>
                                        <div className="text-sm text-muted-foreground">Suicide & Crisis Lifeline</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section>
                    <h2 className="text-2xl font-bold mb-8 text-center">How TheFeed Works</h2>
                    <div className="grid gap-8 md:grid-cols-3">
                        <div className="text-center">
                            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                                <Map className="h-8 w-8" />
                            </div>
                            <h3 className="font-semibold mb-2">1. Find Food</h3>
                            <p className="text-sm text-muted-foreground">Use the Map to find verified food banks, pantries, and meal programs near you.</p>
                        </div>
                        <div className="text-center">
                            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                                <Users className="h-8 w-8" />
                            </div>
                            <h3 className="font-semibold mb-2">2. Connect</h3>
                            <p className="text-sm text-muted-foreground">Join the Community to see neighbor-hosted potlucks and shared surplus food.</p>
                        </div>
                        <div className="text-center">
                            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                                <span className="text-2xl font-bold">🎉</span>
                            </div>
                            <h3 className="font-semibold mb-2">3. Go & Eat</h3>
                            <p className="text-sm text-muted-foreground">Visit the location or event. No sign-up is required for crisis resources.</p>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section>
                    <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>Do I need to sign up to get food?</AccordionTrigger>
                            <AccordionContent>
                                No. You can use the &quot;I Need Food&quot; path to find pantries and food banks completely anonymously. You only need to sign in if you want to join community events or post updates.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>Is everything really free?</AccordionTrigger>
                            <AccordionContent>
                                Yes. All food resources listed—whether from food banks or neighbors sharing surplus—are 100% free. TheFeed is committed to de-commercializing food access.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger>Is my location tracked?</AccordionTrigger>
                            <AccordionContent>
                                We use your location to show you nearby resources, but we do not store your exact coordinates or track your movement history. Your privacy is paramount.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                            <AccordionTrigger>How can I help?</AccordionTrigger>
                            <AccordionContent>
                                You can sign in to the Community section to share surplus food, host various events, or volunteer at verified food banks.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </section>

                {/* Contact CTA */}
                <section className="text-center pt-8 border-t">
                    <p className="text-muted-foreground mb-4">Still have questions?</p>
                    <Button variant="outline" asChild>
                        <Link href="mailto:support@thefeed.org">Contact Support</Link>
                    </Button>
                </section>

            </div>
        </div>
    );
}
