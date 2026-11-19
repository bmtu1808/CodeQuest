import { describe, expect, it } from "vitest";
import { analyse, recommendProblems, targetRating, topicMastery, unitMastery, type ProblemFact } from "@/features/analytics/mastery";
import { computeRatingChanges } from "@/features/contest/rating";
import { computeScoreboard, contestPhase, virtualRank } from "@/features/contest/scoring";
import { nextReview, NEW_REVIEW } from "@/features/learning/srs";

const T0 = new Date("2026-05-01T10:00:00Z");
const at = (min: number) => new Date(T0.getTime() + min * 60_000);

describe("contest phases", () => {
  const c = { startsAt: T0, durationMin: 120 };
  it("is upcoming, live, then past", () => {
    expect(contestPhase(at(-1), c)).toBe("upcoming");
    expect(contestPhase(at(0), c)).toBe("live");
    expect(contestPhase(at(119), c)).toBe("live");
    expect(contestPhase(at(120), c)).toBe("past");
  });
});

describe("ICPC scoreboard", () => {
  const labels = ["A", "B", "C"];
  const sub = (userId: string, problemLabel: string, verdict: string, min: number) => ({ userId, problemLabel, verdict, createdAt: at(min) });
  const win = new Map([["u1", T0], ["u2", T0], ["u3", T0]]);
  it("ranks by solved then penalty, with 20 minutes per wrong attempt before the first accept", () => {
    const rows = computeScoreboard(
      [
        sub("u1", "A", "wrong_answer", 5),
        sub("u1", "A", "wrong_answer", 8),
        sub("u1", "A", "accepted", 12), // 12 + 40 = 52
        sub("u1", "A", "wrong_answer", 30), // after the accept: ignored
        sub("u2", "A", "accepted", 10), // 10
        sub("u2", "B", "accepted", 50), // 50  => 2 solved, 60
        sub("u3", "A", "accepted", 3),
      ],
      labels,
      win,
      120,
    );
    expect(rows.map((r) => [r.userId, r.solved, r.penalty, r.rank])).toEqual([
      ["u2", 2, 60, 1],
      ["u3", 1, 3, 2],
      ["u1", 1, 52, 3],
    ]);
    expect(rows[2]!.cells.A).toEqual({ solved: true, wrong: 2, minutes: 12 });
  });
  it("ignores compile errors and judge errors, unsolved wrong attempts, and late submissions", () => {
    const rows = computeScoreboard(
      [sub("u1", "A", "compilation_error", 1), sub("u1", "A", "internal_error", 2), sub("u1", "A", "wrong_answer", 3), sub("u1", "B", "accepted", 121), sub("u1", "A", "accepted", 20)],
      labels,
      new Map([["u1", T0]]),
      120,
    );
    expect(rows[0]).toMatchObject({ solved: 1, penalty: 20 + 20 });
    expect(rows[0]!.cells.B!.solved).toBe(false); // minute 121 is outside the 120 minute window
  });
  it("gives equal results equal rank", () => {
    const rows = computeScoreboard([sub("u1", "A", "accepted", 10), sub("u2", "A", "accepted", 10)], labels, new Map([["u1", T0], ["u2", T0]]), 120);
    expect(rows.map((r) => r.rank)).toEqual([1, 1]);
  });
  it("measures a virtual run from its own start", () => {
    const start = at(1000);
    const rows = computeScoreboard([{ userId: "v", problemLabel: "A", verdict: "accepted", createdAt: new Date(start.getTime() + 7 * 60_000) }], labels, new Map([["v", start]]), 120);
    expect(rows[0]).toMatchObject({ solved: 1, penalty: 7 });
  });
  it("places a virtual result among the official ones", () => {
    const official = [{ solved: 3, penalty: 100 }, { solved: 2, penalty: 50 }, { solved: 2, penalty: 90 }];
    expect(virtualRank(official, { solved: 2, penalty: 60 })).toBe(3);
    expect(virtualRank(official, { solved: 4, penalty: 500 })).toBe(1);
    expect(virtualRank(official, { solved: 0, penalty: 0 })).toBe(4);
  });
});

