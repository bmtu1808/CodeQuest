import type { Metadata } from "next";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Heatmap } from "@/components/dashboard/heatmap";
import { requireUser } from "@/server/auth/session";
import { getActivity, getRecentCompletions, getSnapshot } from "@/server/services/snapshot";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const [snap, activity, recent] = await Promise.all([getSnapshot(user), getActivity(user, 119), getRecentCompletions(user.id, 8)]);
  const stats = [
    { label: "Total XP", value: snap.totalXp.toLocaleString("en-US") },
    { label: "Level", value: snap.level.level },
    { label: "Current streak", value: snap.streak },
    { label: "Longest streak", value: snap.longestStreak },
    { label: "Lessons completed", value: snap.lessonsCompleted },
  ];
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Card className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
        <Avatar name={user.displayName} color={user.avatarColor} size={88} />
        <div className="flex-1">
          <h1 className="text-2xl font-black">{user.displayName}</h1>
          <p className="text-muted">@{user.username}</p>
          <p className="mt-1 text-sm font-bold text-grape-dark dark:text-grape">
            Level {snap.level.level} · {snap.level.title}
          </p>
          <ProgressBar value={snap.level.progress} className="mt-2 h-3" color="bg-grape" label="Level progress" />
          <p className="mt-1 text-xs text-muted">Joined {user.createdAt.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label} className="p-4 text-center">
            <p className="text-2xl font-black">{s.value}</p>
            <p className="text-[11px] font-bold uppercase text-muted">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="mb-3 text-lg font-black">Activity</h2>
        <Heatmap days={activity} />
      </Card>

      <Card>
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
    </div>
  );
}
