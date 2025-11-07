import Link from "next/link";
import { Sparkles } from "lucide-react";

import { UserProfile } from "@/components/auth/user-profile";
import { ModeToggle } from "./ui/mode-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4">
        <Link
          href="/"
          className="group flex items-center gap-3 text-foreground transition hover:text-primary"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-lg font-bold text-primary-foreground shadow-sm">
            🍲
          </span>
          <span className="flex flex-col">
            <span className="text-xl font-semibold leading-none tracking-tight">
              TheFeed
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3 text-accent" />
              Hungry neighbors, instant help.
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <ModeToggle />
          <UserProfile />
        </div>
      </div>
    </header>
  );
}
