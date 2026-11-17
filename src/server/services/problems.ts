import { and, asc, count, eq, ilike, isNull, sql, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/server/db/client";
import { XP_RULES, levelFromXp } from "@/features/gamification/xp";
import { aggregate, judgeOne, type TestVerdict } from "@/server/judge/checker";
import { getJudge } from "@/server/judge";
import { JudgeUnavailableError, type Language } from "@/server/judge/types";
import { ServiceError } from "./lesson-run";
import { recordActivity } from "./activity";
import { awardXp } from "./xp";

const DIFFICULTIES = ["newbie", "easy", "medium", "hard", "expert"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const MAX_SOURCE_BYTES = 64 * 1024;
const MAX_CUSTOM_INPUT = 10 * 1024;
const MAX_SHOWN = 4000;
const clip = (s: string, n = MAX_SHOWN) => (s.length > n ? `${s.slice(0, n)}\n...[truncated]` : s);

// ───────────────────────── list ─────────────────────────

export type ProblemFilters = { difficulty?: string; tag?: string; status?: string; q?: string; page?: number };
export type ProblemRow = {
  slug: string;
  title: string;
  difficulty: Difficulty;
  rating: number;
  tags: string[];
  estimatedMinutes: number;
  status: "solved" | "attempted" | "unsolved";
  /** 0..1, only when at least 5 real submissions exist. */
  acceptance: number | null;
};
export const PAGE_SIZE = 15;

export async function listProblems(userId: string, f: ProblemFilters): Promise<{ items: ProblemRow[]; total: number; page: number; pages: number; tags: string[] }> {
  const db = getDb();
  const P = schema.problems;
  const U = schema.userProblemProgress;
  const where: SQL[] = [isNull(P.deletedAt), eq(P.published, true)];
  if (f.difficulty && (DIFFICULTIES as readonly string[]).includes(f.difficulty)) where.push(eq(P.difficulty, f.difficulty as Difficulty));
  if (f.tag) where.push(sql`${f.tag.slice(0, 40)} = ANY(${P.tags})`);
  if (f.q?.trim()) where.push(ilike(P.title, `%${f.q.trim().slice(0, 60).replace(/[%_\\]/g, "\\$&")}%`));
  if (f.status === "solved") where.push(sql`${U.solved} = true`);
  if (f.status === "unsolved") where.push(sql`(${U.id} IS NULL OR (${U.solved} = false AND ${U.attempts} = 0))`);
  if (f.status === "attempted") where.push(sql`(${U.solved} = false AND ${U.attempts} > 0)`);
  const cond = and(...where);

  const [countRow] = await db
    .select({ n: count() })
    .from(P)
    .leftJoin(U, and(eq(U.problemId, P.id), eq(U.userId, userId)))
    .where(cond);
  const n = countRow?.n ?? 0;
  const pages = Math.max(1, Math.ceil(n / PAGE_SIZE));
  const page = Math.min(Math.max(1, Math.floor(f.page ?? 1)), pages);
  const rows = await db
    .select({ p: P, solved: U.solved, attempts: U.attempts })
    .from(P)
    .leftJoin(U, and(eq(U.problemId, P.id), eq(U.userId, userId)))
    .where(cond)
    .orderBy(asc(P.rating), asc(P.title))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  const ids = rows.map((r) => r.p.id);
  const stats = ids.length
    ? await db
        .select({ id: schema.submissions.problemId, total: count(), ok: sql<number>`count(*) filter (where ${schema.submissions.verdict} = 'accepted')` })
        .from(schema.submissions)
        .where(sql`${schema.submissions.problemId} IN ${ids} AND ${schema.submissions.verdict} NOT IN ('pending','judging','internal_error')`)
        .groupBy(schema.submissions.problemId)
    : [];
  const byId = new Map(stats.map((s) => [s.id, s]));
  const tagRows = await db.execute<{ t: string }>(sql`select distinct unnest(tags) as t from problems where deleted_at is null and published = true order by t`);

  return {
    items: rows.map(({ p, solved, attempts }) => {
      const s = byId.get(p.id);
      return {
        slug: p.slug,
        title: p.title,
        difficulty: p.difficulty,
        rating: p.rating,
        tags: p.tags,
        estimatedMinutes: p.estimatedMinutes,
        status: solved ? "solved" : (attempts ?? 0) > 0 ? "attempted" : "unsolved",
        acceptance: s && Number(s.total) >= 5 ? Number(s.ok) / Number(s.total) : null,
      } satisfies ProblemRow;
    }),
    total: n,
    page,
    pages,
    tags: tagRows.rows.map((r) => r.t),
  };
}

// ───────────────────────── detail ─────────────────────────

export type ProblemDetail = {
  id: string;
  slug: string;
  title: string;
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  difficulty: Difficulty;
  rating: number;
  tags: string[];
  timeLimitMs: number;
  memoryLimitMb: number;
  samples: Array<{ input: string; output: string; explanation?: string }>;
  hintsTotal: number;
  /** Only the hints the learner has already asked for. */
  hintsRevealed: string[];
  solved: boolean;
  /** Present only after the learner has solved the problem. */
  editorial: string | null;
  referenceSolution: string | null;
  xpReward: number;
  judgeAvailable: boolean;
};

async function findProblem(slug: string) {
  const [p] = await getDb()
    .select()
    .from(schema.problems)
    .where(and(eq(schema.problems.slug, slug), eq(schema.problems.published, true), isNull(schema.problems.deletedAt)))
    .limit(1);
  if (!p) throw new ServiceError("Problem not found", 404);
  return p;
}

export async function getProblem(userId: string, slug: string): Promise<ProblemDetail> {
  const p = await findProblem(slug);
  const [prog] = await getDb()
    .select()
    .from(schema.userProblemProgress)
    .where(and(eq(schema.userProblemProgress.userId, userId), eq(schema.userProblemProgress.problemId, p.id)));
  const solved = prog?.solved ?? false;
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    statement: p.statement,
    inputFormat: p.inputFormat,
    outputFormat: p.outputFormat,
    constraints: p.constraints,
    difficulty: p.difficulty,
    rating: p.rating,
    tags: p.tags,
    timeLimitMs: p.timeLimitMs,
    memoryLimitMb: p.memoryLimitMb,
    samples: p.samples,
    hintsTotal: p.hints.length,
    hintsRevealed: p.hints.slice(0, prog?.hintsUsed ?? 0),
    solved,
    editorial: solved ? p.editorial : null,
    referenceSolution: solved ? p.referenceSolution : null,
    xpReward: XP_RULES.problem[p.difficulty] ?? 0,
    judgeAvailable: getJudge() !== null,
  };
}

export type SubmissionRow = {
  id: string;
  verdict: string;
  language: string;
  timeMs: number | null;
  memoryKb: number | null;
  testsPassed: number;
  testsTotal: number;
  createdAt: Date;
};

export async function listSubmissions(userId: string, slug: string, limit = 10): Promise<SubmissionRow[]> {
  const p = await findProblem(slug);
  return getDb()
    .select({
      id: schema.submissions.id,
      verdict: schema.submissions.verdict,
      language: schema.submissions.language,
      timeMs: schema.submissions.timeMs,
      memoryKb: schema.submissions.memoryKb,
      testsPassed: schema.submissions.testsPassed,
      testsTotal: schema.submissions.testsTotal,
      createdAt: schema.submissions.createdAt,
    })
    .from(schema.submissions)
    .where(and(eq(schema.submissions.userId, userId), eq(schema.submissions.problemId, p.id)))
    .orderBy(sql`${schema.submissions.createdAt} desc`)
    .limit(limit);
}

// ───────────────────────── hints ─────────────────────────

/** Reveal hint `level` (1..3). Hints unlock in order; asking again for a revealed hint is free. */
export async function revealHint(userId: string, slug: string, level: number): Promise<{ level: number; text: string }> {
  const p = await findProblem(slug);
  if (!Number.isInteger(level) || level < 1 || level > p.hints.length) throw new ServiceError("Unknown hint level", 400);
  const db = getDb();
  await db.insert(schema.userProblemProgress).values({ userId, problemId: p.id }).onConflictDoNothing();
  const [prog] = await db
    .select()
    .from(schema.userProblemProgress)
    .where(and(eq(schema.userProblemProgress.userId, userId), eq(schema.userProblemProgress.problemId, p.id)));
  const used = prog?.hintsUsed ?? 0;
  if (level > used + 1) throw new ServiceError("Reveal the previous hint first", 409);
  if (level > used) {
    await db
      .update(schema.userProblemProgress)
      .set({ hintsUsed: level })
      .where(and(eq(schema.userProblemProgress.userId, userId), eq(schema.userProblemProgress.problemId, p.id)));
  }
  return { level, text: p.hints[level - 1]! };
}

// ───────────────────────── run / submit ─────────────────────────

function validateSource(source: unknown, language: unknown): { source: string; language: Language } {
  if (typeof source !== "string" || source.trim().length === 0) throw new ServiceError("Write some code first", 400);
  if (Buffer.byteLength(source, "utf8") > MAX_SOURCE_BYTES) throw new ServiceError("Source code is too large (64 KB max)", 413);
  if (language !== "cpp17" && language !== "cpp20") throw new ServiceError("Unsupported language", 400);
  return { source, language };
}

function requireJudge() {
  const judge = getJudge();
  if (!judge) throw new ServiceError("The code judge is not configured on this server, so code cannot be run or submitted yet.", 503);
  return judge;
}
async function withJudge<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof JudgeUnavailableError) throw new ServiceError(e.message, 503);
    throw e;
  }
}

