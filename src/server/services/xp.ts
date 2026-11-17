import { eq, sql } from "drizzle-orm";
import type { Db } from "@/server/db/client";
import { schema } from "@/server/db/client";

export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/**
 * Append a ledger entry and update the cached total in the SAME transaction.
 * Returns false (and changes nothing) when this idempotency key was already used by the user,
 * so replaying a lesson or re-sending a request can never grant the same reward twice.
 */
export async function awardXp(
  tx: Tx,
  p: { userId: string; amount: number; reason: string; idempotencyKey: string; refType?: string; refId?: string },
): Promise<boolean> {
  if (p.amount <= 0) return false;
  const inserted = await tx
    .insert(schema.xpTransactions)
    .values({
      userId: p.userId,
      amount: p.amount,
      reason: p.reason,
      idempotencyKey: p.idempotencyKey,
      refType: p.refType ?? null,
      refId: p.refId ?? null,
    })
    .onConflictDoNothing({ target: [schema.xpTransactions.userId, schema.xpTransactions.idempotencyKey] })
    .returning({ id: schema.xpTransactions.id });
  if (!inserted.length) return false;
  await tx
    .update(schema.userStats)
    .set({ totalXp: sql`${schema.userStats.totalXp} + ${p.amount}` })
    .where(eq(schema.userStats.userId, p.userId));
  return true;
}
