import type { Metadata } from "next";
import { QuestList } from "@/components/gamification/quest-list";
import { requireUser } from "@/server/auth/session";
import { getQuestsView } from "@/server/services/gamification-views";
import { getSnapshot } from "@/server/services/snapshot";

export const metadata: Metadata = { title: "Daily Quests" };
export const dynamic = "force-dynamic";

export default async function QuestsPage() {
  const user = await requireUser();
  const snap = await getSnapshot(user);
  const quests = await getQuestsView(user.id, snap.today);
  const done = quests.filter((q) => q.completedAt).length;
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-black">Daily Quests</h1>
      <p className="mt-1 text-muted">
        {done} of {quests.length} done. New quests arrive every day at midnight in your timezone ({user.timezone}). Each one pays +25 XP, once.
      </p>
      <div className="mt-6">
        <QuestList quests={quests} />
      </div>
      <p className="mt-6 text-xs text-muted">Quest progress only counts real activity: finished lessons, correct review answers and judged submissions. Replaying a lesson for XP does not work, rewards are paid once per quest per day.</p>
    </div>
  );
}
