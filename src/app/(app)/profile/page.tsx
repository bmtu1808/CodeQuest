import type { Metadata } from "next";
import { Medal } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/features/auth/actions";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { setLeaderboardVisibilityAction } from "@/features/social/actions";
import { Button } from "@/components/ui/button";
import { getMyRating } from "@/server/services/contests";
import { ratingTitle } from "@/features/contest/rating";
import { getAchievementsView } from "@/server/services/gamification-views";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { CountUp } from "@/components/profile/count-up";
import { Heatmap } from "@/components/dashboard/heatmap";
import { requireUser } from "@/server/auth/session";
import { getActivity, getRecentCompletions, getSnapshot } from "@/server/services/snapshot";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const [snap, activity, recent, ach] = await Promise.all([getSnapshot(user), getActivity(user, 119), getRecentCompletions(user.id, 8), getAchievementsView(user.id, user.timezone)]);
  const rating = await getMyRating(user.id);
  const unlocked = ach.filter((a) => a.unlockedAt);
  const stats = [
    { label: "Total XP", value: <CountUp value={snap.totalXp} /> },
    { label: "Level", value: <CountUp value={snap.level.level} /> },
    { label: "Current streak", value: <CountUp value={snap.streak} />, flame: snap.streak > 0 },
    { label: "Longest streak", value: <CountUp value={snap.longestStreak} /> },
    { label: "Lessons completed", value: <CountUp value={snap.lessonsCompleted} /> },
    { label: "Contest rating", value: rating ? `${rating.rating} · ${ratingTitle(rating.rating)}` : "Not rated" },
  ];
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Card className="flex animate-rise flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
        <span className="relative grid size-[104px] shrink-0 place-items-center">
          <span aria-hidden className="absolute inset-0 animate-spin-slow rounded-full" style={{ background: "conic-gradient(var(--color-grape), var(--color-sky), var(--color-brand), var(--color-gold), var(--color-grape))" }} />
          <span className="relative animate-float rounded-full border-4 border-surface">
            <Avatar name={user.displayName} color={user.avatarColor} size={88} />
          </span>
        </span>
        <div className="flex-1">
          <h1 className="text-2xl font-black">{user.displayName}</h1>
          <p className="text-muted">@{user.username}</p>
          <p className="mt-1 text-sm font-bold text-grape-dark dark:text-grape">
            Level {snap.level.level} · {snap.level.title}
          </p>
          <ProgressBar value={snap.level.progress} className="mt-2 h-3 [&>div]:origin-left [&>div]:animate-grow" color="bg-grape" label="Level progress" />
          <p className="mt-1 text-xs text-muted">Joined {user.createdAt.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((s, i) => (
          <Card key={s.label} className="animate-rise p-4 text-center transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.03]" style={{ animationDelay: `${80 + i * 70}ms` }}>
            <p className="text-2xl font-black">
              {"flame" in s && s.flame && <span aria-hidden className="mr-1 inline-block origin-bottom animate-wiggle">🔥</span>}
              {s.value}
            </p>
            <p className="text-[11px] font-bold uppercase text-muted">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card className="animate-rise [animation-delay:500ms]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-black">
            <Medal className="text-gold" size={20} /> Achievements
          </h2>
          <Link href="/achievements" className="text-xs font-extrabold uppercase text-sky hover:underline">
            {unlocked.length}/{ach.length} · View all
          </Link>
        </div>
        {unlocked.length === 0 ? (
          <p className="text-muted">None yet. Complete your first lesson to unlock First Steps.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {unlocked.map((a, i) => (
              <li key={a.slug} style={{ animationDelay: `${600 + i * 60}ms` }} className="animate-pop rounded-full transition-transform hover:-translate-y-0.5 hover:scale-105 bg-gold/15 px-3 py-1 text-sm font-bold text-gold-dark dark:text-gold">
                {a.title}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="animate-rise [animation-delay:650ms]">
        <h2 className="mb-3 text-lg font-black">Activity</h2>
        <Heatmap days={activity} />
      </Card>

      <Card className="animate-rise [animation-delay:750ms]">
        <h2 className="mb-3 text-lg font-black">Recent lessons</h2>
        {recent.length === 0 ? (
          <p className="text-muted">Nothing here yet. Complete a lesson to see it appear.</p>
        ) : (
          <ul className="divide-y-2 divide-line">
            {recent.map((r) => (
              <li key={r.id} className="flex justify-between gap-3 py-3">
                <span className="font-bold">{r.title}</span>
                <span className="text-sm text-muted">{r.completedAt?.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card className="flex flex-wrap gap-3 text-sm font-extrabold uppercase">
        <Link href="/friends" className="text-sky hover:underline">Friends</Link>
        <Link href="/groups" className="text-sky hover:underline">Study groups</Link>
        <Link href="/leaderboard" className="text-sky hover:underline">Leaderboard</Link>
        <Link href="/achievements" className="text-sky hover:underline">Achievements</Link>
        <Link href={`/u/${user.username}`} className="text-sky hover:underline">Public profile</Link>
        {(user.role === "admin" || user.role === "content_editor") && <Link href="/admin" className="text-grape hover:underline">Admin</Link>}
      </Card>
      <Card className="flex items-center justify-between gap-3">
        <div>
          <p className="font-bold">Public leaderboard</p>
          <p className="text-xs text-muted">{user.showOnLeaderboard ? "You appear on the public boards." : "You are hidden from public boards. Friends and groups still see you."}</p>
        </div>
        <form action={setLeaderboardVisibilityAction}>
          <input type="hidden" name="show" value={user.showOnLeaderboard ? "0" : "1"} />
          <Button type="submit" size="sm" variant="outline">{user.showOnLeaderboard ? "Hide me" : "Show me"}</Button>
        </form>
      </Card>
      <Card className="flex items-center justify-between gap-3 sm:hidden">
        <span className="font-bold">Theme</span>
        <ThemeToggle />
        <form action={logoutAction}>
          <Button type="submit" size="sm" variant="outline">
            Log out
          </Button>
        </form>
      </Card>
    </div>
  );
}
