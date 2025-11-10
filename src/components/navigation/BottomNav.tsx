"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, MapPin, Users, UserRound, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75"
      role="navigation"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-lg items-center justify-between px-6 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          const isMap = item.href === "/map";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 text-xs transition-colors",
                isMap
                  ? "relative -mt-6 rounded-full bg-gradient-to-r from-primary-start to-primary-end px-4 py-3 text-primary-foreground shadow-lg shadow-primary/40"
                  : "px-3 py-2",
                isActive && !isMap && "text-primary",
                !isActive && !isMap && "text-muted-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  isMap ? "text-primary-foreground" : isActive ? "text-primary" : ""
                )}
              />
              <span
                className={cn(
                  "font-medium",
                  isMap
                    ? "text-[0.7rem] uppercase tracking-wide"
                    : isActive
                    ? "text-xs"
                    : "text-[0.7rem]"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
