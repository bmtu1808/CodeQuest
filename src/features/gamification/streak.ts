/** Streak logic on *local calendar days* (user timezone). Pure functions. */

export type StreakState = {
  current: number;
  longest: number;
  lastActiveDate: string | null; // YYYY-MM-DD
};

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** YYYY-MM-DD of `date` as seen in `timeZone`. */
export function toLocalDay(date: Date, timeZone: string): string {
  const tz = isValidTimezone(timeZone) ? timeZone : "UTC";
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number) as [number, number, number];
  const [by, bm, bd] = b.split("-").map(Number) as [number, number, number];
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

export type ActivityResult = { state: StreakState; extended: boolean };

/** Register a learning activity on `today`. Idempotent within the same day. */
export function applyActivity(state: StreakState, today: string): ActivityResult {
  const last = state.lastActiveDate;
  if (last === today) return { state, extended: false };
  let current: number;
  if (last && daysBetween(last, today) === 1) current = state.current + 1;
  else current = 1; // first ever activity, or the streak was broken
  const longest = Math.max(state.longest, current);
  return { state: { current, longest, lastActiveDate: today }, extended: true };
}

/** Streak to *display* today: a streak is still alive if the user was active today or yesterday. */
export function effectiveStreak(state: StreakState, today: string): number {
  if (!state.lastActiveDate) return 0;
  const gap = daysBetween(state.lastActiveDate, today);
  return gap <= 1 && gap >= 0 ? state.current : 0;
}

/** True when the user has not practised yet today but still can keep the streak alive. */
export function streakAtRisk(state: StreakState, today: string): boolean {
  return !!state.lastActiveDate && daysBetween(state.lastActiveDate, today) === 1 && state.current > 0;
}
