import { and, eq, sql } from "drizzle-orm";
import { schema } from "@/server/db/client";
import { levelFromXp } from "@/features/gamification/xp";
import { toLocalDay } from "@/features/gamification/streak";
import { pickQuests } from "@/features/gamification/quests";
import { QUESTS_PER_DAY, type AchievementMetric, type QuestMetric } from "@/content/gamification";
import { notify } from "./notifications";
import { awardXp, type Tx } from "./xp";

/** What just happened. Every field is an amount to add to the matching quest metric for the day. */
export type EngagementEvent = Partial<Record<QuestMetric, number>>;

export type Reward = { kind: "quest" | "achievement"; slug: string; title: string; xp: number };

/**
 * Called inside the transaction of a learning action (lesson completed, problem judged) AFTER its own stats are saved.
 * 1. makes sure today's quests exist, adds the event's progress, completes quests (+XP, once per quest per day)
 * 2. unlocks achievements whose real counters now reach their threshold (+XP, once ever)
 * 3. writes notifications for everything above and for level-ups
 * Rewards are returned so the UI can show exactly what was granted. The caller must hold the user_stats row lock.
 */
export async function trackEngagement(tx: Tx, p: { userId: string; timezone: string; day: string; now: Date; xpBefore: number; event: EngagementEvent }): Promise<{ rewards: Reward[]; xp: number }> {
  const rewards: Reward[] = [];

  // 1. quests -----------------------------------------------------------
  await ensureDailyQuests(tx, p.userId, p.day);
  const rows = await tx
    .select({ uq: schema.userQuests, q: schema.dailyQuests })
    .from(schema.userQuests)
    .innerJoin(schema.dailyQuests, eq(schema.dailyQuests.id, schema.userQuests.questId))
    .where(and(eq(schema.userQuests.userId, p.userId), eq(schema.userQuests.day, p.day)))
    .for("update", { of: schema.userQuests });
  for (const { uq, q } of rows) {
    if (uq.completedAt) continue;
    const add = p.event[q.metric as QuestMetric] ?? 0;
    if (add <= 0) continue;
    const progress = Math.min(q.target, uq.progress + add);
    const done = progress >= q.target;
    await tx
      .update(schema.userQuests)
      .set({ progress, completedAt: done ? p.now : null })
      .where(eq(schema.userQuests.id, uq.id));
    if (done && (await awardXp(tx, { userId: p.userId, amount: q.rewardXp, reason: "daily_quest", idempotencyKey: `quest:${q.id}:${p.day}`, refType: "quest", refId: q.id }))) {
      rewards.push({ kind: "quest", slug: q.slug, title: q.title, xp: q.rewardXp });
      await notify(tx, { userId: p.userId, type: "quest", title: `Quest complete: ${q.title}`, body: `+${q.rewardXp} XP`, href: "/quests" });
    }
  }

  // 2. achievements (rewards may unlock XP-based ones, so loop a few times) --
  for (let round = 0; round < 3; round++) {
    const unlocked = await unlockAchievements(tx, p.userId, p.timezone);
    if (unlocked.length === 0) break;
    rewards.push(...unlocked);
  }

  // 3. level-up + bookkeeping ----------------------------------------------
  const extraXp = rewards.reduce((s, r) => s + r.xp, 0);
  if (extraXp > 0) {
    await tx
      .insert(schema.userActivity)
      .values({ userId: p.userId, day: p.day, xp: extraXp, lessons: 0, questions: 0 })
      .onConflictDoUpdate({ target: [schema.userActivity.userId, schema.userActivity.day], set: { xp: sql`${schema.userActivity.xp} + ${extraXp}` } });
  }
  const [after] = await tx.select({ totalXp: schema.userStats.totalXp }).from(schema.userStats).where(eq(schema.userStats.userId, p.userId));
  const before = levelFromXp(p.xpBefore);
  const now = levelFromXp(after?.totalXp ?? p.xpBefore);
  if (now.level > before.level) {
    await notify(tx, { userId: p.userId, type: "level", title: `Level ${now.level}: ${now.title}`, body: "You levelled up!", href: "/profile" });
  }
  return { rewards, xp: extraXp };
}

async function ensureDailyQuests(tx: Tx, userId: string, day: string): Promise<void> {
  const existing = await tx.select({ id: schema.userQuests.id }).from(schema.userQuests).where(and(eq(schema.userQuests.userId, userId), eq(schema.userQuests.day, day))).limit(1);
  if (existing.length) return;
  const pool = await tx.select().from(schema.dailyQuests).where(eq(schema.dailyQuests.active, true));
  const picked = pickQuests(pool, `${userId}:${day}`, QUESTS_PER_DAY);
  if (!picked.length) return;
  await tx
    .insert(schema.userQuests)
    .values(picked.map((q) => ({ userId, questId: q.id, day })))
    .onConflictDoNothing();
}

