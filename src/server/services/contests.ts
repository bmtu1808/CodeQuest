import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb, schema } from "@/server/db/client";
import { computeRatingChanges, START_RATING } from "@/features/contest/rating";
import { computeScoreboard, contestPhase, virtualRank, type ContestPhase, type ProblemCell, type ScoreRow } from "@/features/contest/scoring";
import { ServiceError } from "./lesson-run";
import { notify } from "./notifications";
import { getProblem, runSamples, submit, type ProblemDetail, type RunResult, type SubmitResult } from "./problems";

type ContestRow = typeof schema.contests.$inferSelect;
type Participant = typeof schema.contestParticipants.$inferSelect;
type Mode = "live" | "virtual" | "practice";

const endOf = (c: Pick<ContestRow, "startsAt" | "durationMin">) => new Date(c.startsAt.getTime() + c.durationMin * 60_000);

async function findContest(slug: string): Promise<ContestRow> {
  const [c] = await getDb().select().from(schema.contests).where(and(eq(schema.contests.slug, slug), eq(schema.contests.published, true))).limit(1);
  if (!c) throw new ServiceError("Contest not found", 404);
  return c;
}

// ───────────────────────── list ─────────────────────────

export type ContestListItem = { slug: string; title: string; startsAt: Date; endsAt: Date; durationMin: number; phase: ContestPhase; problemCount: number; participants: number; joined: boolean };

export async function listContests(userId: string, now = new Date()): Promise<ContestListItem[]> {
  const db = getDb();
  const rows = await db.select().from(schema.contests).where(eq(schema.contests.published, true)).orderBy(desc(schema.contests.startsAt));
  if (!rows.length) return [];
  const ids = rows.map((c) => c.id);
  const counts = await db.execute(sql`select contest_id, count(*)::int n from contest_problems where contest_id in ${ids} group by contest_id`);
  const parts = await db.execute(sql`select contest_id, count(*) filter (where mode = 'live')::int n, bool_or(user_id = ${userId}) joined from contest_participants where contest_id in ${ids} group by contest_id`);
  const pc = new Map((counts.rows as Array<{ contest_id: string; n: number }>).map((r) => [r.contest_id, r.n]));
  const pp = new Map((parts.rows as Array<{ contest_id: string; n: number; joined: boolean }>).map((r) => [r.contest_id, r]));
  return rows.map((c) => ({
    slug: c.slug,
    title: c.title,
    startsAt: c.startsAt,
    endsAt: endOf(c),
    durationMin: c.durationMin,
    phase: contestPhase(now, c),
    problemCount: pc.get(c.id) ?? 0,
    participants: pp.get(c.id)?.n ?? 0,
    joined: pp.get(c.id)?.joined ?? false,
  }));
}

// ───────────────────────── participation ─────────────────────────

async function myParticipants(userId: string, contestId: string): Promise<Participant[]> {
  return getDb().select().from(schema.contestParticipants).where(and(eq(schema.contestParticipants.userId, userId), eq(schema.contestParticipants.contestId, contestId)));
}

/** Join the official contest. Allowed until it ends (late joiners keep the original clock). */
export async function register(userId: string, slug: string, now = new Date()): Promise<void> {
  const c = await findContest(slug);
  if (contestPhase(now, c) === "past") throw new ServiceError("This contest has ended. Try a virtual or practice run instead.", 409);
  await getDb().insert(schema.contestParticipants).values({ contestId: c.id, userId, mode: "live" }).onConflictDoNothing();
}

/** Replay a finished contest in a personal window of the same length. One virtual run per contest. */
export async function startVirtual(userId: string, slug: string, now = new Date()): Promise<void> {
  const c = await findContest(slug);
  if (contestPhase(now, c) !== "past") throw new ServiceError("Virtual contests are only available after the contest has ended.", 409);
  const ins = await getDb().insert(schema.contestParticipants).values({ contestId: c.id, userId, mode: "virtual", startedAt: now }).onConflictDoNothing().returning({ id: schema.contestParticipants.id });
  if (!ins.length) throw new ServiceError("You have already used your virtual run for this contest.", 409);
}

/** Untimed practice on a finished contest: not rated and not shown on any scoreboard. */
export async function startPractice(userId: string, slug: string, now = new Date()): Promise<void> {
  const c = await findContest(slug);
  if (contestPhase(now, c) !== "past") throw new ServiceError("Practice mode opens after the contest has ended.", 409);
  await getDb().insert(schema.contestParticipants).values({ contestId: c.id, userId, mode: "practice", startedAt: now }).onConflictDoNothing();
}

export type Window = { mode: Mode; participant: Participant; startsAt: Date; endsAt: Date | null };

