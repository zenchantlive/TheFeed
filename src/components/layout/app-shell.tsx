"use client";

import { useSelectedLayoutSegments } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BottomNav } from "@/components/navigation/BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  const segments = useSelectedLayoutSegments();
  const isChatV2 = segments[0] === "chat-v2";

  const mainClassName = cn(
    "flex-1 pb-28",
    isChatV2 && "flex min-h-0 flex-1 overflow-hidden pb-0"
  );

  return (
    <>
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className={mainClassName}>{children}</main>
        <SiteFooter />
      </div>
      <BottomNav />
    </>
  );
}
