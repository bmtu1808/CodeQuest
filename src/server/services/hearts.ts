import { eq } from "drizzle-orm";
import { getDb, schema } from "@/server/db/client";
import { applyHeartChange, currentHearts, MAX_HEARTS, type HeartsState } from "@/features/gamification/hearts";
import type { Tx } from "./xp";

export type HeartsView = HeartsState & { max: number };

export async function getHearts(userId: string, now = new Date()): Promise<HeartsView> {
  const [s] = await getDb().select({ hearts: schema.userStats.hearts, at: schema.userStats.heartsUpdatedAt }).from(schema.userStats).where(eq(schema.userStats.userId, userId));
  return { ...currentHearts(s?.hearts ?? MAX_HEARTS, s?.at ?? now, now), max: MAX_HEARTS };
}

/** Change hearts by `delta` (negative = spend) inside a transaction. Locks the stats row. */
export async function changeHearts(tx: Tx, userId: string, delta: number, now = new Date()): Promise<HeartsView> {
  const [s] = await tx.select({ hearts: schema.userStats.hearts, at: schema.userStats.heartsUpdatedAt }).from(schema.userStats).where(eq(schema.userStats.userId, userId)).for("update");
  if (!s) return { hearts: MAX_HEARTS, nextAt: null, max: MAX_HEARTS };
  const next = applyHeartChange(s.hearts, s.at, now, delta);
  await tx.update(schema.userStats).set({ hearts: next.hearts, heartsUpdatedAt: next.updatedAt }).where(eq(schema.userStats.userId, userId));
  return { ...currentHearts(next.hearts, next.updatedAt, now), max: MAX_HEARTS };
}
