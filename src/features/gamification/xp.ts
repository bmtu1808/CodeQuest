/** XP rules and level curve. Pure functions - no I/O. Values are config-ready (admin CMS in a later phase). */

export const XP_RULES = {
  lessonComplete: 20,
  perfectBonus: 10,
  /** XP for the first Accepted solution of a problem, by difficulty. */
  problem: { newbie: 10, easy: 15, medium: 30, hard: 50, expert: 50 } as Record<string, number>,
  /** streak length -> bonus XP, granted once per milestone per user (idempotent in the ledger). */
  streakMilestones: { 3: 10, 7: 25, 14: 50, 30: 100, 60: 200, 100: 400 } as Record<number, number>,
} as const;

/** XP needed to go from `level` to `level + 1`. */
export function xpToAdvance(level: number): number {
  return 100 + 20 * (level - 1);
}

/** Total XP required to *reach* `level` (level 1 = 0 XP). */
export function xpToReachLevel(level: number): number {
  if (level <= 1) return 0;
  const n = level - 1; // number of level-ups
  // sum_{k=1..n} (100 + 20(k-1)) = 100n + 20 * n(n-1)/2
  return 100 * n + 10 * n * (n - 1);
}

export const MAX_LEVEL = 100;

export type LevelInfo = {
  level: number;
  title: string;
  xpIntoLevel: number;
  xpForNext: number;
  progress: number; // 0..1
  isMax: boolean;
};

export function levelFromXp(totalXp: number): LevelInfo {
  const xp = Math.max(0, Math.floor(totalXp));
  let level = 1;
  // Closed form would work, but a bounded loop keeps it obviously correct (max 100 iterations).
  while (level < MAX_LEVEL && xp >= xpToReachLevel(level + 1)) level++;
  const isMax = level >= MAX_LEVEL;
  const base = xpToReachLevel(level);
  const xpForNext = isMax ? 0 : xpToAdvance(level);
  const xpIntoLevel = xp - base;
  return {
    level,
    title: levelTitle(level),
    xpIntoLevel,
    xpForNext,
    progress: isMax ? 1 : Math.min(1, xpIntoLevel / xpForNext),
    isMax,
  };
}

const TITLES: Array<[number, string]> = [
  [100, "Grandmaster"],
  [75, "Algorithm Master"],
  [50, "Competitive Programmer"],
  [40, "Code Warrior"],
  [30, "Problem Solver"],
  [20, "Algorithm Explorer"],
  [10, "Programmer"],
  [5, "Apprentice"],
  [1, "Beginner"],
];

export function levelTitle(level: number): string {
  return TITLES.find(([min]) => level >= min)?.[1] ?? "Beginner";
}

/** Daily XP goal derived from the "minutes per day" onboarding answer. */
export function dailyGoalXp(dailyMinutes: number): number {
  if (dailyMinutes <= 5) return 20;
  if (dailyMinutes <= 10) return 40;
  if (dailyMinutes <= 15) return 60;
  return 80;
}
