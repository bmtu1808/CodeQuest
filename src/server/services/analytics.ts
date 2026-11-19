import { and, eq, gte, sql } from "drizzle-orm";
import { getDb, schema } from "@/server/db/client";
import type { User } from "@/server/db/schema";
import { analyse, recommendProblems, topicMastery, unitMastery, type Insight, type ProblemFact, type Recommendation, type TopicMastery, type UnitMastery } from "@/features/analytics/mastery";
import { addDays, toLocalDay } from "@/features/gamification/streak";
import { getMyRating } from "./contests";
import { getSnapshot } from "./snapshot";

const UNFINISHED_CONTEST = sql`exists (select 1 from contest_problems cp join contests c on c.id = cp.contest_id where cp.problem_id = p.id and c.published and now() < c.starts_at + c.duration_min * interval '1 minute')`;

/** Every open problem with the learner's own result on it. Problems locked inside unfinished contests are not included. */
export async function getProblemFacts(userId: string): Promise<ProblemFact[]> {
  const r = await getDb().execute(sql`
    select p.slug, p.title, p.difficulty, p.rating, p.tags, coalesce(up.solved, false) as solved, coalesce(up.attempts, 0) > 0 as attempted
    from problems p
    left join user_problem_progress up on up.problem_id = p.id and up.user_id = ${userId}
    where p.published and p.deleted_at is null and not ${UNFINISHED_CONTEST}
    order by p.rating, p.slug`);
  return (r.rows as Array<{ slug: string; title: string; difficulty: string; rating: number; tags: string[]; solved: boolean; attempted: boolean }>).map((x) => ({ ...x, rating: Number(x.rating) }));
}

async function unitFacts(userId: string) {
  const r = await getDb().execute(sql`
    select u.slug, u.title, count(a.id)::int as attempts, count(a.id) filter (where a.is_correct)::int as correct
    from units u
    join lessons l on l.unit_id = u.id and l.published and l.deleted_at is null
    join lesson_questions q on q.lesson_id = l.id and q.deleted_at is null
    left join user_question_attempts a on a.question_id = q.id and a.user_id = ${userId}
    where u.published
    group by u.id, u.slug, u.title, u."position"
    order by u."position"`);
  return (r.rows as Array<{ slug: string; title: string; attempts: number; correct: number }>).map((x) => ({ ...x, attempts: Number(x.attempts), correct: Number(x.correct) }));
}

export type Insights = { topics: TopicMastery[]; untried: string[]; units: UnitMastery[]; insights: Insight[]; recommendations: Recommendation[] };

/** Mastery, weakness analysis and problem recommendations, all computed from the learner's stored results. */
export async function getInsights(userId: string, limit = 5): Promise<Insights> {
  const [facts, units] = await Promise.all([getProblemFacts(userId), unitFacts(userId)]);
  const { topics, untried } = topicMastery(facts);
  const um = unitMastery(units);
  const solvedRatings = facts.filter((f) => f.solved).map((f) => f.rating);
  return { topics, untried, units: um, insights: analyse(topics, um), recommendations: recommendProblems(facts, topics, solvedRatings, limit) };
}

export type Stats = {
  totals: { xp: number; level: number; levelTitle: string; lessons: number; problemsSolved: number; acceptanceRate: number | null; judged: number; streak: number; longestStreak: number };
  rating: { rating: number; peak: number; contests: number } | null;
  week: { xp: number; lessons: number; activeDays: number };
  month: { xp: number; lessons: number; activeDays: number };
  avgXpPerActiveDay: number | null;
  xpSeries: Array<{ day: string; value: number }>;
  solvedSeries: Array<{ day: string; value: number }>;
  topicDistribution: Array<{ label: string; value: number }>;
  difficultyDistribution: Array<{ label: string; value: number }>;
  insights: Insights;
};

const DIFF_ORDER = ["newbie", "easy", "medium", "hard", "expert"];

export async function getStats(user: User): Promise<Stats> {
  const db = getDb();
  const snap = await getSnapshot(user);
  const today = toLocalDay(new Date(), user.timezone);
  const from30 = addDays(today, -29);
  const from7 = addDays(today, -6);
  const [act, solvedRows, subs, rating, insights] = await Promise.all([
    db.select().from(schema.userActivity).where(and(eq(schema.userActivity.userId, user.id), gte(schema.userActivity.day, from30))),
    db.execute(sql`
      select up.solved_at, p.difficulty, p.tags
      from user_problem_progress up join problems p on p.id = up.problem_id
      where up.user_id = ${user.id} and up.solved and up.solved_at is not null`),
    db.execute(sql`
      select count(*)::int as judged, count(*) filter (where verdict = 'accepted')::int as ok
      from submissions where user_id = ${user.id} and contest_participant_id is null and verdict not in ('pending','judging','internal_error','compilation_error')`),
    getMyRating(user.id),
    getInsights(user.id, 5),
  ]);
  // Local days are computed in code: PostgreSQL does not know every zone name a browser can report.
  const solved = (solvedRows.rows as Array<{ solved_at: Date | string; difficulty: string; tags: string[] }>).map((r) => ({ day: toLocalDay(new Date(r.solved_at), user.timezone), difficulty: r.difficulty, tags: r.tags }));
  const byDay = new Map(act.map((a) => [a.day, a]));
  const days = Array.from({ length: 30 }, (_, i) => addDays(from30, i));
  const solvedPerDay = new Map<string, number>();
  for (const s of solved) solvedPerDay.set(s.day, (solvedPerDay.get(s.day) ?? 0) + 1);
  const sum = (since: string) => {
    const rows = act.filter((a) => a.day >= since);
    return { xp: rows.reduce((s, r) => s + r.xp, 0), lessons: rows.reduce((s, r) => s + r.lessons, 0), activeDays: rows.filter((r) => r.xp > 0 || r.lessons > 0 || r.questions > 0).length };
  };
  const month = sum(from30);
  const tagCount = new Map<string, number>();
  const diffCount = new Map<string, number>();
  for (const s of solved) {
    diffCount.set(s.difficulty, (diffCount.get(s.difficulty) ?? 0) + 1);
    for (const t of s.tags) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
  }
  const sr = subs.rows[0] as { judged: number; ok: number };
  return {
    totals: {
      xp: snap.totalXp,
      level: snap.level.level,
      levelTitle: snap.level.title,
      lessons: snap.lessonsCompleted,
      problemsSolved: solved.length,
      acceptanceRate: sr.judged > 0 ? sr.ok / sr.judged : null,
      judged: Number(sr.judged),
      streak: snap.streak,
      longestStreak: snap.longestStreak,
    },
    rating: rating ? { rating: rating.rating, peak: rating.peak, contests: rating.contestsRated } : null,
    week: sum(from7),
    month,
    avgXpPerActiveDay: month.activeDays > 0 ? Math.round(month.xp / month.activeDays) : null,
    xpSeries: days.map((d) => ({ day: d, value: byDay.get(d)?.xp ?? 0 })),
    solvedSeries: days.map((d) => ({ day: d, value: solvedPerDay.get(d) ?? 0 })),
    topicDistribution: [...tagCount].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label)),
    difficultyDistribution: DIFF_ORDER.map((d) => ({ label: d, value: diffCount.get(d) ?? 0 })),
    insights,
  };
}
