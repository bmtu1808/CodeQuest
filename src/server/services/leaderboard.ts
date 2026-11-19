import { sql } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { assignRanks, periodStart, type Period } from "@/features/gamification/periods";
import { levelFromXp } from "@/features/gamification/xp";

export type BoardRow = { rank: number; userId: string; username: string; displayName: string; avatarColor: string; xp: number; level: number };
export type Board = { period: Period; since: string | null; rows: BoardRow[]; me: { rank: number | null; xp: number; hidden: boolean } };

const TOP = 50;

/**
 * Ranking by XP earned in the period, summed from the append-only XP ledger.
 * Because every reward has a unique idempotency key, replaying finished work cannot raise a rank.
 */
export async function getLeaderboard(userId: string, period: Period, now = new Date(), restrictTo?: string[]): Promise<Board> {
  const db = getDb();
  const start = periodStart(period, now);
  const sinceOnly = start ? sql`and x.created_at >= ${start.toISOString()}::timestamptz` : sql``;
  // Public boards respect the privacy setting. Friend and group boards are limited to people who chose to be there.
  const since = restrictTo ? sql`${sinceOnly} and x.user_id in (${sql.join(restrictTo.length ? restrictTo.map((id) => sql`${id}::uuid`) : [sql`null::uuid`], sql`, `)})` : sql`${sinceOnly} and x.user_id in (select id from users where show_on_leaderboard)`;
  const top = await db.execute(sql`
    select u.id, u.username, u.display_name, u.avatar_color, sum(x.amount)::int as xp, s.total_xp
    from xp_transactions x
    join users u on u.id = x.user_id and u.deleted_at is null
    join user_stats s on s.user_id = u.id
    where true ${since}
    group by u.id, s.total_xp
    having sum(x.amount) > 0
    order by xp desc, u.username asc
    limit ${TOP}`);
  const rows = assignRanks(
    (top.rows as Array<{ id: string; username: string; display_name: string; avatar_color: string; xp: number; total_xp: number }>).map((r) => ({
      userId: r.id,
      username: r.username,
      displayName: r.display_name,
      avatarColor: r.avatar_color,
      xp: Number(r.xp),
      level: levelFromXp(Number(r.total_xp)).level,
    })),
  );

  const mine = await db.execute(sql`select coalesce(sum(x.amount), 0)::int as xp from xp_transactions x where x.user_id = ${userId} ${sinceOnly}`);
  const vis = await db.execute(sql`select show_on_leaderboard as v from users where id = ${userId}`);
  const iAmHidden = !restrictTo && !(vis.rows[0] as { v: boolean } | undefined)?.v;
  const myXp = Number((mine.rows[0] as { xp: number }).xp);
  let rank: number | null = null;
  if (myXp > 0 && !iAmHidden) {
    const ahead = await db.execute(sql`
      select count(*)::int as n from (
        select x.user_id from xp_transactions x join users u on u.id = x.user_id and u.deleted_at is null
        where true ${since} group by x.user_id having sum(x.amount) > ${myXp}
      ) t`);
    rank = Number((ahead.rows[0] as { n: number }).n) + 1;
  }
  return { period, since: start ? start.toISOString() : null, rows, me: { rank, xp: myXp, hidden: iAmHidden } };
}
