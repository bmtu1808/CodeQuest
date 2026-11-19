/** Spaced repetition (SM-2 style). Pure. */

export type ReviewState = { easeMilli: number; intervalDays: number; repetitions: number; lapses: number };

export const NEW_REVIEW: ReviewState = { easeMilli: 2500, intervalDays: 0, repetitions: 0, lapses: 0 };
const MIN_EASE = 1300;
const MAX_EASE = 3000;
const RETRY_MS = 10 * 60_000;
const DAY_MS = 86_400_000;

/** State and due time after one review. A wrong answer is retried in 10 minutes and resets the ladder. */
export function nextReview(s: ReviewState, correct: boolean, now: Date): { state: ReviewState; dueAt: Date } {
  if (!correct) {
    return {
      state: { easeMilli: Math.max(MIN_EASE, s.easeMilli - 200), intervalDays: 0, repetitions: 0, lapses: s.lapses + 1 },
      dueAt: new Date(now.getTime() + RETRY_MS),
    };
  }
  const repetitions = s.repetitions + 1;
  const easeMilli = Math.min(MAX_EASE, s.easeMilli + 50);
  const intervalDays = repetitions === 1 ? 1 : repetitions === 2 ? 3 : Math.max(s.intervalDays + 1, Math.round((s.intervalDays * easeMilli) / 1000));
  return { state: { easeMilli, intervalDays, repetitions, lapses: s.lapses }, dueAt: new Date(now.getTime() + intervalDays * DAY_MS) };
}
