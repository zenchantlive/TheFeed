"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, MapPin, Users, UserRound, Calendar, Plus, PenSquare, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useState } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const navItems: NavItem[] = [
  {
    label: "Sous-chef",
    href: "/chat",
    icon: MessageCircle,
  },
  {
    label: "Food map",
    href: "/map",
    icon: MapPin,
  },
  {
    label: "Potluck",
    href: "/community",
    icon: Users,
  },
  {
    label: "Calendar",
    href: "/community/events/calendar",
    icon: Calendar,
  },
  {
    label: "Pantry",
    href: "/profile",
    icon: UserRound,
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
        role="navigation"
        aria-label="Primary"
        data-bottom-nav
      >
        <div className="mx-auto flex max-w-md items-end justify-between px-4 py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
          {/* First 2 items */}
          <NavLink item={navItems[0]} pathname={pathname} />
          <NavLink item={navItems[1]} pathname={pathname} />

          {/* Plus Button (Center) */}
          <div className="relative -top-5">
            <Drawer open={isOpen} onOpenChange={setIsOpen}>
              <DrawerTrigger asChild>
                <Button
                  size="icon"
                  className="h-14 w-14 rounded-full bg-gradient-to-tr from-primary-start to-primary-end shadow-lg shadow-primary/40 transition-transform hover:scale-105 active:scale-95"
                >
                  <Plus className="h-8 w-8 text-primary-foreground" />
                  <span className="sr-only">Create</span>
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Create & Share</DrawerTitle>
                </DrawerHeader>
                <div className="grid gap-4 p-4 pb-8">
                  <Button
                    variant="outline"
                    className="flex h-auto flex-col items-center gap-2 py-6"
                    onClick={() => {
                      setIsOpen(false);
                      // Trigger post composer (navigate to community with intent?)
                      // For now, just go to community
                      router.push("/community?action=post");
                    }}
                  >
                    <PenSquare className="h-8 w-8 text-primary" />
                    <span className="font-medium">Create Post</span>
                    <span className="text-xs text-muted-foreground">Share food or ask for help</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex h-auto flex-col items-center gap-2 py-6"
                    onClick={() => {
                      setIsOpen(false);
                      router.push("/community?action=event");
                    }}
                  >
                    <Calendar className="h-8 w-8 text-full-end" />
                    <span className="font-medium">Host Event</span>
                    <span className="text-xs text-muted-foreground">Organize a potluck or drive</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex h-auto flex-col items-center gap-2 py-6"
                    onClick={() => {
                      setIsOpen(false);
                      router.push("/chat");
                    }}
                  >
                    <Sparkles className="h-8 w-8 text-hungry-end" />
                    <span className="font-medium">Ask Sous-chef</span>
                    <span className="text-xs text-muted-foreground">Get AI assistance</span>
                  </Button>
                </div>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button variant="ghost">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>

          {/* Remaining items (skip Potluck if we want 4+1 layout, but user wants all. Let's try to fit Potluck) */}
          {/* Actually, 5 items + 1 big button is too wide. */}
          {/* I will hide "Potluck" text or something? */}
          {/* Or maybe Potluck IS the center? */}
          {/* User said "Plus button could bring up the page for adding a post...". */}
          {/* If I keep all 5 items, the Plus button floats above. */}
          {/* Let's render the other 3 items. */}
          <NavLink item={navItems[2]} pathname={pathname} />
          <NavLink item={navItems[3]} pathname={pathname} />
          <NavLink item={navItems[4]} pathname={pathname} />
        </div>
      </nav>
    </>
  );
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = item.icon;
  const isActive =
    pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-col items-center gap-1 p-2 transition-colors",
        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className={cn("h-6 w-6", isActive && "fill-current")} />
      <span className="text-[0.65rem] font-medium">{item.label}</span>
    </Link>
  );
}
