import { eq, sql } from "drizzle-orm";
import { schema } from "@/server/db/client";
import { XP_RULES } from "@/features/gamification/xp";
import { applyActivity, toLocalDay } from "@/features/gamification/streak";
import { awardXp, type Tx } from "./xp";

/**
 * Register a learning activity (a completed lesson, an accepted problem...) for the user inside the caller's
 * transaction. The caller must already hold a row lock on user_stats (SELECT ... FOR UPDATE).
 *
 * Updates the streak, grants the streak-milestone bonus once per milestone, and adds the day's XP/lessons/
 * questions to user_activity. `baseXp` is the XP the caller has already granted for this action.
 */
export async function recordActivity(
  tx: Tx,
  p: {
    userId: string;
    timezone: string;
    stats: { currentStreak: number; longestStreak: number; lastActiveDate: string | null };
    now: Date;
    baseXp: number;
    lessons: number;
    questions: number;
  },
): Promise<{ bonus: { label: string; xp: number } | null; streak: { current: number; extended: boolean }; day: string }> {
  const day = toLocalDay(p.now, p.timezone);
  const act = applyActivity({ current: p.stats.currentStreak, longest: p.stats.longestStreak, lastActiveDate: p.stats.lastActiveDate }, day);
  let bonus: { label: string; xp: number } | null = null;
  if (act.extended) {
    const xp = XP_RULES.streakMilestones[act.state.current];
    if (xp && (await awardXp(tx, { userId: p.userId, amount: xp, reason: "streak_milestone", idempotencyKey: `streak:${act.state.current}` }))) {
      bonus = { label: `${act.state.current}-day streak`, xp };
    }
  }
  await tx
    .update(schema.userStats)
    .set({ currentStreak: act.state.current, longestStreak: act.state.longest, lastActiveDate: act.state.lastActiveDate })
    .where(eq(schema.userStats.userId, p.userId));
  const dayXp = p.baseXp + (bonus?.xp ?? 0);
  await tx
    .insert(schema.userActivity)
    .values({ userId: p.userId, day, xp: dayXp, lessons: p.lessons, questions: p.questions })
    .onConflictDoUpdate({
      target: [schema.userActivity.userId, schema.userActivity.day],
      set: {
        xp: sql`${schema.userActivity.xp} + ${dayXp}`,
        lessons: sql`${schema.userActivity.lessons} + ${p.lessons}`,
        questions: sql`${schema.userActivity.questions} + ${p.questions}`,
      },
    });
  return { bonus, streak: { current: act.state.current, extended: act.extended }, day };
}