export type RunCase = {
  label: string;
  status: TestVerdict | "ran";
  passed: boolean | null;
  input: string;
  expected: string | null;
  output: string;
  stderr: string;
  timeMs: number | null;
};
export type RunResult = { compileError: string | null; cases: RunCase[] };

/** "Run Code": executes the public samples (plus an optional custom input). Nothing is stored, no XP. */
export async function runSamples(userId: string, slug: string, sourceIn: unknown, languageIn: unknown, customInput?: unknown): Promise<RunResult> {
  void userId;
  const { source, language } = validateSource(sourceIn, languageIn);
  const p = await findProblem(slug);
  const judge = requireJudge();
  let custom: string | null = null;
  if (customInput !== undefined && customInput !== null && customInput !== "") {
    if (typeof customInput !== "string" || customInput.length > MAX_CUSTOM_INPUT) throw new ServiceError("Custom input is too large (10 KB max)", 413);
    custom = customInput;
  }
  const inputs = [...p.samples.map((s) => s.input), ...(custom !== null ? [custom] : [])];
  const runs = await withJudge(() => judge.run(source, language, inputs, { timeMs: p.timeLimitMs, memoryMb: p.memoryLimitMb }));
  const compile = runs.find((r) => r.status === "compilation_error");
  if (compile) return { compileError: clip(compile.compileOutput || "Compilation failed"), cases: [] };
  return {
    compileError: null,
    cases: runs.map((r, i) => {
      const sample = p.samples[i];
      const verdict = sample ? judgeOne(sample.output, r) : null;
      return {
        label: sample ? `Sample ${i + 1}` : "Custom input",
        status: verdict ?? (r.status === "ok" ? "ran" : judgeOne("", r)),
        passed: verdict === null ? null : verdict === "accepted",
        input: clip(inputs[i]!, 1000),
        expected: sample ? clip(sample.output, 1000) : null,
        output: clip(r.stdout, 1000),
        stderr: clip(r.stderr, 1000),
        timeMs: r.timeMs,
      };
    }),
  };
}

