/** Hearts, daily quests, achievements, notifications and leaderboards against a REAL database. Requires TEST_DATABASE_URL. */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.TEST_DATABASE_URL;
const d = url ? describe : describe.skip;

d("gamification (real database)", () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let run: any, hearts: any, notif: any, board: any, views: any, db: any, schema: any, orm: any;
  let userId: string;
  let rivalId: string;
  let lessonIds: string[];
  const today = new Date().toISOString().slice(0, 10);

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    const { execFileSync } = await import("node:child_process");
    const env = { ...process.env, DATABASE_URL: url };
    execFileSync("npx", ["tsx", "scripts/migrate.ts"], { env, stdio: "pipe" });
    execFileSync("npx", ["tsx", "scripts/seed.ts"], { env, stdio: "pipe" });
    orm = await import("drizzle-orm");
    ({ getDb: db, schema } = await import("@/server/db/client"));
    run = await import("@/server/services/lesson-run");
    hearts = await import("@/server/services/hearts");
    notif = await import("@/server/services/notifications");
    board = await import("@/server/services/leaderboard");
    views = await import("@/server/services/gamification-views");
    const path = await import("@/server/services/path");
    const h = db();
    await h.execute(orm.sql`TRUNCATE users CASCADE`);
    await h.execute(orm.sql`update daily_quests set active = true`);
    await h.execute(orm.sql`update achievements set active = true`);
    const mk = async (name: string) => {
      const [u] = await h.insert(schema.users).values({ email: `${name}@example.com`, username: name, passwordHash: "x", displayName: name, timezone: "UTC" }).returning();
      await h.insert(schema.userStats).values({ userId: u.id });
      return u.id as string;
    };
    userId = await mk("gamer");
    rivalId = await mk("rival");
    lessonIds = path.lessonSequence(await path.loadCurriculum());
    // Pin today's quests so the assertions are deterministic.
    const quests = await h.select().from(schema.dailyQuests);
    for (const slug of ["warm-up", "flawless", "xp-sprinter"]) {
      await h.insert(schema.userQuests).values({ userId, questId: quests.find((q: any) => q.slug === slug).id, day: today });
    }
  });
  afterAll(async () => {
    const { getPool } = await import("@/server/db/client");
    await getPool().end();
  });

  async function respond(questionId: string, correct: boolean) {
    const [q] = await db().select().from(schema.lessonQuestions).where(orm.eq(schema.lessonQuestions.id, questionId));
    const a = q.answer as Record<string, any>;
    const n = ((q.data as any).options?.length as number) || 2;
    if ("index" in a) return { index: correct ? a.index : (a.index + 1) % n };
    if ("accepted" in a) return { text: correct ? a.accepted[0] : "definitely wrong zzz" };
    if ("order" in a) return { order: correct ? a.order : [...a.order].reverse() };
    return { pairs: correct ? a.pairs : [...a.pairs].reverse() };
  }
  async function play(lessonId: string) {
    const r = await run.startOrResumeRun(userId, lessonId);
    for (const q of r.remaining) await run.answerQuestion(userId, r.runId, q.id, await respond(q.id, true));
    return run.completeRun(userId, r.runId);
  }
  const stats = async () => (await db().select().from(schema.userStats).where(orm.eq(schema.userStats.userId, userId)))[0];
  const ledger = async (id = userId) => (await db().execute(orm.sql`select coalesce(sum(amount),0)::int as s from xp_transactions where user_id = ${id}`)).rows[0].s;

  it("completes quests and unlocks achievements on a perfect first lesson, with rewards in the ledger", async () => {
    const r = await play(lessonIds[0]!);
    const titles = r.rewards.map((x: any) => x.title).sort();
    expect(titles).toEqual(["First Steps", "Flawless", "Warm-up"]);
    // 20 lesson + 10 perfect + 25 + 25 quests + 10 achievement
    expect(r.xpGained).toBe(90);
    expect(r.breakdown.map((b: any) => b.label)).toContain("Quest: Warm-up");
    expect((await stats()).totalXp).toBe(90);
    expect(await ledger()).toBe(90);
  });

  it("does not pay the same quest or achievement twice when the lesson is replayed", async () => {
    const r = await play(lessonIds[0]!);
    expect(r.rewards).toEqual([]);
    expect(r.xpGained).toBe(0);
    expect(await ledger()).toBe(90);
  });

  it("shows today's quests with real progress and the daily xp quest still counting", async () => {
    const q = await views.getQuestsView(userId, today);
    expect(q).toHaveLength(3);
    const warm = q.find((x: any) => x.slug === "warm-up");
    expect(warm.completedAt).not.toBeNull();
    const sprint = q.find((x: any) => x.slug === "xp-sprinter");
    // 30 learning XP on the first lesson. Quest/achievement rewards do not count toward the XP quest.
    expect(sprint.progress).toBe(30);
    expect(sprint.completedAt).toBeNull();
  });

  it("gives at least 10 quest and 15 achievement definitions in the database and shows honest progress", async () => {
    const defs = await db().select().from(schema.dailyQuests);
    expect(defs.length).toBeGreaterThanOrEqual(10);
    const a = await views.getAchievementsView(userId, "UTC");
    expect(a.length).toBeGreaterThanOrEqual(15);
    expect(a.find((x: any) => x.slug === "first-steps").unlockedAt).not.toBeNull();
    const ten = a.find((x: any) => x.slug === "ten-lessons");
    expect(ten.unlockedAt).toBeNull();
    expect(ten.current).toBe(1);
  });

  it("writes notifications for quests and achievements, and marks them read", async () => {
    expect(await notif.unreadCount(userId)).toBe(3);
    const list = await notif.listNotifications(userId);
    expect(list.map((n: any) => n.type).sort()).toEqual(["achievement", "quest", "quest"]);
    await notif.markAllRead(userId);
    expect(await notif.unreadCount(userId)).toBe(0);
  });

  it("costs a heart per wrong answer in a NEW lesson, blocks at zero without losing progress, and regenerates", async () => {
    const r = await run.startOrResumeRun(userId, lessonIds[1]!);
    expect(r.hearts.hearts).toBe(5);
    const first = r.remaining[0]!;
    // one correct answer to prove progress is kept
    await run.answerQuestion(userId, r.runId, first.id, await respond(first.id, true));
    const second = r.remaining[1]!;
    for (let i = 4; i >= 0; i--) {
      const a = await run.answerQuestion(userId, r.runId, second.id, await respond(second.id, false));
      expect(a.correct).toBe(false);
      expect(a.hearts.hearts).toBe(i);
    }
    await expect(run.answerQuestion(userId, r.runId, second.id, await respond(second.id, true))).rejects.toMatchObject({ status: 409, code: "out_of_hearts" });
    const resumed = await run.startOrResumeRun(userId, lessonIds[1]!);
    expect(resumed.remaining.length).toBe(r.remaining.length - 1); // the correct answer was not lost
    expect(resumed.hearts.hearts).toBe(0);
    // 65 minutes later two hearts are back
    await db().update(schema.userStats).set({ heartsUpdatedAt: new Date(Date.now() - 65 * 60_000) }).where(orm.eq(schema.userStats.userId, userId));
    expect((await hearts.getHearts(userId)).hearts).toBe(2);
    const ok = await run.answerQuestion(userId, r.runId, second.id, await respond(second.id, true));
    expect(ok.correct).toBe(true);
  });

  it("lets a learner earn a heart back by replaying a finished lesson, and replays never cost hearts", async () => {
    const before = (await hearts.getHearts(userId)).hearts;
    expect(before).toBeLessThan(5);
    const r = await run.startOrResumeRun(userId, lessonIds[0]!);
    expect(r.alreadyCompleted).toBe(true);
    const q = r.remaining[0]!;
    const wrong = await run.answerQuestion(userId, r.runId, q.id, await respond(q.id, false));
    expect(wrong.hearts.hearts).toBe(before); // practice is free
    for (const x of r.remaining) await run.answerQuestion(userId, r.runId, x.id, await respond(x.id, true));
    const done = await run.completeRun(userId, r.runId);
    expect(done.heartsEarned).toBe(1);
    expect((await hearts.getHearts(userId)).hearts).toBe(before + 1);
  });

  it("keeps the cached XP equal to the ledger", async () => {
    expect((await stats()).totalXp).toBe(await ledger());
  });

  it("ranks by XP earned in the period, shows my rank, and ignores users with no XP", async () => {
    await db().insert(schema.xpTransactions).values({ userId: rivalId, amount: 500, reason: "test", idempotencyKey: "t:1" });
    await db().update(schema.userStats).set({ totalXp: 500 }).where(orm.eq(schema.userStats.userId, rivalId));
    const all = await board.getLeaderboard(userId, "all");
    expect(all.rows[0]).toMatchObject({ username: "rival", rank: 1, xp: 500 });
    expect(all.me.rank).toBe(2);
    expect(all.me.xp).toBe(await ledger());
    const daily = await board.getLeaderboard(userId, "daily");
    expect(daily.rows.map((r: any) => r.username)).toContain("gamer");
    // an old transaction counts for all-time but not for today
    await db().update(schema.xpTransactions).set({ createdAt: new Date(Date.now() - 3 * 86_400_000) }).where(orm.eq(schema.xpTransactions.idempotencyKey, "t:1"));
    const daily2 = await board.getLeaderboard(userId, "daily");
    expect(daily2.rows.map((r: any) => r.username)).not.toContain("rival");
    expect(daily2.me.rank).toBe(1);
  });
});