describe("rating", () => {
  it("rewards beating higher rated players and is (nearly) zero-sum", () => {
    const out = computeRatingChanges([
      { userId: "a", rating: 1500, rank: 1 },
      { userId: "b", rating: 1700, rank: 2 },
      { userId: "c", rating: 1300, rank: 3 },
    ]);
    const by = Object.fromEntries(out.map((o) => [o.userId, o.newRating - o.oldRating]));
    expect(by.a!).toBeGreaterThan(0);
    expect(by.c!).toBeLessThan(0);
    expect(Math.abs(by.a! + by.b! + by.c!)).toBeLessThanOrEqual(3);
  });
  it("does not change a lone participant, and equal ranks of equal ratings do not move", () => {
    expect(computeRatingChanges([{ userId: "a", rating: 1500, rank: 1 }])[0]!.newRating).toBe(1500);
    const tie = computeRatingChanges([{ userId: "a", rating: 1500, rank: 1 }, { userId: "b", rating: 1500, rank: 1 }]);
    expect(tie.map((t) => t.newRating)).toEqual([1500, 1500]);
  });
});

describe("spaced repetition", () => {
  const now = T0;
  it("climbs 1 day, 3 days, then by ease", () => {
    const a = nextReview(NEW_REVIEW, true, now);
    expect(a.state.intervalDays).toBe(1);
    const b = nextReview(a.state, true, now);
    expect(b.state.intervalDays).toBe(3);
    const c = nextReview(b.state, true, now);
    expect(c.state.intervalDays).toBeGreaterThan(3);
    expect(c.dueAt.getTime()).toBe(now.getTime() + c.state.intervalDays * 86_400_000);
  });
  it("a miss resets the ladder, lowers ease (never below 1.3) and retries in 10 minutes", () => {
    let s = nextReview(NEW_REVIEW, true, now).state;
    for (let i = 0; i < 20; i++) s = nextReview(s, false, now).state;
    expect(s).toMatchObject({ repetitions: 0, intervalDays: 0, easeMilli: 1300, lapses: 20 });
    expect(nextReview(s, false, now).dueAt.getTime()).toBe(now.getTime() + 600_000);
  });
});

describe("topic mastery and recommendations", () => {
  const f = (slug: string, difficulty: string, rating: number, tags: string[], solved: boolean, attempted = solved): ProblemFact => ({ slug, title: slug, difficulty, rating, tags, solved, attempted });
  const facts = [
    f("a1", "newbie", 800, ["arrays"], true),
    f("a2", "easy", 1000, ["arrays"], true),
    f("a3", "medium", 1300, ["arrays"], false),
    f("b1", "easy", 1000, ["binary-search"], false, true),
    f("b2", "medium", 1400, ["binary-search"], false, true),
    f("b3", "easy", 1100, ["binary-search"], false, false),
    f("g1", "easy", 1100, ["graphs"], false),
  ];
  const m = topicMastery(facts);
  it("computes mastery from real results and leaves untouched topics out", () => {
    const arrays = m.topics.find((t) => t.topic === "arrays")!;
    expect(arrays).toMatchObject({ solved: 2, attempted: 2, total: 3, confidence: "ok" });
    expect(arrays.mastery).toBe(Math.round(100 * (0.6 * 1 + 0.4 * (3 / 7)))); // solved 3 of 7 weight
    expect(m.topics.find((t) => t.topic === "binary-search")!.mastery).toBe(0);
    expect(m.untried).toEqual(["graphs"]);
  });
  it("says what the data supports and nothing more", () => {
    const text = analyse(m.topics, []).map((i) => i.text).join(" ");
    expect(text).toContain("binary-search");
    expect(analyse([], [])[0]!.text).toMatch(/Not enough activity/);
  });
  it("recommends unsolved problems near the learner's level in weak topics first", () => {
    expect(targetRating([800, 1000])).toBe(1100);
    const rec = recommendProblems(facts, m.topics, [800, 1000], 3);
    expect(rec.every((r) => !["a1", "a2"].includes(r.slug))).toBe(true);
    expect(rec[0]!.reason).toMatch(/binary-search|graphs/);
    expect(recommendProblems(facts, m.topics, [], 10, new Set(["b3"])).map((r) => r.slug)).not.toContain("b3");
  });
  it("lesson unit accuracy skips units with no attempts", () => {
    expect(unitMastery([{ slug: "x", title: "X", attempts: 0, correct: 0 }, { slug: "y", title: "Y", attempts: 20, correct: 15 }])).toEqual([{ slug: "y", title: "Y", accuracy: 75, attempts: 20, confidence: "ok" }]);
  });
});
