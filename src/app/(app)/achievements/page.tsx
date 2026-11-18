import type { Metadata } from "next";
import { Lock, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DynamicIcon } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/cn";
import { requireUser } from "@/server/auth/session";
import { getAchievementsView } from "@/server/services/gamification-views";

export const metadata: Metadata = { title: "Achievements" };
export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const user = await requireUser();
  const list = await getAchievementsView(user.id, user.timezone);
  const got = list.filter((a) => a.unlockedAt).length;
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-black">Achievements</h1>
      <p className="mt-1 text-muted">
        {got} of {list.length} unlocked. Progress is measured from your real activity.
      </p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {list.map((a) => {
          const done = !!a.unlockedAt;
          return (
            <li key={a.slug}>
              <Card className={cn("flex h-full gap-4 p-4", done ? "border-gold/60 bg-gold/10" : "")}>
                <span className={cn("grid size-14 shrink-0 place-items-center rounded-2xl", done ? "bg-gold text-white" : "bg-surface-2 text-muted")}>
                  {done ? <DynamicIcon name={a.icon} size={28} /> : <Lock size={24} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold">{a.title}</p>
                  <p className="text-sm text-muted">{a.description}</p>
                  {done ? (
                    <p className="mt-2 text-xs font-bold text-gold-dark dark:text-gold">Unlocked {a.unlockedAt!.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                  ) : (
                    <div className="mt-2">
                      <ProgressBar value={a.current / a.threshold} label={`${a.title} progress`} className="h-2.5" />
                      <p className="mt-1 text-xs font-bold text-muted">
                        {a.current}/{a.threshold} · {a.metricLabel}
                      </p>
                    </div>
                  )}
                  {a.rewardXp > 0 && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-extrabold text-gold-dark dark:text-gold">
                      <Zap size={12} fill="currentColor" /> {a.rewardXp} XP
                    </p>
                  )}
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
