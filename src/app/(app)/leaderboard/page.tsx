import type { Metadata } from "next";
import { Crown, Users } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { isPeriod, type Period } from "@/features/gamification/periods";
import { cn } from "@/lib/cn";
import { requireUser } from "@/server/auth/session";
import { getLeaderboard } from "@/server/services/leaderboard";
import { friendIds } from "@/server/services/social";

export const metadata: Metadata = { title: "Leaderboard" };
export const dynamic = "force-dynamic";

const TABS: Array<{ id: Period; label: string }> = [
  { id: "daily", label: "Today" },
  { id: "weekly", label: "This week" },
  { id: "monthly", label: "This month" },
  { id: "all", label: "All time" },
];

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ period?: string; scope?: string }> }) {
  const sp = await searchParams;
  const period: Period = isPeriod(sp.period) ? sp.period : "weekly";
  const user = await requireUser();
  const friends = sp.scope === "friends";
  const b = await getLeaderboard(user.id, period, new Date(), friends ? [user.id, ...(await friendIds(user.id))] : undefined);
  const q = friends ? "&scope=friends" : "";
  const meInTop = b.rows.some((r) => r.userId === user.id);
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-black">Leaderboard</h1>
      <p className="mt-1 text-muted">Ranked by XP earned in the period. Rewards are paid once, so replaying finished work cannot climb the board. Periods use UTC.</p>

      <div className="mt-5 flex flex-wrap gap-1.5" role="tablist" aria-label="Period">
        {TABS.map((t) => (
          <Link key={t.id} role="tab" aria-selected={period === t.id} href={`/leaderboard?period=${t.id}${q}`} className={cn("rounded-full border-2 px-4 py-1.5 text-xs font-extrabold uppercase", period === t.id ? "border-sky bg-sky/10 text-sky" : "border-line text-muted hover:bg-surface-2")}>
            {t.label}
          </Link>
        ))}
        <Link href={`/leaderboard?period=${period}${friends ? "" : "&scope=friends"}`} aria-pressed={friends} className={cn("flex items-center gap-1 rounded-full border-2 px-4 py-1.5 text-xs font-extrabold uppercase", friends ? "border-grape bg-grape/10 text-grape" : "border-dashed border-line text-muted hover:bg-surface-2")}>
          <Users size={13} /> {friends ? "Friends only" : "Friends"}
        </Link>
      </div>

      {b.rows.length === 0 ? (
        <Card className="mt-6 border-dashed p-8 text-center text-muted">Nobody has earned XP in this period yet. Complete a lesson to take the first place.</Card>
      ) : (
        <ol className="mt-6 flex flex-col gap-2">
          {b.rows.map((r) => (
            <li key={r.userId} className={cn("flex items-center gap-3 rounded-2xl border-2 px-4 py-3", r.userId === user.id ? "border-sky bg-sky/10" : "border-line bg-surface")}>
              <span className={cn("w-8 text-center text-lg font-black", r.rank <= 3 ? "text-gold-dark dark:text-gold" : "text-muted")}>{r.rank === 1 ? <Crown className="mx-auto" size={22} /> : r.rank}</span>
              <Avatar name={r.displayName} color={r.avatarColor} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold">{r.displayName}</p>
                <p className="truncate text-xs text-muted">
                  @{r.username} · Level {r.level}
                </p>
              </div>
              <span className="font-black text-gold-dark dark:text-gold">{r.xp.toLocaleString("en-US")} XP</span>
            </li>
          ))}
        </ol>
      )}

      {!meInTop && (
        <Card className="mt-4 border-sky/50 bg-sky/10 p-4 text-center font-bold">
          {b.me.hidden ? "You are hidden from the public board (see Profile). Friends and groups still see you." : b.me.rank ? `You are #${b.me.rank} with ${b.me.xp.toLocaleString("en-US")} XP` : "You have no XP in this period yet. Complete a lesson to join the board."}
        </Card>
      )}
      <p className="mt-6 text-xs text-muted">Only your display name, username, level and XP are shown here.</p>
    </div>
  );
}
