"use client";

import { BarChart3, Home, Map as MapIcon, Medal, Swords, Trophy, User as UserIcon, Code2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const LIVE = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/learn", label: "Learn", icon: MapIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
] as const;

const SOON = [
  { label: "Practice", icon: Code2, phase: "Phase 2" },
  { label: "Contests", icon: Swords, phase: "Phase 4" },
  { label: "Leaderboard", icon: Trophy, phase: "Phase 3" },
  { label: "Achievements", icon: Medal, phase: "Phase 3" },
  { label: "Statistics", icon: BarChart3, phase: "Phase 4" },
] as const;

export function SidebarNav() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {LIVE.map(({ href, label, icon: Icon }) => {
        const active = path === href || path.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-sm font-extrabold uppercase tracking-wide transition",
              active ? "border-sky bg-sky/10 text-sky" : "border-transparent text-muted hover:bg-surface-2",
            )}
          >
            <Icon size={24} /> {label}
          </Link>
        );
      })}
      <p className="mt-4 px-4 text-xs font-bold uppercase tracking-wider text-muted/70">Roadmap</p>
      {SOON.map(({ label, icon: Icon, phase }) => (
        <div key={label} aria-disabled className="flex cursor-not-allowed items-center gap-3 px-4 py-2.5 text-sm font-bold text-muted/60">
          <Icon size={20} /> {label}
          <span className="ml-auto rounded-full bg-surface-2 px-2 py-0.5 text-[10px] uppercase">{phase}</span>
        </div>
      ))}
    </nav>
  );
}

export function BottomNav() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 flex border-t-2 border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
      {LIVE.map(({ href, label, icon: Icon }) => {
        const active = path === href || path.startsWith(`${href}/`);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-extrabold uppercase", active ? "text-sky" : "text-muted")}>
            <Icon size={24} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
