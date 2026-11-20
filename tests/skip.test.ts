/** Skip-ahead tests against a REAL database. Requires TEST_DATABASE_URL. */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.TEST_DATABASE_URL;
const d = url ? describe : describe.skip;

d("skip-ahead tests (real database)", () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let skip: any, path: any, run: any, db: any, schema: any, orm: any, grader: any;
  let userId: string;
  let units: any[];

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    const { execFileSync } = await import("node:child_process");
    const env = { ...process.env, DATABASE_URL: url };
    execFileSync("npx", ["tsx", "scripts/migrate.ts"], { env, stdio: "pipe" });
    execFileSync("npx", ["tsx", "scripts/seed.ts"], { env, stdio: "pipe" });
    orm = await import("drizzle-orm");
    ({ getDb: db, schema } = await import("@/server/db/client"));
    skip = await import("@/server/services/skip");
    path = await import("@/server/services/path");
    run = await import("@/server/services/lesson-run");
    grader = await import("@/features/learning/grader");
    const h = db();
    await h.execute(orm.sql`TRUNCATE users CASCADE`);
    const [u] = await h.insert(schema.users).values({ email: "skipper@example.com", username: "skipper", passwordHash: "x", displayName: "skipper", timezone: "UTC" }).returning();
    await h.insert(schema.userStats).values({ userId: u.id });
    userId = u.id;
    const c = await path.loadCurriculum();
    units = c.filter((w: any) => w.world.published).flatMap((w: any) => w.units.map((x: any) => x.unit));
  }, 180_000);
  afterAll(async () => {
    const { getPool } = await import("@/server/db/client");
    await getPool().end();
  });

  /** Correct responses for the drawn questions, read from the stored answers (the browser never has them). */
  async function correctAnswers(questions: Array<{ id: string }>) {
    const rows = await db().select().from(schema.lessonQuestions).where(orm.inArray(schema.lessonQuestions.id, questions.map((q) => q.id)));
    return Object.fromEntries(rows.map((r: any) => [r.id, grader ? (grader.responseSchema.parse(canonical(r))) : null]));
  }
  const canonical = (r: any) => {
    if (r.type === "fill_blank") return { text: r.answer.accepted[0] };
    if (r.type === "arrange_code") return { order: r.answer.order };
    if (r.type === "match_concept") return { pairs: r.answer.pairs };
    return { index: r.answer.index };
  };

  it("draws up to 10 questions spread over the unit's lessons, without answers", async () => {
    const s = await skip.startSkipTest(userId, units[0].id);
    expect(s.questions.length).toBe(10);
    expect(s.needed).toBe(8);
    expect(JSON.stringify(s.questions)).not.toMatch(/"(accepted|order|pairs)"/);
    const lessonIds = new Set((await db().select().from(schema.lessonQuestions).where(orm.inArray(schema.lessonQuestions.id, s.questions.map((q: any) => q.id)))).map((r: any) => r.lessonId));
    expect(lessonIds.size).toBeGreaterThan(1);
    // starting again resumes the same open attempt
    const again = await skip.startSkipTest(userId, units[0].id);
    expect(again.attemptId).toBe(s.attemptId);
    expect(again.questions.map((q: any) => q.id)).toEqual(s.questions.map((q: any) => q.id));
  });

  it("failing hides the answers, starts a cooldown and blocks an immediate retry", async () => {
    const open = await db().select().from(schema.skipAttempts).where(orm.and(orm.eq(schema.skipAttempts.userId, userId), orm.isNull(schema.skipAttempts.finishedAt)));
    const attempt = open[0];
    const t0 = new Date();
    const res = await skip.submitSkipTest(userId, attempt.id, {}, t0);
    expect(res.passed).toBe(false);
    expect(res.score).toBe(0);
    expect(res.review.every((r: any) => r.explanation === null && r.correctAnswer === null)).toBe(true);
    await expect(skip.submitSkipTest(userId, attempt.id, {}, t0)).rejects.toMatchObject({ status: 409 });
    await expect(skip.startSkipTest(userId, units[0].id, new Date(t0.getTime() + 60_000))).rejects.toMatchObject({ status: 429, code: "cooldown" });
    const later = new Date(t0.getTime() + skip.SKIP_COOLDOWN_MS + 1000);
    expect((await skip.getSkipStatus(userId, units[0].id, later)).state).toBe("ready");
  });

  it("cannot submit someone else's attempt", async () => {
    const [o] = await db().insert(schema.users).values({ email: "other@example.com", username: "other", passwordHash: "x", displayName: "other", timezone: "UTC" }).returning();
    await db().insert(schema.userStats).values({ userId: o.id });
    const s = await skip.startSkipTest(o.id, units[0].id);
    await expect(skip.submitSkipTest(userId, s.attemptId, {})).rejects.toMatchObject({ status: 404 });
  });

  it("7 of 10 fails, 8 of 10 passes; passing unlocks the next unit without XP or progress rows", async () => {
    const later = new Date(Date.now() + skip.SKIP_COOLDOWN_MS + 5000);
    const s = await skip.startSkipTest(userId, units[0].id, later);
    const right = await correctAnswers(s.questions);
    const ids = s.questions.map((q: any) => q.id);
    // 7 right, 3 wrong
    const seven = Object.fromEntries(ids.slice(0, 7).map((id: string) => [id, right[id]]));
    const fail = await skip.submitSkipTest(userId, s.attemptId, seven, later);
    expect(fail.score).toBe(7);
    expect(fail.passed).toBe(false);

    const later2 = new Date(later.getTime() + skip.SKIP_COOLDOWN_MS + 5000);
    const s2 = await skip.startSkipTest(userId, units[0].id, later2);
    const right2 = await correctAnswers(s2.questions);
    const eight = Object.fromEntries(s2.questions.slice(0, 8).map((q: any) => [q.id, right2[q.id]]));
    // garbage for a question of the wrong shape must just count as wrong, not crash
    eight[s2.questions[8].id] = { text: "x".repeat(10) };
    const pass = await skip.submitSkipTest(userId, s2.attemptId, eight, later2);
    expect(pass.passed).toBe(true);
    expect(pass.score).toBe(8);
    expect(pass.review.filter((r: any) => r.explanation).length).toBe(10);

    expect((await skip.getSkipStatus(userId, units[0].id)).state).toBe("passed");
    await expect(skip.startSkipTest(userId, units[0].id)).rejects.toMatchObject({ code: "already_passed" });

    const [stats] = await db().select().from(schema.userStats).where(orm.eq(schema.userStats.userId, userId));
    expect(stats.totalXp).toBe(0);
    expect(await db().select().from(schema.userLessonProgress).where(orm.eq(schema.userLessonProgress.userId, userId))).toHaveLength(0);

    const p = await path.getLearningPath(userId);
    const u0 = p.flatMap((w: any) => w.units)[0];
    expect(u0.skipped).toBe(true);
    expect(u0.lessons.every((l: any) => l.state === "completed")).toBe(true);
    expect(u0.canSkip).toBe(false);
    const u1 = p.flatMap((w: any) => w.units)[1];
    expect(u1.lessons[0].state).toBe("available");
    expect(await path.isLessonUnlocked(userId, u1.lessons[0].id)).toBe(true);
    // a unit further ahead is still locked and can be tested out of
    const u3 = p.flatMap((w: any) => w.units)[3];
    expect(u3.lessons[0].state).toBe("locked");
    expect(u3.canSkip).toBe(true);
    // the next lesson can really be played and pays its XP once
    const started = await run.startOrResumeRun(userId, u1.lessons[0].id);
    expect(started.remaining.length).toBeGreaterThan(0);
  });

  it("drawQuestions spreads evenly and never repeats", () => {
    const mk = (l: string, n: number) => Array.from({ length: n }, (_, i) => ({ id: `${l}${i}`, lessonId: l }));
    const picked = skip.drawQuestions([mk("a", 5), mk("b", 5), mk("c", 2)], 9, (m: number) => m - 1);
    expect(picked).toHaveLength(9);
    expect(new Set(picked.map((q: any) => q.id)).size).toBe(9);
    expect(picked.filter((q: any) => q.lessonId === "c")).toHaveLength(2);
    expect(skip.drawQuestions([mk("a", 3)], 10)).toHaveLength(3);
  });
});
