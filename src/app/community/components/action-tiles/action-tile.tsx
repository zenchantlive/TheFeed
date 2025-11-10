"use client";

import { CARD_COLORS, PIN_COLORS } from "../../styles/bulletin-theme";
import type { Action } from "./actions";

type ActionTileProps = Action & {
  onSelect: (intent: Action["intent"]) => void;
};

/**
 * Individual Action Tile
 *
 * Bulletin card with pushpin aesthetic.
 * Subtle rotation, warm color, prominent CTA.
 */
export function ActionTile({
  id,
  title,
  description,
  icon,
  color,
  pinColor,
  intent,
  onSelect,
}: ActionTileProps) {
  const colorClasses = CARD_COLORS[color];

  return (
    <button
      type="button"
      onClick={() => onSelect(intent)}
      className={`
        group relative flex flex-col items-center gap-3 rounded-xl border-2 p-6
        ${colorClasses}
        shadow-[3px_4px_8px_rgba(0,0,0,0.08)]
        dark:shadow-[3px_4px_12px_rgba(0,0,0,0.25)]
        transition-all duration-200
        hover:shadow-[4px_6px_14px_rgba(0,0,0,0.12)]
        hover:dark:shadow-[4px_6px_18px_rgba(0,0,0,0.35)]
        hover:-translate-y-1 hover:scale-[1.02]
        focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2
        active:scale-[0.98]
      `}
    >
      {/* Pushpin graphic */}
      <div
        className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full shadow-md"
        style={{
          backgroundColor: PIN_COLORS[pinColor],
          boxShadow: "0 2px 4px rgba(0,0,0,0.2), inset 0 -1px 2px rgba(0,0,0,0.25)",
        }}
      >
        {/* Pushpin highlight */}
        <div
          className="absolute left-1 top-0.5 h-1.5 w-1.5 rounded-full bg-white/40"
        />
      </div>

      {/* Icon */}
      <div className="text-4xl transition-transform duration-200 group-hover:scale-110">
        {icon}
      </div>

      {/* Content */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
          {description}
        </p>
      </div>

      {/* Subtle paper texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-[0.02] mix-blend-multiply dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.05' /%3E%3C/svg%3E")`,
        }}
      />
    </button>
  );
}
