"use client";

import { Users } from "lucide-react";

/**
 * Active Members Row
 *
 * Shows avatars of recent/active community members.
 * Creates a sense of "who's here now" presence.
 */

type ActiveMember = {
  id: string;
  name: string;
  initial: string;
  isOnline?: boolean;
};

type ActiveMembersProps = {
  members?: ActiveMember[];
  totalCount?: number;
};

// Mock data - in real app, this would come from props
const DEFAULT_MEMBERS: ActiveMember[] = [
  { id: "1", name: "Jordan Hindo", initial: "J", isOnline: true },
  { id: "2", name: "Sarah", initial: "S", isOnline: true },
  { id: "3", name: "Maria", initial: "M", isOnline: false },
  { id: "4", name: "Alex", initial: "A", isOnline: true },
  { id: "5", name: "Chen", initial: "C", isOnline: false },
  { id: "6", name: "Rosa", initial: "R", isOnline: true },
  { id: "7", name: "Dev", initial: "D", isOnline: false },
];

export function ActiveMembers({ members = DEFAULT_MEMBERS, totalCount = 19 }: ActiveMembersProps) {
  const displayMembers = members.slice(0, 7);
  const additionalCount = Math.max(0, totalCount - displayMembers.length);

  return (
    <section className="flex items-center gap-3 rounded-lg border border-slate-200/60 bg-white/60 px-4 py-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/60">
      <Users className="h-4 w-4 text-slate-600 dark:text-slate-400" />
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Who&apos;s here:
      </span>

      <div className="flex items-center -space-x-2">
        {displayMembers.map((member) => (
          <div
            key={member.id}
            className="group relative"
            title={member.name}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-primary/80 to-primary text-xs font-semibold text-white shadow-sm dark:border-slate-800"
            >
              {member.initial}
            </div>
            {member.isOnline && (
              <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-800">
                <div className="h-full w-full animate-pulse rounded-full bg-emerald-400" />
              </div>
            )}
          </div>
        ))}
        {additionalCount > 0 && (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-700 dark:text-slate-300"
            title={`${additionalCount} more active`}
          >
            +{additionalCount}
          </div>
        )}
      </div>
    </section>
  );
}
