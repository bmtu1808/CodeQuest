/** ICPC-style contest scoring. Pure: the scoreboard is always recomputed from the stored submissions. */

export const WRONG_PENALTY_MIN = 20;

export type ContestPhase = "upcoming" | "live" | "past";

export function contestPhase(now: Date, c: { startsAt: Date; durationMin: number }): ContestPhase {
  const t = now.getTime();
  const start = c.startsAt.getTime();
  if (t < start) return "upcoming";
  if (t < start + c.durationMin * 60_000) return "live";
  return "past";
}

export type ScoredSubmission = { userId: string; problemLabel: string; verdict: string; createdAt: Date };

/** Verdicts that never count as an attempt: nothing was judged against the tests. */
const NOT_AN_ATTEMPT = new Set(["compilation_error", "internal_error", "pending", "judging"]);

export type ProblemCell = { solved: boolean; wrong: number; /** minutes from window start to the first accepted solution */ minutes: number | null };
export type ScoreRow = { userId: string; solved: number; penalty: number; cells: Record<string, ProblemCell>; rank: number };

/**
 * @param windowStart  userId -> start of that user's window (the contest start for live participants,
 *                     the personal start for virtual ones). Submissions after `windowStart + durationMin` are ignored.
 */
export function computeScoreboard(subs: ScoredSubmission[], labels: string[], windowStart: Map<string, Date>, durationMin: number): ScoreRow[] {
  const byUser = new Map<string, ScoredSubmission[]>();
  for (const s of subs) {
    if (!windowStart.has(s.userId)) continue;
    (byUser.get(s.userId) ?? byUser.set(s.userId, []).get(s.userId)!).push(s);
  }
  const rows: Omit<ScoreRow, "rank">[] = [];
  for (const [userId, start] of windowStart) {
    const mine = (byUser.get(userId) ?? []).filter((s) => s.createdAt >= start && s.createdAt.getTime() < start.getTime() + durationMin * 60_000).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const cells: Record<string, ProblemCell> = {};
    let solved = 0;
    let penalty = 0;
    for (const label of labels) {
      const cell: ProblemCell = { solved: false, wrong: 0, minutes: null };
      for (const s of mine) {
        if (s.problemLabel !== label || NOT_AN_ATTEMPT.has(s.verdict)) continue;
        if (s.verdict === "accepted") {
          cell.solved = true;
          cell.minutes = Math.floor((s.createdAt.getTime() - start.getTime()) / 60_000);
          break;
        }
        cell.wrong++;
      }
      if (cell.solved) {
        solved++;
        penalty += cell.minutes! + WRONG_PENALTY_MIN * cell.wrong;
      }
      cells[label] = cell;
    }
    rows.push({ userId, solved, penalty, cells });
  }
  rows.sort((a, b) => b.solved - a.solved || a.penalty - b.penalty || a.userId.localeCompare(b.userId));
  let rank = 0;
  return rows.map((r, i) => {
    const prev = rows[i - 1];
    if (!prev || prev.solved !== r.solved || prev.penalty !== r.penalty) rank = i + 1;
    return { ...r, rank };
  });
}

/** Where a virtual run would have placed among the official results (ties share the better rank). */
export function virtualRank(official: Array<{ solved: number; penalty: number }>, mine: { solved: number; penalty: number }): number {
  return 1 + official.filter((o) => o.solved > mine.solved || (o.solved === mine.solved && o.penalty < mine.penalty)).length;
}