export type SubmitResult = {
  submissionId: string;
  verdict: TestVerdict;
  passed: number;
  total: number;
  /** 1-based index of the first failing test. The test's content is never revealed. */
  failedTest: number | null;
  timeMs: number;
  memoryKb: number;
  compileOutput: string | null;
  xpGained: number;
  firstSolve: boolean;
  level: { before: number; after: number; title: string; leveledUp: boolean } | null;
  streak: { current: number; extended: boolean } | null;
  tests: Array<{ index: number; verdict: TestVerdict; timeMs: number | null }>;
};

/** "Submit": judges against ALL tests (samples + hidden). Accepted is only ever set from real judge results. */
export async function submit(userId: string, slug: string, sourceIn: unknown, languageIn: unknown): Promise<SubmitResult> {
  const { source, language } = validateSource(sourceIn, languageIn);
  const p = await findProblem(slug);
  const judge = requireJudge();
  const db = getDb();

  // one submission being judged at a time per user (anti-spam)
  const [busy] = await db
    .select({ n: count() })
    .from(schema.submissions)
    .where(and(eq(schema.submissions.userId, userId), eq(schema.submissions.verdict, "judging"), sql`${schema.submissions.createdAt} > now() - interval '2 minutes'`));
  if ((busy?.n ?? 0) > 0) throw new ServiceError("Your previous submission is still being judged", 429);

  const tests = await db.select().from(schema.problemTestCases).where(eq(schema.problemTestCases.problemId, p.id)).orderBy(asc(schema.problemTestCases.position));
  if (tests.length === 0) throw new ServiceError("This problem has no test cases yet", 503);

  const [sub] = await db
    .insert(schema.submissions)
    .values({ userId, problemId: p.id, language, sourceCode: source, verdict: "judging", testsTotal: tests.length })
    .returning({ id: schema.submissions.id });
  const submissionId = sub!.id;

  let runs;
  try {
    runs = await judge.run(source, language, tests.map((t) => t.input), { timeMs: p.timeLimitMs, memoryMb: p.memoryLimitMb });
  } catch (e) {
    await db.update(schema.submissions).set({ verdict: "internal_error", judgedAt: new Date() }).where(eq(schema.submissions.id, submissionId));
    if (e instanceof JudgeUnavailableError) throw new ServiceError(`${e.message} Your submission was saved as a judge error and was not graded.`, 503);
    throw e;
  }

  const agg = aggregate(tests.map((t) => t.expectedOutput), runs);
  const compileOutput = agg.verdict === "compilation_error" ? clip(runs.find((r) => r.status === "compilation_error")?.compileOutput ?? "") : null;
  const perTest = tests.map((t, i) => ({ index: i + 1, verdict: judgeOne(t.expectedOutput, runs[i]!), timeMs: runs[i]!.timeMs }));

  const now = new Date();
  const result = await db.transaction(async (tx) => {
    await tx
      .update(schema.submissions)
      .set({
        verdict: agg.verdict,
        timeMs: agg.timeMs,
        memoryKb: agg.memoryKb,
        testsPassed: agg.passed,
        testsTotal: agg.total,
        failedTest: agg.failedTest,
        compileOutput,
        judgedAt: now,
      })
      .where(eq(schema.submissions.id, submissionId));

    await tx.insert(schema.userProblemProgress).values({ userId, problemId: p.id }).onConflictDoNothing();
    const [stats] = await tx.select().from(schema.userStats).where(eq(schema.userStats.userId, userId)).for("update");
    const [prog] = await tx
      .select()
      .from(schema.userProblemProgress)
      .where(and(eq(schema.userProblemProgress.userId, userId), eq(schema.userProblemProgress.problemId, p.id)))
      .for("update");
    await tx
      .update(schema.userProblemProgress)
      .set({ attempts: sql`${schema.userProblemProgress.attempts} + 1` })
      .where(and(eq(schema.userProblemProgress.userId, userId), eq(schema.userProblemProgress.problemId, p.id)));

    if (agg.verdict !== "accepted" || !stats || !prog) return { xpGained: 0, firstSolve: false, level: null, streak: null };

    const before = levelFromXp(stats.totalXp);
    const firstSolve = !prog.solved;
    if (firstSolve) {
      await tx
        .update(schema.userProblemProgress)
        .set({ solved: true, solvedAt: now, solvedWithoutHints: prog.hintsUsed === 0 })
        .where(and(eq(schema.userProblemProgress.userId, userId), eq(schema.userProblemProgress.problemId, p.id)));
    }
    let xp = 0;
    if (firstSolve) {
      const amount = XP_RULES.problem[p.difficulty] ?? 0;
      if (await awardXp(tx, { userId, amount, reason: "problem_solved", idempotencyKey: `problem:${p.id}:solved`, refType: "problem", refId: p.id })) xp += amount;
    }
    const act = await recordActivity(tx, {
      userId,
      timezone: (await tx.select({ tz: schema.users.timezone }).from(schema.users).where(eq(schema.users.id, userId)))[0]?.tz ?? "UTC",
      stats,
      now,
      baseXp: xp,
      lessons: 0,
      questions: 0,
    });
    xp += act.bonus?.xp ?? 0;
    const [after] = await tx.select({ totalXp: schema.userStats.totalXp }).from(schema.userStats).where(eq(schema.userStats.userId, userId));
    const lvl = levelFromXp(after!.totalXp);
    return {
      xpGained: xp,
      firstSolve,
      level: { before: before.level, after: lvl.level, title: lvl.title, leveledUp: lvl.level > before.level },
      streak: act.streak,
    };
  });

  return {
    submissionId,
    verdict: agg.verdict,
    passed: agg.passed,
    total: agg.total,
    failedTest: agg.failedTest,
    timeMs: agg.timeMs,
    memoryKb: agg.memoryKb,
    compileOutput,
    ...result,
    tests: perTest,
  };
}