/** Which of the user's participations may act right now, if any. */
export function activeWindow(c: ContestRow, parts: Participant[], now: Date): Window | null {
  const phase = contestPhase(now, c);
  const live = parts.find((p) => p.mode === "live");
  if (phase === "live" && live) return { mode: "live", participant: live, startsAt: c.startsAt, endsAt: endOf(c) };
  const virtual = parts.find((p) => p.mode === "virtual");
  if (virtual) {
    const vEnd = new Date(virtual.startedAt.getTime() + c.durationMin * 60_000);
    if (now < vEnd) return { mode: "virtual", participant: virtual, startsAt: virtual.startedAt, endsAt: vEnd };
  }
  const practice = parts.find((p) => p.mode === "practice");
  if (phase === "past" && practice) return { mode: "practice", participant: practice, startsAt: practice.startedAt, endsAt: null };
  return null;
}

// ───────────────────────── details ─────────────────────────

export type ContestProblemView = { label: string; slug: string; title: string; difficulty: string; cell: ProblemCell | null };
export type ContestView = {
  slug: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  durationMin: number;
  phase: ContestPhase;
  problemCount: number;
  /** Hidden until the contest starts. */
  problems: ContestProblemView[] | null;
  joined: boolean;
  virtualUsed: boolean;
  window: { mode: Mode; endsAt: Date | null } | null;
  /** The viewer's own cells in the mode they are currently playing (or last played). */
  myCells: Record<string, ProblemCell> | null;
};

export async function getContest(userId: string, slug: string, now = new Date()): Promise<ContestView> {
  const c = await findContest(slug);
  await rateContestIfDue(c.id, now);
  const db = getDb();
  const probs = await db
    .select({ label: schema.contestProblems.label, slug: schema.problems.slug, title: schema.problems.title, difficulty: schema.problems.difficulty })
    .from(schema.contestProblems)
    .innerJoin(schema.problems, eq(schema.problems.id, schema.contestProblems.problemId))
    .where(eq(schema.contestProblems.contestId, c.id))
    .orderBy(asc(schema.contestProblems.position));
  const phase = contestPhase(now, c);
  const parts = await myParticipants(userId, c.id);
  const win = activeWindow(c, parts, now);
  const board = phase !== "upcoming" ? await buildScoreboard(c, userId, now) : null;
  const shown = phase === "upcoming" && !win ? null : probs;
  const myCells = board ? (win?.mode === "virtual" || (!win && board.virtual) ? board.virtual?.cells : board.rows.find((r) => r.userId === userId)?.cells) ?? null : null;
  return {
    slug: c.slug,
    title: c.title,
    description: c.description,
    startsAt: c.startsAt,
    endsAt: endOf(c),
    durationMin: c.durationMin,
    phase,
    problemCount: probs.length,
    problems: shown ? shown.map((p) => ({ ...p, cell: myCells?.[p.label] ?? null })) : null,
    joined: parts.some((p) => p.mode === "live"),
    virtualUsed: parts.some((p) => p.mode === "virtual"),
    window: win ? { mode: win.mode, endsAt: win.endsAt } : null,
    myCells,
  };
}

// ───────────────────────── problems, run, submit ─────────────────────────

async function resolveForProblem(userId: string, slug: string, label: string, now: Date) {
  const c = await findContest(slug);
  const [cp] = await getDb()
    .select({ slug: schema.problems.slug })
    .from(schema.contestProblems)
    .innerJoin(schema.problems, eq(schema.problems.id, schema.contestProblems.problemId))
    .where(and(eq(schema.contestProblems.contestId, c.id), eq(schema.contestProblems.label, label)));
  if (!cp) throw new ServiceError("Problem not found in this contest", 404);
  const win = activeWindow(c, await myParticipants(userId, c.id), now);
  if (!win) throw new ServiceError(contestPhase(now, c) === "upcoming" ? "The contest has not started yet." : "You are not taking part in this contest right now.", 403);
  return { c, problemSlug: cp.slug, win };
}

export type ContestProblemDetail = ProblemDetail & { contest: { slug: string; title: string; label: string; mode: Mode; endsAt: Date | null } };

/** The problem page inside a contest: no hints, no editorial, and a deadline. */
export async function getContestProblem(userId: string, slug: string, label: string, now = new Date()): Promise<ContestProblemDetail> {
  const { c, problemSlug, win } = await resolveForProblem(userId, slug, label, now);
  const p = await getProblem(userId, problemSlug, { forContest: true });
  return { ...p, hintsTotal: 0, hintsRevealed: [], solved: false, editorial: null, referenceSolution: null, xpReward: 0, contest: { slug: c.slug, title: c.title, label, mode: win.mode, endsAt: win.endsAt } };
}

