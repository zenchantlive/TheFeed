import Link from "next/link";
import { UserProfile } from "@/components/auth/user-profile";
import { ModeToggle } from "./ui/mode-toggle";
import { UtensilsCrossed, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreatePostDrawer } from "@/components/layout/create-post-drawer";

export function SiteHeader() {
  return (
    <header className="border-b" data-site-header>
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
            </div>
          </Link>
        </h1>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 mr-6">
          <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            About
          </Link>
          <Link href="/help" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Help
          </Link>
          <Link href="/onboarding" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Onboarding
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {/* Create Button (Desktop) */}
          <div className="hidden md:block">
            <CreatePostDrawer>
              <Button size="sm" className="gap-2 rounded-full font-semibold shadow-sm">
                <Plus className="h-4 w-4" />
                Create
              </Button>
            </CreatePostDrawer>
          </div>
          <ModeToggle />
          <UserProfile />
        </div>
      </div>
    </header>
  );
}
