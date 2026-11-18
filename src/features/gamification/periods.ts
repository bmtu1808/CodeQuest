/** Leaderboard periods. Boundaries are UTC so every learner sees the same board. Pure. */

export const PERIODS = ["daily", "weekly", "monthly", "all"] as const;
export type Period = (typeof PERIODS)[number];

export function isPeriod(v: unknown): v is Period {
  return typeof v === "string" && (PERIODS as readonly string[]).includes(v);
}

/** Start (inclusive) of the period containing `now`, or null for all-time. Weeks start on Monday. */
export function periodStart(period: Period, now: Date): Date | null {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  switch (period) {
    case "daily":
      return new Date(Date.UTC(y, m, d));
    case "weekly": {
      const dow = (now.getUTCDay() + 6) % 7; // Monday = 0
      return new Date(Date.UTC(y, m, d - dow));
    }
    case "monthly":
      return new Date(Date.UTC(y, m, 1));
    case "all":
      return null;
  }
}

/** Standard competition ranking: equal XP shares a rank (1, 2, 2, 4). Input must be sorted by xp descending. */
export function assignRanks<T extends { xp: number }>(rows: T[]): Array<T & { rank: number }> {
  let rank = 0;
  return rows.map((r, i) => {
    if (i === 0 || r.xp !== rows[i - 1]!.xp) rank = i + 1;
    return { ...r, rank };
  });
}
