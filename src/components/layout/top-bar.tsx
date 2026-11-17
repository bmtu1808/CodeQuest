import Link from "next/link";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/features/auth/actions";
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
          <ThemeToggle />
          <Link href="/profile" aria-label="Your profile">
            <Avatar name={user.displayName} color={user.avatarColor} size={36} />
          </Link>
          <form action={logoutAction}>
            <button type="submit" aria-label="Log out" className="grid size-10 place-items-center rounded-xl text-muted transition hover:bg-surface-2">
              <LogOut size={20} />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
