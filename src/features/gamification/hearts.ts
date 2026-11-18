/** Hearts rules. Pure functions: regeneration is computed lazily from the stored value + timestamp. */

export const MAX_HEARTS = 5;
/** One heart comes back every 30 minutes. */
export const HEART_REGEN_MS = 30 * 60 * 1000;

export type HeartsState = { hearts: number; /** ms epoch when the next heart arrives, null when full */ nextAt: number | null };

export function currentHearts(stored: number, updatedAt: Date | number, now: Date | number): HeartsState {
  const base = Math.max(0, Math.min(MAX_HEARTS, stored));
  const t0 = typeof updatedAt === "number" ? updatedAt : updatedAt.getTime();
  const t1 = typeof now === "number" ? now : now.getTime();
  if (base >= MAX_HEARTS) return { hearts: MAX_HEARTS, nextAt: null };
  const gained = Math.max(0, Math.floor((t1 - t0) / HEART_REGEN_MS));
  const hearts = Math.min(MAX_HEARTS, base + gained);
  if (hearts >= MAX_HEARTS) return { hearts, nextAt: null };
  return { hearts, nextAt: t0 + (gained + 1) * HEART_REGEN_MS };
}

/**
 * Values to persist after spending/earning `delta` hearts at `now`.
 * The timestamp only moves when we were full (so the regen clock keeps ticking while hearts are missing).
 */
export function applyHeartChange(stored: number, updatedAt: Date, now: Date, delta: number): { hearts: number; updatedAt: Date } {
  const cur = currentHearts(stored, updatedAt, now);
  const hearts = Math.max(0, Math.min(MAX_HEARTS, cur.hearts + delta));
  if (hearts >= MAX_HEARTS) return { hearts, updatedAt: now };
  // Keep the running regen clock: move the base time to the last whole regen tick.
  if (cur.nextAt === null) return { hearts, updatedAt: now }; // was full, now starts the clock
  return { hearts, updatedAt: new Date(cur.nextAt - HEART_REGEN_MS) };
}
