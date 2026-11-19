import { and, asc, count, eq, isNull, lte, sql } from "drizzle-orm";
import { getDb, schema } from "@/server/db/client";
import { grade, GradingError, type QuestionResponse } from "@/features/learning/grader";
import type { PublicQuestion, QuestionType } from "@/features/learning/types";
import { NEW_REVIEW, nextReview } from "@/features/learning/srs";
import { recordActivity } from "./activity";
import { trackEngagement, type Reward } from "./engagement";
import { ServiceError, toPublic } from "./lesson-run";
import type { Tx } from "./xp";

/** Called when a lesson question is answered correctly: it joins the review schedule, first review due in a day. */
export async function scheduleFirstReview(tx: Tx, userId: string, questionId: string, now: Date): Promise<void> {
  const first = nextReview(NEW_REVIEW, true, now);
  await tx
    .insert(schema.questionReviews)
    .values({ userId, questionId, easeMilli: first.state.easeMilli, intervalDays: first.state.intervalDays, repetitions: first.state.repetitions, lapses: 0, dueAt: first.dueAt })
    .onConflictDoNothing();
}

export type ReviewOverview = { due: number; scheduled: number; nextDueAt: Date | null };

export async function getReviewOverview(userId: string, now = new Date()): Promise<ReviewOverview> {
  const R = schema.questionReviews;
  const [r] = await getDb()
    .select({ scheduled: count(), due: sql<number>`count(*) filter (where ${R.dueAt} <= ${now.toISOString()}::timestamptz)::int`, next: sql<Date | null>`min(${R.dueAt}) filter (where ${R.dueAt} > ${now.toISOString()}::timestamptz)` })
    .from(R)
    .innerJoin(schema.lessonQuestions, and(eq(schema.lessonQuestions.id, R.questionId), isNull(schema.lessonQuestions.deletedAt)))
    .where(eq(R.userId, userId));
  return { due: Number(r?.due ?? 0), scheduled: Number(r?.scheduled ?? 0), nextDueAt: r?.next ? new Date(r.next) : null };
}

/** Questions that are due now, oldest due first. Answers are never included. */
export async function getDueReviews(userId: string, limit = 10, now = new Date()): Promise<PublicQuestion[]> {
  const rows = await getDb()
    .select({ q: schema.lessonQuestions })
    .from(schema.questionReviews)
    .innerJoin(schema.lessonQuestions, and(eq(schema.lessonQuestions.id, schema.questionReviews.questionId), isNull(schema.lessonQuestions.deletedAt)))
    .where(and(eq(schema.questionReviews.userId, userId), lte(schema.questionReviews.dueAt, now)))
    .orderBy(asc(schema.questionReviews.dueAt))
    .limit(limit);
  return rows.map((r) => toPublic(r.q));
}

export type ReviewResult = { correct: boolean; correctAnswer: string; explanation: string; nextDueAt: Date; intervalDays: number; rewards: Reward[] };

/**
 * Answer one due review. Only a question that is actually due can be answered, so reviews cannot be farmed.
 * A review counts as learning activity for the streak and for "review" quests, but earns no XP by itself.
 */
export async function answerReview(userId: string, questionId: string, response: QuestionResponse, now = new Date()): Promise<ReviewResult> {
  return getDb().transaction(async (tx) => {
    const [stats] = await tx.select().from(schema.userStats).where(eq(schema.userStats.userId, userId)).for("update");
    const [user] = await tx.select().from(schema.users).where(eq(schema.users.id, userId));
    if (!stats || !user) throw new ServiceError("User not found", 404);
    const [rev] = await tx.select().from(schema.questionReviews).where(and(eq(schema.questionReviews.userId, userId), eq(schema.questionReviews.questionId, questionId))).for("update");
    if (!rev) throw new ServiceError("This question is not in your review schedule", 404);
    if (rev.dueAt > now) throw new ServiceError("This question is not due yet", 409);
    const [q] = await tx.select().from(schema.lessonQuestions).where(and(eq(schema.lessonQuestions.id, questionId), isNull(schema.lessonQuestions.deletedAt)));
    if (!q) throw new ServiceError("Question not found", 404);
    let result;
    try {
      result = grade(q.type as QuestionType, q.data, q.answer, response);
    } catch (e) {
      if (e instanceof GradingError) throw new ServiceError("Invalid answer format", 400);
      throw e;
    }
    const next = nextReview({ easeMilli: rev.easeMilli, intervalDays: rev.intervalDays, repetitions: rev.repetitions, lapses: rev.lapses }, result.correct, now);
    await tx
      .update(schema.questionReviews)
      .set({ ...next.state, dueAt: next.dueAt, lastReviewedAt: now })
      .where(eq(schema.questionReviews.id, rev.id));
    const act = await recordActivity(tx, { userId, timezone: user.timezone, stats, now, baseXp: 0, lessons: 0, questions: 1 });
    const eng = await trackEngagement(tx, { userId, timezone: user.timezone, day: act.day, now, xpBefore: stats.totalXp, event: { review_questions: result.correct ? 1 : 0 } });
    return { correct: result.correct, correctAnswer: result.correctAnswer, explanation: q.explanation, nextDueAt: next.dueAt, intervalDays: next.state.intervalDays, rewards: eng.rewards };
  });
}