/** Real counters for achievements. Each is a query on stored facts. */
export async function achievementCounters(tx: Pick<Tx, "execute" | "select">, userId: string, timezone: string): Promise<Record<AchievementMetric, number>> {
  const one = async (q: ReturnType<typeof sql>): Promise<number> => {
    const r = await tx.execute(q);
    return Number((r.rows[0] as { n?: number | string } | undefined)?.n ?? 0);
  };
  const [stats] = await tx.select().from(schema.userStats).where(eq(schema.userStats.userId, userId));
  const lessons_completed = await one(sql`select count(*) as n from user_lesson_progress where user_id = ${userId} and completions > 0`);
  const perfect_lessons = await one(sql`select count(*) as n from user_lesson_progress where user_id = ${userId} and perfected`);
  const problems_solved = await one(sql`select count(*) as n from user_problem_progress where user_id = ${userId} and solved`);
  const hard_problems = await one(sql`select count(*) as n from user_problem_progress up join problems p on p.id = up.problem_id where up.user_id = ${userId} and up.solved and p.difficulty in ('hard','expert')`);
  const solved_no_hint = await one(sql`select count(*) as n from user_problem_progress where user_id = ${userId} and solved and solved_without_hints`);
  // Grouped in code, not SQL: browsers report zone names (e.g. Asia/Saigon) that PostgreSQL may not know.
  const solvedAt = await tx.execute(sql`select solved_at from user_problem_progress where user_id = ${userId} and solved and solved_at is not null`);
  const perDay = new Map<string, number>();
  for (const r of solvedAt.rows as Array<{ solved_at: Date | string }>) {
    const day = toLocalDay(new Date(r.solved_at), timezone);
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
  }
  const solved_in_day = Math.max(0, ...perDay.values());
  const bugs_fixed = await one(sql`select count(distinct a.question_id) as n from user_question_attempts a join lesson_questions q on q.id = a.question_id where a.user_id = ${userId} and a.is_correct and q.type = 'find_bug'`);
  const quests_completed = await one(sql`select count(*) as n from user_quests where user_id = ${userId} and completed_at is not null`);
  const hello_world = await one(sql`select count(*) as n from user_problem_progress up join problems p on p.id = up.problem_id where up.user_id = ${userId} and up.solved and p.slug = 'hello-coder'`);
  const totalXp = stats?.totalXp ?? 0;
  return {
    lessons_completed,
    perfect_lessons,
    problems_solved,
    hard_problems,
    solved_no_hint,
    solved_in_day,
    bugs_fixed,
    longest_streak: stats?.longestStreak ?? 0,
    total_xp: totalXp,
    level: levelFromXp(totalXp).level,
    quests_completed,
    hello_world,
  };
}

async function unlockAchievements(tx: Tx, userId: string, timezone: string): Promise<Reward[]> {
  const all = await tx.select().from(schema.achievements).where(eq(schema.achievements.active, true));
  const have = new Set((await tx.select({ id: schema.userAchievements.achievementId }).from(schema.userAchievements).where(eq(schema.userAchievements.userId, userId))).map((r) => r.id));
  const todo = all.filter((a) => !have.has(a.id));
  if (!todo.length) return [];
  const counters = await achievementCounters(tx, userId, timezone);
  const out: Reward[] = [];
  const hit = todo.filter((a) => (counters[a.metric as AchievementMetric] ?? 0) >= a.threshold);
  if (!hit.length) return [];
  const inserted = await tx
    .insert(schema.userAchievements)
    .values(hit.map((a) => ({ userId, achievementId: a.id })))
    .onConflictDoNothing()
    .returning({ achievementId: schema.userAchievements.achievementId });
  const newIds = new Set(inserted.map((r) => r.achievementId));
  for (const a of hit) {
    if (!newIds.has(a.id)) continue;
    if (a.rewardXp > 0) await awardXp(tx, { userId, amount: a.rewardXp, reason: "achievement", idempotencyKey: `achievement:${a.slug}`, refType: "achievement", refId: a.id });
    out.push({ kind: "achievement", slug: a.slug, title: a.title, xp: a.rewardXp });
    await notify(tx, { userId, type: "achievement", title: `Achievement unlocked: ${a.title}`, body: a.rewardXp ? `+${a.rewardXp} XP` : a.description, href: "/achievements" });
  }
  return out;
}

/** Today's quests with progress (read-only; creates the day's assignment if missing). */
export async function getTodayQuests(tx: Tx, userId: string, day: string) {
  await ensureDailyQuests(tx, userId, day);
  return tx
    .select({ slug: schema.dailyQuests.slug, title: schema.dailyQuests.title, description: schema.dailyQuests.description, icon: schema.dailyQuests.icon, target: schema.dailyQuests.target, rewardXp: schema.dailyQuests.rewardXp, progress: schema.userQuests.progress, completedAt: schema.userQuests.completedAt })
    .from(schema.userQuests)
    .innerJoin(schema.dailyQuests, eq(schema.dailyQuests.id, schema.userQuests.questId))
    .where(and(eq(schema.userQuests.userId, userId), eq(schema.userQuests.day, day)))
    .orderBy(schema.dailyQuests.slug);
}

