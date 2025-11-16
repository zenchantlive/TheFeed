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

  const containerClassName = cn(
    "flex flex-col bg-background",
    isChatV2 ? "h-screen" : "min-h-screen"
  );

  const mainClassName = cn(
    "flex-1",
    isChatV2 ? "flex min-h-0 overflow-hidden pb-0" : "pb-28"
  );

  return (
    <>
      <div className={containerClassName}>
        {!isChatV2 && <SiteHeader />}
        <main className={mainClassName}>{children}</main>
        {!isChatV2 && <SiteFooter />}
      </div>
      <BottomNav />
    </>
  );
}
