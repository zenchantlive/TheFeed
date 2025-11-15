"use client";

import * as React from "react";
import type { ReactNode } from "react";

function useBottomNavHeight() {
  const [height, setHeight] = React.useState(0);

  React.useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const nav = document.querySelector<HTMLElement>("[data-bottom-nav]");
    if (!nav) return;

    const update = () => {
      setHeight(nav.getBoundingClientRect().height);
    };

    update();
    window.addEventListener("resize", update);

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(update)
        : null;

    if (observer) {
      observer.observe(nav);
    }

    return () => {
      window.removeEventListener("resize", update);
      observer?.disconnect();
    };
  }, []);

  return height;
}

export default function ChatV2Layout({ children }: { children: ReactNode }) {
  const bottomNavHeight = useBottomNavHeight();

  return (
    <div
      className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#1f1f27] text-foreground"
      style={
        bottomNavHeight
          ? { paddingBottom: `${bottomNavHeight}px` }
          : undefined
      }
    >
      {children}
    </div>
  );
}
