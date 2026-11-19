/**
 * Contests, ratings, spaced repetition and analytics against a REAL database and a Judge0-compatible judge backed by
 * the local g++ (test harness only). Requires TEST_DATABASE_URL.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startFakeJudge0, type FakeJudge0 } from "./helpers/fake-judge0";

const url = process.env.TEST_DATABASE_URL;
const d = url ? describe : describe.skip;

const ADD = `#include <iostream>\nint main(){long long a,b;std::cin>>a>>b;std::cout<<a+b<<"\\n";}`;
const MUL = `#include <iostream>\nint main(){long long a,b;std::cin>>a>>b;std::cout<<a*b<<"\\n";}`;
const WRONG = `#include <iostream>\nint main(){long long a,b;std::cin>>a>>b;std::cout<<a-b<<"\\n";}`;
const CE = `int main( {`;
const MIN = 60_000;

d("contests, ratings, reviews, analytics (real database)", () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let fake: FakeJudge0;
  let db: any, schema: any, orm: any;
  let C: any, P: any, R: any, A: any, L: any, PATH: any;
  const users: Record<string, string> = {};
  const ids: Record<string, string> = {};

  beforeAll(async () => {
    fake = await startFakeJudge0();
    process.env.DATABASE_URL = url;
    process.env.JUDGE0_URL = fake.url;
    const { execFileSync } = await import("node:child_process");
    const env = { ...process.env, DATABASE_URL: url };
    execFileSync("npx", ["tsx", "scripts/migrate.ts"], { env, stdio: "pipe" });
    execFileSync("npx", ["tsx", "scripts/seed.ts"], { env, stdio: "pipe" });
    orm = await import("drizzle-orm");
    ({ getDb: db, schema } = await import("@/server/db/client"));
    C = await import("@/server/services/contests");
    P = await import("@/server/services/problems");
    R = await import("@/server/services/reviews");
    A = await import("@/server/services/analytics");
    L = await import("@/server/services/lesson-run");
    PATH = await import("@/server/services/path");
    const h = db();
    await h.execute(orm.sql`TRUNCATE users, problems, contests CASCADE`);
    await h.execute(orm.sql`update daily_quests set active = false`);
    await h.execute(orm.sql`update achievements set active = false`);
    for (const n of ["u1", "u2", "u3", "solo"]) {
      // Asia/Saigon is a valid browser zone name that PostgreSQL does not recognise: it must still work everywhere.
      const [u] = await h.insert(schema.users).values({ email: `${n}@example.com`, username: n, passwordHash: "x", displayName: n.toUpperCase(), timezone: n === "solo" ? "Asia/Saigon" : "UTC" }).returning();
      await h.insert(schema.userStats).values({ userId: u.id });
      users[n] = u.id;
    }
    const mk = async (slug: string, tags: string[], difficulty: string, rating: number, tests: Array<[string, string]>) => {
      const [p] = await h
        .insert(schema.problems)
        .values({ slug, title: `Problem ${slug}`, statement: "s", inputFormat: "i", outputFormat: "o", constraints: "c", difficulty, rating, tags, timeLimitMs: 1000, memoryLimitMb: 256, samples: [{ input: tests[0]![0], output: tests[0]![1] }], hints: ["h1", "h2", "h3"], editorial: "EDITORIAL", referenceSolution: "REF" })
        .returning();
      for (const [i, [input, out]] of tests.entries()) await h.insert(schema.problemTestCases).values({ problemId: p.id, position: i + 1, input, expectedOutput: out, isSample: i === 0 });
      ids[slug] = p.id;
    };
    await mk("t-add", ["math"], "easy", 1000, [["1 2\n", "3\n"], ["10 20\n", "30\n"]]);
    await mk("t-mul", ["math"], "easy", 1100, [["2 3\n", "6\n"], ["5 5\n", "25\n"]]);
    await mk("t-solo", ["arrays"], "newbie", 800, [["1 1\n", "2\n"]]);
    await mk("t-other", ["graphs"], "medium", 1500, [["1 1\n", "2\n"]]);
    const mkContest = async (slug: string, startOffsetMin: number, durationMin: number) => {
      const [c] = await h.insert(schema.contests).values({ slug, title: slug, startsAt: new Date(Date.now() + startOffsetMin * MIN), durationMin }).returning();
      for (const [i, ps] of ["t-add", "t-mul"].entries()) await h.insert(schema.contestProblems).values({ contestId: c.id, problemId: ids[ps], label: String.fromCharCode(65 + i), position: i + 1 });
      ids[slug] = c.id;
      return c;
    };
    // The same two problems can only belong to one contest at a time in these tests, so each phase uses its own pair.
    await mkContest("c-upcoming", 2 * 24 * 60, 60);
  });
  afterAll(async () => {
    await fake?.close();
    const { getPool } = await import("@/server/db/client");
    await getPool().end();
  });

  const moveContest = (slug: string, startOffsetMin: number, durationMin = 60) => db().update(schema.contests).set({ startsAt: new Date(Date.now() + startOffsetMin * MIN), durationMin, ratedAt: null }).where(orm.eq(schema.contests.slug, slug));

  it("hides an upcoming contest's problems everywhere, and locks them in practice", async () => {
    const view = await C.getContest(users.u1, "c-upcoming");
    expect(view.phase).toBe("upcoming");
    expect(view.problems).toBeNull();
    await expect(C.getContestProblem(users.u1, "c-upcoming", "A")).rejects.toMatchObject({ status: 403 });
    await expect(P.getProblem(users.u1, "t-add")).rejects.toMatchObject({ status: 423 });
    await expect(P.submit(users.u1, "t-add", ADD, "cpp17")).rejects.toMatchObject({ status: 423 });
    await expect(P.revealHint(users.u1, "t-add", 1)).rejects.toMatchObject({ status: 423 });
    const list = await P.listProblems(users.u1, {});
    expect(list.items.map((p: any) => p.slug).sort()).toEqual(["t-other", "t-solo"]);
    const facts = await A.getProblemFacts(users.u1);
    expect(facts.map((f: any) => f.slug).sort()).toEqual(["t-other", "t-solo"]);
  });

  it("scores a live contest ICPC style and gives no XP, hints or practice progress", async () => {
    await moveContest("c-upcoming", -10, 120); // started 10 minutes ago
    for (const u of ["u1", "u2", "u3"]) await C.register(users[u], "c-upcoming");
    const view = await C.getContest(users.u1, "c-upcoming");
    expect(view.phase).toBe("live");
    expect(view.problems.map((p: any) => p.label)).toEqual(["A", "B"]);
    const prob = await C.getContestProblem(users.u1, "c-upcoming", "A");
    expect(prob).toMatchObject({ hintsTotal: 0, editorial: null, referenceSolution: null });
    expect(JSON.stringify(prob)).not.toContain("EDITORIAL");

    expect((await C.contestSubmit(users.u1, "c-upcoming", "A", WRONG, "cpp17")).verdict).toBe("wrong_answer");
    const ok = await C.contestSubmit(users.u1, "c-upcoming", "A", ADD, "cpp17");
    expect(ok).toMatchObject({ verdict: "accepted", xpGained: 0, firstSolve: false });
    await C.contestSubmit(users.u2, "c-upcoming", "A", ADD, "cpp17");
    await C.contestSubmit(users.u2, "c-upcoming", "B", MUL, "cpp17");
    expect((await C.contestSubmit(users.u3, "c-upcoming", "A", CE, "cpp17")).verdict).toBe("compilation_error");

    const board = await C.getScoreboard(users.u1, "c-upcoming");
    // U3 only sent a compile error: it counts as taking part (0 solved) but compile errors cost no penalty
    expect(board.rows.map((r: any) => [r.displayName, r.solved, r.rank])).toEqual([["U2", 2, 1], ["U1", 1, 2], ["U3", 0, 3]]);
    expect(board.rows.find((r: any) => r.displayName === "U1").cells.A.wrong).toBe(1);
    const xp = (await db().select().from(schema.userStats).where(orm.eq(schema.userStats.userId, users.u1)))[0].totalXp;
    expect(xp).toBe(0);
    expect((await db().select().from(schema.userProblemProgress)).length).toBe(0);
    await expect(C.contestSubmit(users.solo, "c-upcoming", "A", ADD, "cpp17")).rejects.toMatchObject({ status: 403 }); // never registered
  });

  it("rates a finished live contest exactly once and the changes add up", async () => {
    // Move the contest into the past while keeping the submissions inside its window.
    await moveContest("c-upcoming", -200, 60);
    await db().execute(orm.sql`update submissions set created_at = (select starts_at from contests where slug = 'c-upcoming') + interval '5 minutes' + (random() * interval '10 minutes')`);
    await expect(C.contestSubmit(users.u1, "c-upcoming", "B", MUL, "cpp17")).rejects.toMatchObject({ status: 403 }); // window closed
    expect(await C.rateContestIfDue(ids["c-upcoming"])).toBe(true);
    expect(await C.rateContestIfDue(ids["c-upcoming"])).toBe(false);
    const rc = await db().select().from(schema.ratingChanges);
    expect(rc).toHaveLength(3);
    const byRank = Object.fromEntries(rc.map((r: any) => [r.rank, r.newRating - r.oldRating]));
    expect(byRank[1]).toBeGreaterThan(0);
    expect(byRank[3]).toBeLessThan(0);
    expect(Math.abs(byRank[1] + byRank[2] + byRank[3])).toBeLessThanOrEqual(3);
    const ratings = await db().select().from(schema.userRatings);
    expect(ratings).toHaveLength(3);
    expect(ratings.every((r: any) => r.contestsRated === 1)).toBe(true);
    const notes = await db().select().from(schema.notifications).where(orm.eq(schema.notifications.type, "system"));
    expect(notes.length).toBe(3);
    expect((await C.getRatingBoard(5))[0].displayName).toBe("U2");
  });

  it("runs a virtual contest in a personal window and shows where it would have placed", async () => {
    await expect(C.startVirtual(users.solo, "c-upcoming", new Date(Date.now() - 400 * MIN))).rejects.toMatchObject({ status: 409 }); // not past at that instant
    await C.startVirtual(users.solo, "c-upcoming");
    const win = await C.getContest(users.solo, "c-upcoming");
    expect(win.window.mode).toBe("virtual");
    expect(win.problems).toHaveLength(2);
    await C.contestSubmit(users.solo, "c-upcoming", "A", ADD, "cpp17");
    const board = await C.getScoreboard(users.solo, "c-upcoming");
    expect(board.virtual).toMatchObject({ solved: 1 });
    expect(board.virtual.rank).toBeGreaterThanOrEqual(2); // behind U2 (2 solved); U1 also has 1 solved
    expect(board.rows.some((r: any) => r.displayName === "SOLO")).toBe(false); // never on the official board
    await expect(C.startVirtual(users.solo, "c-upcoming")).rejects.toMatchObject({ status: 409 }); // one run only
    // virtual run is not rated
    expect(await db().select().from(schema.ratingChanges)).toHaveLength(3);
  });

  it("opens the problems for normal practice once the contest is over, and supports untimed practice mode", async () => {
    await expect(P.getProblem(users.u3, "t-add")).resolves.toMatchObject({ slug: "t-add" });
    await C.startPractice(users.u3, "c-upcoming");
    const r = await C.contestSubmit(users.u3, "c-upcoming", "B", MUL, "cpp17");
    expect(r.verdict).toBe("accepted");
    expect(r.xpGained).toBe(0);
    const board = await C.getScoreboard(users.u3, "c-upcoming");
    expect(board.rows.find((x: any) => x.displayName === "U3").solved).toBe(0); // the practice solve is not on the official board
    // contest submissions do not pollute the practice history
    expect(await P.listSubmissions(users.u3, "t-mul")).toHaveLength(0);
  });

  it("puts correct lesson answers on a review schedule and enforces due dates", async () => {
    const lessonIds = PATH.lessonSequence(await PATH.loadCurriculum());
    const run = await L.startOrResumeRun(users.u1, lessonIds[0]!);
    const first = run.remaining[0]!;
    const [q] = await db().select().from(schema.lessonQuestions).where(orm.eq(schema.lessonQuestions.id, first.id));
    const a = q.answer as any;
    const right = "index" in a ? { index: a.index } : "accepted" in a ? { text: a.accepted[0] } : "order" in a ? { order: a.order } : { pairs: a.pairs };
    const wrong = "index" in a ? { index: (a.index + 1) % (q.data.options?.length || 2) } : "accepted" in a ? { text: "zzz wrong" } : "order" in a ? { order: [...a.order].reverse() } : { pairs: [...a.pairs].reverse() };
    await L.answerQuestion(users.u1, run.runId, first.id, right);
    const sched = (await db().select().from(schema.questionReviews).where(orm.eq(schema.questionReviews.userId, users.u1)))[0];
    expect(sched.intervalDays).toBe(1);
    expect(sched.dueAt.getTime()).toBeGreaterThan(Date.now() + 20 * 60 * MIN);
    expect(await R.getDueReviews(users.u1)).toHaveLength(0);
    await expect(R.answerReview(users.u1, first.id, right)).rejects.toMatchObject({ status: 409 }); // not due: no farming
    await db().update(schema.questionReviews).set({ dueAt: new Date(Date.now() - MIN) }).where(orm.eq(schema.questionReviews.id, sched.id));
    const due = await R.getDueReviews(users.u1);
    expect(due.map((x: any) => x.id)).toEqual([first.id]);
    expect(JSON.stringify(due)).not.toContain('"accepted"');
    expect((await R.getReviewOverview(users.u1)).due).toBe(1);
    const miss = await R.answerReview(users.u1, first.id, wrong);
    expect(miss.correct).toBe(false);
    let row = (await db().select().from(schema.questionReviews).where(orm.eq(schema.questionReviews.id, sched.id)))[0];
    expect(row).toMatchObject({ lapses: 1, repetitions: 0 });
    expect(row.dueAt.getTime()).toBeLessThan(Date.now() + 11 * MIN);
    await db().update(schema.questionReviews).set({ dueAt: new Date(Date.now() - MIN) }).where(orm.eq(schema.questionReviews.id, sched.id));
    const hit = await R.answerReview(users.u1, first.id, right);
    expect(hit).toMatchObject({ correct: true, intervalDays: 1 });
    row = (await db().select().from(schema.questionReviews).where(orm.eq(schema.questionReviews.id, sched.id)))[0];
    expect(row.repetitions).toBe(1);
    const act = await db().select().from(schema.userActivity).where(orm.eq(schema.userActivity.userId, users.u1));
    expect(act[0].questions).toBeGreaterThanOrEqual(2); // reviews count as learning activity
    expect((await db().select().from(schema.userStats).where(orm.eq(schema.userStats.userId, users.u1)))[0].currentStreak).toBe(1);
  });

  it("computes mastery and recommendations from real results", async () => {
    await P.submit(users.solo, "t-solo", ADD, "cpp17");
    await P.submit(users.solo, "t-add", WRONG, "cpp17"); // an attempt that fails
    const ins = await A.getInsights(users.solo, 5);
    const arrays = ins.topics.find((t: any) => t.topic === "arrays");
    expect(arrays).toMatchObject({ solved: 1, attempted: 1 });
    const math = ins.topics.find((t: any) => t.topic === "math");
    expect(math.mastery).toBe(0);
    expect(ins.recommendations.map((r: any) => r.slug)).not.toContain("t-solo");
    expect(ins.recommendations.length).toBeGreaterThan(0);
    const stats = await A.getStats((await db().select().from(schema.users).where(orm.eq(schema.users.id, users.solo)))[0]);
    expect(stats.totals.problemsSolved).toBe(1);
    expect(stats.totals.acceptanceRate).toBe(0.5);
    expect(stats.topicDistribution).toEqual([{ label: "arrays", value: 1 }]);
    // regression: zone names PostgreSQL does not know must not break the real counters either
    const E = await import("@/server/services/engagement");
    const counters = await db().transaction((tx: any) => E.achievementCounters(tx, users.solo as string, "Asia/Saigon"));
    expect(counters).toMatchObject({ problems_solved: 1, solved_in_day: 1 });
    expect(stats.xpSeries).toHaveLength(30);
    expect(stats.xpSeries.reduce((s: number, x: any) => s + x.value, 0)).toBeGreaterThan(0);
  });
});
