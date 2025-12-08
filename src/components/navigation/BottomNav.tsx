import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, MapPin, Users, UserRound, Calendar, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CreatePostDrawer } from "@/components/layout/create-post-drawer";

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
            <CreatePostDrawer>
              <Button
                size="icon"
                className="h-14 w-14 rounded-full bg-gradient-to-tr from-primary-start to-primary-end shadow-lg shadow-primary/40 transition-transform hover:scale-105 active:scale-95"
              >
                <Plus className="h-8 w-8 text-primary-foreground" />
                <span className="sr-only">Create</span>
              </Button>
            </CreatePostDrawer>
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
  // Handle root vs nested paths for active state
  // If item.href is '/', exact match only. Otherwise startsWith.
  // Actually, chat is '/chat', map is '/map'. Root '/' redirects.
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
