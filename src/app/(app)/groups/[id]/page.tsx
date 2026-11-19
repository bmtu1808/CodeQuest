import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deleteGroupAction, leaveGroupAction, removeMemberAction } from "@/features/social/actions";
import { requireUser } from "@/server/auth/session";
import { getLeaderboard } from "@/server/services/leaderboard";
import { ServiceError } from "@/server/services/lesson-run";
import { getGroup, memberIds } from "@/server/services/social";

export const metadata: Metadata = { title: "Study group" };
export const dynamic = "force-dynamic";

export default async function GroupPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireUser();
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const g = await getGroup(user.id, id).catch((e) => {
    if (e instanceof ServiceError) return null;
    throw e;
  });
  if (!g) notFound();
  const board = await getLeaderboard(user.id, "weekly", new Date(), await memberIds(id));
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link href="/groups" className="text-xs font-extrabold uppercase text-sky hover:underline">All groups</Link>
        <h1 className="text-3xl font-black">{g.name}</h1>
        {g.description && <p className="mt-1 text-muted">{g.description}</p>}
        <p className="mt-2 text-sm">Invite code: <code className="rounded bg-surface-2 px-2 py-1 font-black tracking-widest">{g.inviteCode}</code></p>
      </div>
      {sp.error && <p role="alert" className="rounded-xl border-2 border-rose/50 bg-rose/10 px-4 py-2 text-sm font-bold">{sp.error}</p>}
      <Card>
        <h2 className="text-lg font-black">This week</h2>
        <ol className="mt-2 divide-y-2 divide-line">
          {board.rows.length === 0 && <li className="py-3 text-muted">Nobody in the group has earned XP this week.</li>}
          {board.rows.map((r) => (
            <li key={r.userId} className="flex items-center gap-3 py-3">
              <span className="w-6 text-center font-black text-muted">{r.rank}</span>
              <Avatar name={r.displayName} color={r.avatarColor} size={36} />
              <span className="flex-1 truncate font-bold">{r.displayName}</span>
              <span className="font-black text-gold-dark dark:text-gold">{r.xp.toLocaleString("en-US")} XP</span>
            </li>
          ))}
        </ol>
      </Card>
      <Card>
        <h2 className="text-lg font-black">Members ({g.members.length})</h2>
        <ul className="divide-y-2 divide-line">
          {g.members.map((m) => (
            <li key={m.userId} className="flex items-center gap-3 py-3">
              <Avatar name={m.displayName} color={m.avatarColor} size={36} />
              <Link href={`/u/${m.username}`} className="flex-1 truncate font-bold hover:underline">{m.displayName} <span className="text-xs font-normal text-muted">@{m.username}{m.role === "owner" ? " · owner" : ""}</span></Link>
              {g.isOwner && m.userId !== user.id && (
                <form action={removeMemberAction}>
                  <input type="hidden" name="groupId" value={g.id} />
                  <input type="hidden" name="userId" value={m.userId} />
                  <Button type="submit" size="sm" variant="outline">Remove</Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </Card>
      <form action={g.isOwner ? deleteGroupAction : leaveGroupAction}>
        <input type="hidden" name="groupId" value={g.id} />
        <Button type="submit" variant="outline">{g.isOwner ? "Delete group" : "Leave group"}</Button>
      </form>
    </div>
  );
}
