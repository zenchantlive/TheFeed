"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const gradientByVariant: Record<string, string> = {
  hungry: "from-hungry-start to-hungry-end",
  full: "from-full-start to-full-end",
  primary: "from-primary-start to-primary-end",
};

export type BigActionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  variant?: "hungry" | "full" | "primary";
};

export const BigActionButton = React.forwardRef<HTMLButtonElement, BigActionButtonProps>(
  ({ icon, title, description, className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "w-full rounded-3xl bg-gradient-to-r px-6 py-5 text-left text-white shadow-lg transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background active:scale-95",
          gradientByVariant[variant],
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-4">
          {icon && (
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-2xl">
              {icon}
            </span>
          )}
          <div className="space-y-1">
            <p className="text-lg font-semibold leading-tight">{title}</p>
            {description ? (
              <p className="text-sm text-white/80">{description}</p>
            ) : null}
          </div>
        </div>
      </button>
    );
  }
);

BigActionButton.displayName = "BigActionButton";
