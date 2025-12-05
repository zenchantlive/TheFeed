"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CheckCircle, Home, Settings, Users, UserCheck } from "lucide-react";

type AdminSidebarProps = {
  userName: string;
  className?: string;
  onNavigate?: () => void;
};

const navItems = [
  { href: "/admin", label: "Overview", icon: Home },
  { href: "/admin/verification", label: "Verification", icon: CheckCircle },
  { href: "/admin/claims", label: "Provider Claims", icon: UserCheck },
  { href: "/admin/users", label: "Users", icon: Users, disabled: true },
  { href: "/admin/settings", label: "Settings", icon: Settings, disabled: true },
];

export function AdminSidebar({ userName, className, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn("flex h-screen w-64 flex-col border-r bg-card/80 backdrop-blur", className)}>
      <div className="px-6 py-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Admin
        </p>
        <h2 className="mt-1 text-lg font-semibold text-foreground">
          {userName || "Admin"}
        </h2>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                item.disabled
                  ? "cursor-not-allowed text-muted-foreground/60"
                  : "hover:bg-muted/60",
                isActive && !item.disabled && "bg-primary/10 text-primary"
              )}
              aria-disabled={item.disabled}
              tabIndex={item.disabled ? -1 : 0}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
              {item.disabled && (
                <span className="ml-auto text-xs text-muted-foreground">
                  Coming soon
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="px-6 py-4 text-xs text-muted-foreground">
        Build quality before launch.
      </div>
    </aside>
  );
}
