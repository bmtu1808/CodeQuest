/** Topic mastery, weakness analysis and problem recommendations. Pure functions over real stored facts. */

export const DIFFICULTY_WEIGHT: Record<string, number> = { newbie: 1, easy: 2, medium: 4, hard: 6, expert: 8 };

export type ProblemFact = { slug: string; title: string; difficulty: string; rating: number; tags: string[]; solved: boolean; attempted: boolean };

export type TopicMastery = {
  topic: string;
  /** 0..100 */
  mastery: number;
  solved: number;
  attempted: number;
  total: number;
  confidence: "low" | "ok";
};

/**
 * Mastery of a problem topic (tag), from the learner's real results:
 *   successRate = solved weight / attempted weight        (how often attempts turn into solutions)
 *   coverage    = solved weight / total weight of the tag (how much of the topic is done)
 *   mastery     = 100 * (0.6 * successRate + 0.4 * coverage)
 * Topics the learner has not attempted at all have no mastery yet and are returned in `untried`.
 * Weights grow with difficulty, so solving a hard problem counts more than a newbie one.
 */
export function topicMastery(facts: ProblemFact[]): { topics: TopicMastery[]; untried: string[] } {
  const acc = new Map<string, { solvedW: number; attW: number; totW: number; solved: number; attempted: number; total: number }>();
  for (const f of facts) {
    const w = DIFFICULTY_WEIGHT[f.difficulty] ?? 1;
    for (const t of f.tags) {
      const a = acc.get(t) ?? { solvedW: 0, attW: 0, totW: 0, solved: 0, attempted: 0, total: 0 };
      a.totW += w;
      a.total++;
      if (f.attempted || f.solved) {
        a.attW += w;
        a.attempted++;
      }
      if (f.solved) {
        a.solvedW += w;
        a.solved++;
      }
      acc.set(t, a);
    }
  }
  const topics: TopicMastery[] = [];
  const untried: string[] = [];
  for (const [topic, a] of acc) {
    if (a.attempted === 0) {
      untried.push(topic);
      continue;
    }
    const success = a.solvedW / a.attW;
    const coverage = a.solvedW / a.totW;
    topics.push({ topic, mastery: Math.round(100 * (0.6 * success + 0.4 * coverage)), solved: a.solved, attempted: a.attempted, total: a.total, confidence: a.attempted >= 2 ? "ok" : "low" });
  }
  topics.sort((a, b) => b.mastery - a.mastery || a.topic.localeCompare(b.topic));
  untried.sort();
  return { topics, untried };
}

export type UnitFact = { slug: string; title: string; attempts: number; correct: number };
export type UnitMastery = { slug: string; title: string; accuracy: number; attempts: number; confidence: "low" | "ok" };

/** Lesson-question accuracy per unit. Units with no attempts are left out. */
export function unitMastery(units: UnitFact[]): UnitMastery[] {
  return units
    .filter((u) => u.attempts > 0)
    .map((u) => ({ slug: u.slug, title: u.title, accuracy: Math.round((100 * u.correct) / u.attempts), attempts: u.attempts, confidence: (u.attempts >= 10 ? "ok" : "low") as "ok" | "low" }))
    .sort((a, b) => b.accuracy - a.accuracy || a.title.localeCompare(b.title));
}

export type Insight = { kind: "strength" | "weakness" | "info"; text: string; topic?: string; unitSlug?: string };

const WEAK_BELOW = 60;
const STRONG_FROM = 75;

/** Plain-language findings, produced only when there is enough real data to say something. */
export function analyse(topics: TopicMastery[], units: UnitMastery[]): Insight[] {
  const out: Insight[] = [];
  const solid = topics.filter((t) => t.confidence === "ok");
  const strong = solid.filter((t) => t.mastery >= STRONG_FROM).slice(0, 2);
  const weak = [...solid].filter((t) => t.mastery < WEAK_BELOW).sort((a, b) => a.mastery - b.mastery).slice(0, 2);
  if (strong.length && weak.length) out.push({ kind: "info", text: `You are strong at ${strong.map((t) => t.topic).join(" and ")} but need more practice with ${weak.map((t) => t.topic).join(" and ")}.` });
  for (const t of strong) out.push({ kind: "strength", topic: t.topic, text: `${t.topic}: ${t.mastery}% mastery (${t.solved} solved of ${t.attempted} attempted).` });
  for (const t of weak) out.push({ kind: "weakness", topic: t.topic, text: `${t.topic}: ${t.mastery}% mastery. You attempted ${t.attempted} but solved ${t.solved}.` });
  const unitsOk = units.filter((u) => u.confidence === "ok");
  for (const u of unitsOk.filter((x) => x.accuracy < WEAK_BELOW).slice(-2)) out.push({ kind: "weakness", unitSlug: u.slug, text: `Lessons on "${u.title}": only ${u.accuracy}% of your answers were right. A review would help.` });
  if (out.length === 0) out.push({ kind: "info", text: "Not enough activity yet to judge strengths and weaknesses. Solve a few problems and finish some lessons, then check back." });
  return out;
}

export type Recommendation = { slug: string; title: string; difficulty: string; rating: number; reason: string; score: number };

/** Difficulty the learner should aim for next: a little above the median rating of what they already solved. */
export function targetRating(solvedRatings: number[]): number {
  if (solvedRatings.length === 0) return 800;
  const s = [...solvedRatings].sort((a, b) => a - b);
  const mid = s[Math.floor(s.length / 2)]!;
  return mid + 100;
}

/**
 * Unsolved problems ranked by how well they fit: half difficulty fit, half topic need.
 * topic need = 1 - mastery for attempted topics, 0.6 for topics never tried.
 */
export function recommendProblems(facts: ProblemFact[], topics: TopicMastery[], solvedRatings: number[], limit: number, excludeSlugs: Set<string> = new Set()): Recommendation[] {
  const target = targetRating(solvedRatings);
  const mastery = new Map(topics.map((t) => [t.topic, t.mastery]));
  const out: Recommendation[] = [];
  for (const f of facts) {
    if (f.solved || excludeSlugs.has(f.slug)) continue;
    const fit = 1 - Math.min(1, Math.abs(f.rating - target) / 600);
    const needs = f.tags.map((t) => ({ t, need: mastery.has(t) ? 1 - mastery.get(t)! / 100 : 0.6 }));
    const need = needs.length ? needs.reduce((s, x) => s + x.need, 0) / needs.length : 0.6;
    const top = [...needs].sort((a, b) => b.need - a.need)[0];
    const reason = !top
      ? "Fits your current level."
      : mastery.has(top.t)
        ? `Builds ${top.t}, where your mastery is ${mastery.get(top.t)}%.`
        : `A new topic for you: ${top.t}.`;
    out.push({ slug: f.slug, title: f.title, difficulty: f.difficulty, rating: f.rating, reason, score: Math.round((0.5 * fit + 0.5 * need) * 1000) / 1000 });
  }
  out.sort((a, b) => b.score - a.score || a.rating - b.rating || a.slug.localeCompare(b.slug));
  return out.slice(0, limit);
}
