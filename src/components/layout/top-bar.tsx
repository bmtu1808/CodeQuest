import Link from "next/link";
import { Bell, LogOut } from "lucide-react";
import { logoutAction } from "@/features/auth/actions";
import { HeartsCounter } from "@/components/gamification/hearts-counter";
import { StreakCounter, XpCounter } from "@/components/gamification/stat-pills";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { User } from "@/server/db/schema";
import type { Snapshot } from "@/server/services/snapshot";

export function TopBar({ user, snap }: { user: User; snap: Snapshot }) {
  return (
    <header className="sticky top-0 z-20 border-b-2 border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Logo href="/dashboard" className="lg:hidden" textClassName="hidden sm:inline" />
        <div className="ml-auto flex items-center gap-2 sm:gap-5">
          <XpCounter value={snap.totalXp} />
          <StreakCounter value={snap.streak} atRisk={snap.streakAtRisk} />
          <HeartsCounter hearts={snap.hearts} />
          <Link href="/notifications" aria-label={snap.unread ? `Notifications, ${snap.unread} unread` : "Notifications"} className="relative grid size-10 place-items-center rounded-xl text-muted transition hover:bg-surface-2">
            <Bell size={22} />
            {snap.unread > 0 && <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-extrabold leading-4 text-white">{snap.unread > 9 ? "9+" : snap.unread}</span>}
          </Link>
          <ThemeToggle className="hidden sm:grid" />
          <Link href="/profile" aria-label="Your profile">
            <Avatar name={user.displayName} color={user.avatarColor} size={36} />
          </Link>
          <form action={logoutAction} className="hidden sm:block">
            <button type="submit" aria-label="Log out" className="grid size-10 place-items-center rounded-xl text-muted transition hover:bg-surface-2">
              <LogOut size={20} />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
