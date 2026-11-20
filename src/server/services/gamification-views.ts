import { asc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/server/db/client";
import { ACHIEVEMENT_METRICS, type AchievementMetric } from "@/content/gamification";
import { achievementCounters, getTodayQuests } from "./engagement";

export async function getQuestsView(userId: string, day: string) {
  return getDb().transaction((tx) => getTodayQuests(tx, userId, day));
}

export type AchievementView = {
  slug: string;
  title: string;
  description: string;
  icon: string;
  rewardXp: number;
  threshold: number;
  current: number;
  metricLabel: string;
  unlockedAt: Date | null;
};

/** Every achievement with the learner's real progress toward it. */
export async function getAchievementsView(userId: string, timezone: string): Promise<AchievementView[]> {
  const db = getDb();
  const [defs, mine, counters] = await Promise.all([
    db.select().from(schema.achievements).where(eq(schema.achievements.active, true)).orderBy(asc(schema.achievements.position)),
    db.select().from(schema.userAchievements).where(eq(schema.userAchievements.userId, userId)),
    db.transaction((tx) => achievementCounters(tx, userId, timezone)),
  ]);
  const got = new Map(mine.map((m) => [m.achievementId, m.unlockedAt]));
  return defs.map((a) => ({
    slug: a.slug,
    title: a.title,
    description: a.description,
    icon: a.icon,
    rewardXp: a.rewardXp,
    threshold: a.threshold,
    current: Math.min(a.threshold, counters[a.metric as AchievementMetric] ?? 0),
    metricLabel: ACHIEVEMENT_METRICS[a.metric as AchievementMetric] ?? a.metric,
    unlockedAt: got.get(a.id) ?? null,
  }));
}

export type BadgeView = { slug: string; title: string; description: string; icon: string; times: number; firstAt: Date | null };

/** One collectible badge per daily quest. A badge is collected the first time its quest is completed; `times` counts repeats. */
export async function getBadgeCollection(userId: string): Promise<BadgeView[]> {
  const rows = await getDb().execute(sql`
    select q.slug, q.title, q.description, q.icon, count(uq.id)::int as times, min(uq.completed_at) as first_at
    from daily_quests q
    left join user_quests uq on uq.quest_id = q.id and uq.user_id = ${userId} and uq.completed_at is not null
    where q.active or uq.id is not null
    group by q.id
    order by (count(uq.id) = 0), min(uq.completed_at), q.slug`);
  return (rows.rows as Array<{ slug: string; title: string; description: string; icon: string; times: number; first_at: string | Date | null }>).map((r) => ({
    slug: r.slug,
    title: r.title,
    description: r.description,
    icon: r.icon,
    times: Number(r.times),
    firstAt: r.first_at ? new Date(r.first_at) : null,
  }));
}
