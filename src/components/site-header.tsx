import Link from "next/link";
import { UserProfile } from "@/components/auth/user-profile";
import { ModeToggle } from "./ui/mode-toggle";
import { UtensilsCrossed } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <h1 className="text-2xl font-bold">
          <Link
            href="/"
            className="flex items-center gap-3 transition-colors hover:text-primary"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="bg-gradient-to-r from-primary-start to-primary-end bg-clip-text text-lg font-semibold text-transparent">
                TheFeed
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Neighbor-powered potluck network
              </span>
            </div>
          </Link>
        </h1>
        <div className="flex items-center gap-3">
          <ModeToggle />
          <UserProfile />
        </div>
      </div>
    </header>
  );
}
