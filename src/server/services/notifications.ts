import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "@/server/db/client";
import type { Tx } from "./xp";

export type NotificationInput = { userId: string; type: "achievement" | "quest" | "level" | "streak" | "hearts" | "system"; title: string; body?: string; href?: string };

/** Insert inside the caller's transaction so a notification exists only if the thing it announces really happened. */
export async function notify(tx: Tx, n: NotificationInput): Promise<void> {
  await tx.insert(schema.notifications).values({ userId: n.userId, type: n.type, title: n.title, body: n.body ?? "", href: n.href ?? null });
}

export async function unreadCount(userId: string): Promise<number> {
  const [r] = await getDb()
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.notifications)
    .where(and(eq(schema.notifications.userId, userId), isNull(schema.notifications.readAt)));
  return r?.n ?? 0;
}

export async function listNotifications(userId: string, limit = 50) {
  return getDb().select().from(schema.notifications).where(eq(schema.notifications.userId, userId)).orderBy(desc(schema.notifications.createdAt)).limit(limit);
}

export async function markAllRead(userId: string): Promise<void> {
  await getDb()
    .update(schema.notifications)
    .set({ readAt: new Date() })
    .where(and(eq(schema.notifications.userId, userId), isNull(schema.notifications.readAt)));
}
