"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface HostEventButtonProps {
    onClick: () => void;
    className?: string;
    variant?: "default" | "minimal";
}

export function HostEventButton({ onClick, className, variant = "default" }: HostEventButtonProps) {
    if (variant === "minimal") {
        return (
            <Button
                onClick={onClick}
                size="sm"
                className={cn("rounded-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-sm transition-all hover:shadow-md", className)}
            >
                <Plus className="mr-1.5 h-4 w-4" />
                Host an event
            </Button>
        );
    }

    return (
        <Button
            onClick={onClick}
            className={cn(
                "group relative overflow-hidden rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-2 font-semibold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg hover:ring-2 hover:ring-fuchsia-500/20 active:scale-95",
                className
            )}
        >
            <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
            <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
            Host an Event
        </Button>
    );
}