export async function contestRun(userId: string, slug: string, label: string, source: unknown, language: unknown, customInput: unknown, now = new Date()): Promise<RunResult> {
  const { problemSlug, win } = await resolveForProblem(userId, slug, label, now);
  return runSamples(userId, problemSlug, source, language, customInput, { participantId: win.participant.id });
}

export async function contestSubmit(userId: string, slug: string, label: string, source: unknown, language: unknown, now = new Date()): Promise<SubmitResult> {
  const { problemSlug, win } = await resolveForProblem(userId, slug, label, now);
  return submit(userId, problemSlug, source, language, { participantId: win.participant.id });
}

// ───────────────────────── scoreboard ─────────────────────────

export type BoardRow = ScoreRow & { displayName: string; username: string; isMe: boolean };
export type Scoreboard = {
  labels: string[];
  rows: BoardRow[];
  virtual: { solved: number; penalty: number; rank: number; cells: Record<string, ProblemCell>; endsAt: Date } | null;
  ratingChanges: Array<{ userId: string; displayName: string; rank: number; oldRating: number; newRating: number }> | null;
};

async function buildScoreboard(c: ContestRow, viewerId: string, now: Date): Promise<Scoreboard> {
  const db = getDb();
  const cps = await db.select({ id: schema.contestProblems.problemId, label: schema.contestProblems.label }).from(schema.contestProblems).where(eq(schema.contestProblems.contestId, c.id)).orderBy(asc(schema.contestProblems.position));
  const labels = cps.map((x) => x.label);
  const labelOf = new Map(cps.map((x) => [x.id, x.label]));
  const parts = await db.select().from(schema.contestParticipants).where(eq(schema.contestParticipants.contestId, c.id));
  const subsRaw = parts.length
    ? await db
        .select({ pid: schema.submissions.contestParticipantId, problemId: schema.submissions.problemId, verdict: schema.submissions.verdict, createdAt: schema.submissions.createdAt })
        .from(schema.submissions)
        .where(inArray(schema.submissions.contestParticipantId, parts.map((p) => p.id)))
    : [];
  const partById = new Map(parts.map((p) => [p.id, p]));
  const toSubs = (mode: Mode) =>
    subsRaw.flatMap((s) => {
      const p = s.pid ? partById.get(s.pid) : undefined;
      const label = labelOf.get(s.problemId);
      return p && p.mode === mode && label ? [{ userId: p.userId, problemLabel: label, verdict: s.verdict, createdAt: s.createdAt }] : [];
    });

  const live = parts.filter((p) => p.mode === "live");
  const officialStart = new Map(live.map((p) => [p.userId, c.startsAt]));
  const all = computeScoreboard(toSubs("live"), labels, officialStart, c.durationMin);
  // Registered people who never submitted anything are not shown.
  const withActivity = new Set(toSubs("live").map((s) => s.userId));
  const active = all.filter((r) => withActivity.has(r.userId)).map((r, i, arr) => ({ ...r, rank: arr.findIndex((x) => x.solved === r.solved && x.penalty === r.penalty) + 1 }));
  const users = active.length ? await db.select({ id: schema.users.id, displayName: schema.users.displayName, username: schema.users.username }).from(schema.users).where(inArray(schema.users.id, active.map((r) => r.userId))) : [];
  const u = new Map(users.map((x) => [x.id, x]));
  const rows: BoardRow[] = active.map((r) => ({ ...r, displayName: u.get(r.userId)?.displayName ?? "?", username: u.get(r.userId)?.username ?? "?", isMe: r.userId === viewerId }));

  let virtual: Scoreboard["virtual"] = null;
  const myV = parts.find((p) => p.mode === "virtual" && p.userId === viewerId);
  if (myV) {
    const vr = computeScoreboard(toSubs("virtual"), labels, new Map([[viewerId, myV.startedAt]]), c.durationMin)[0]!;
    virtual = { solved: vr.solved, penalty: vr.penalty, cells: vr.cells, rank: virtualRank(rows, vr), endsAt: new Date(myV.startedAt.getTime() + c.durationMin * 60_000) };
  }

  let ratingChanges: Scoreboard["ratingChanges"] = null;
  if (c.ratedAt) {
    const rc = await db
      .select({ userId: schema.ratingChanges.userId, rank: schema.ratingChanges.rank, oldRating: schema.ratingChanges.oldRating, newRating: schema.ratingChanges.newRating, displayName: schema.users.displayName })
      .from(schema.ratingChanges)
      .innerJoin(schema.users, eq(schema.users.id, schema.ratingChanges.userId))
      .where(eq(schema.ratingChanges.contestId, c.id))
      .orderBy(asc(schema.ratingChanges.rank));
    ratingChanges = rc;
  }
  void now;
  return { labels, rows, virtual, ratingChanges };
}

