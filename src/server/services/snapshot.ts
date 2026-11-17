import { and, desc, eq, gte } from "drizzle-orm";
import { cache } from "react";
import { getDb, schema } from "@/server/db/client";
import type { User } from "@/server/db/schema";
import { dailyGoalXp, levelFromXp, type LevelInfo } from "@/features/gamification/xp";
import { addDays, effectiveStreak, streakAtRisk, toLocalDay } from "@/features/gamification/streak";

export type Snapshot = {
  totalXp: number;
  level: LevelInfo;
  streak: number;
  longestStreak: number;
  streakAtRisk: boolean;
  lessonsCompleted: number;
  todayXp: number;
  dailyGoal: number;
  today: string;
};

/** Header/sidebar numbers. Cached per request so layout + page share one query. */
export const getSnapshot = cache(async (user: User): Promise<Snapshot> => {
  const db = getDb();
  const today = toLocalDay(new Date(), user.timezone);
  let [stats] = await db.select().from(schema.userStats).where(eq(schema.userStats.userId, user.id));
  if (!stats) {
    await db.insert(schema.userStats).values({ userId: user.id }).onConflictDoNothing();
    [stats] = await db.select().from(schema.userStats).where(eq(schema.userStats.userId, user.id));
  }
  const [act] = await db
    .select({ xp: schema.userActivity.xp })
    .from(schema.userActivity)
    .where(and(eq(schema.userActivity.userId, user.id), eq(schema.userActivity.day, today)));
  const s = { current: stats!.currentStreak, longest: stats!.longestStreak, lastActiveDate: stats!.lastActiveDate };
  return {
    totalXp: stats!.totalXp,
    level: levelFromXp(stats!.totalXp),
    streak: effectiveStreak(s, today),
    longestStreak: stats!.longestStreak,
    streakAtRisk: streakAtRisk(s, today),
    lessonsCompleted: stats!.lessonsCompleted,
    todayXp: act?.xp ?? 0,
    dailyGoal: dailyGoalXp(user.dailyMinutes),
    today,
  };
});

export type DayActivity = { day: string; xp: number; lessons: number };

/** Activity for the last `days` local days, oldest first, zero-filled. */
export async function getActivity(user: User, days: number): Promise<DayActivity[]> {
  const today = toLocalDay(new Date(), user.timezone);
  const from = addDays(today, -(days - 1));
  const rows = await getDb()
    .select()
    .from(schema.userActivity)
    .where(and(eq(schema.userActivity.userId, user.id), gte(schema.userActivity.day, from)));
  const map = new Map(rows.map((r) => [r.day, r]));
  return Array.from({ length: days }, (_, i) => {
    const day = addDays(from, i);
    const r = map.get(day);
    return { day, xp: r?.xp ?? 0, lessons: r?.lessons ?? 0 };
  });
}

export async function getRecentCompletions(userId: string, limit = 5) {
  return getDb()
    .select({
      id: schema.lessonRuns.id,
      title: schema.lessons.title,
      completedAt: schema.lessonRuns.completedAt,
      xp: schema.lessonRuns.xpAwarded,
      mistakes: schema.lessonRuns.mistakes,
    })
    .from(schema.lessonRuns)
    .innerJoin(schema.lessons, eq(schema.lessons.id, schema.lessonRuns.lessonId))
    .where(and(eq(schema.lessonRuns.userId, userId), eq(schema.lessonRuns.status, "completed")))
    .orderBy(desc(schema.lessonRuns.completedAt))
    .limit(limit);
}