export async function getScoreboard(userId: string, slug: string, now = new Date()): Promise<Scoreboard> {
  const c = await findContest(slug);
  if (contestPhase(now, c) === "upcoming") return { labels: [], rows: [], virtual: null, ratingChanges: null };
  await rateContestIfDue(c.id, now);
  return buildScoreboard((await findContest(slug)), userId, now);
}

/** The viewer's own submissions in this contest (all modes). */
export async function mySubmissions(userId: string, slug: string, limit = 30) {
  const c = await findContest(slug);
  const parts = await myParticipants(userId, c.id);
  if (!parts.length) return [];
  return getDb()
    .select({ id: schema.submissions.id, label: schema.contestProblems.label, verdict: schema.submissions.verdict, testsPassed: schema.submissions.testsPassed, testsTotal: schema.submissions.testsTotal, createdAt: schema.submissions.createdAt, participantId: schema.submissions.contestParticipantId })
    .from(schema.submissions)
    .innerJoin(schema.contestProblems, and(eq(schema.contestProblems.problemId, schema.submissions.problemId), eq(schema.contestProblems.contestId, c.id)))
    .where(inArray(schema.submissions.contestParticipantId, parts.map((p) => p.id)))
    .orderBy(desc(schema.submissions.createdAt))
    .limit(limit);
}

// ───────────────────────── rating ─────────────────────────

/**
 * Once a contest has ended, compute rating changes for the people who took part live. Exactly once:
 * the contest row is locked and `rated_at` is checked inside the transaction.
 */
export async function rateContestIfDue(contestId: string, now = new Date()): Promise<boolean> {
  const db = getDb();
  const [peek] = await db.select().from(schema.contests).where(eq(schema.contests.id, contestId));
  if (!peek || peek.ratedAt || contestPhase(now, peek) !== "past") return false;
  return db.transaction(async (tx) => {
    const [c] = await tx.select().from(schema.contests).where(eq(schema.contests.id, contestId)).for("update");
    if (!c || c.ratedAt) return false;
    const board = await buildScoreboard(c, "", now);
    const ranked = board.rows;
    if (ranked.length >= 2) {
      const ids = ranked.map((r) => r.userId);
      await tx.insert(schema.userRatings).values(ids.map((userId) => ({ userId }))).onConflictDoNothing();
      const cur = await tx.select().from(schema.userRatings).where(inArray(schema.userRatings.userId, ids)).for("update");
      const rating = new Map(cur.map((r) => [r.userId, r]));
      const out = computeRatingChanges(ranked.map((r) => ({ userId: r.userId, rating: rating.get(r.userId)?.rating ?? START_RATING, rank: r.rank })));
      for (const o of out) {
        const prev = rating.get(o.userId);
        await tx.insert(schema.ratingChanges).values({ contestId, userId: o.userId, rank: o.rank, oldRating: o.oldRating, newRating: o.newRating });
        await tx
          .update(schema.userRatings)
          .set({ rating: o.newRating, peak: Math.max(prev?.peak ?? START_RATING, o.newRating), contestsRated: (prev?.contestsRated ?? 0) + 1 })
          .where(eq(schema.userRatings.userId, o.userId));
        const d = o.newRating - o.oldRating;
        await notify(tx, { userId: o.userId, type: "system", title: `${c.title} is rated`, body: `Rank #${o.rank}. Rating ${o.oldRating} to ${o.newRating} (${d >= 0 ? "+" : ""}${d}).`, href: `/contests/${c.slug}` });
      }
    }
    await tx.update(schema.contests).set({ ratedAt: now }).where(eq(schema.contests.id, contestId));
    return true;
  });
}

export async function getRatingBoard(limit = 10) {
  return getDb()
    .select({ userId: schema.userRatings.userId, rating: schema.userRatings.rating, peak: schema.userRatings.peak, contests: schema.userRatings.contestsRated, displayName: schema.users.displayName, username: schema.users.username })
    .from(schema.userRatings)
    .innerJoin(schema.users, eq(schema.users.id, schema.userRatings.userId))
    .where(sql`${schema.userRatings.contestsRated} > 0 and ${schema.users.deletedAt} is null`)
    .orderBy(desc(schema.userRatings.rating), asc(schema.users.username))
    .limit(limit);
}

export async function getMyRating(userId: string) {
  const [r] = await getDb().select().from(schema.userRatings).where(eq(schema.userRatings.userId, userId));
  return r && r.contestsRated > 0 ? r : null;
}
