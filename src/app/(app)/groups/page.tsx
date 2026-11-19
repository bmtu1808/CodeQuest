import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createGroupAction, joinGroupAction } from "@/features/social/actions";
import { requireUser } from "@/server/auth/session";
import { listMyGroups } from "@/server/services/social";

export const metadata: Metadata = { title: "Study groups" };
export const dynamic = "force-dynamic";
const input = "min-w-0 flex-1 rounded-xl border-2 border-line bg-surface px-3 py-2";

export default async function GroupsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const groups = await listMyGroups(user.id);
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black">Study groups</h1>
        <p className="mt-1 text-muted">Private groups with their own weekly leaderboard. Share the invite code to bring people in.</p>
      </div>
      {sp.error && <p role="alert" className="rounded-xl border-2 border-rose/50 bg-rose/10 px-4 py-2 text-sm font-bold">{sp.error}</p>}
      <Card>
        <h2 className="text-lg font-black">Your groups</h2>
        {groups.length === 0 ? (
          <p className="mt-2 text-muted">You are not in a group yet. Create one or join with a code.</p>
        ) : (
          <ul className="mt-2 divide-y-2 divide-line">
            {groups.map((g) => (
              <li key={g.id} className="py-3">
                <Link href={`/groups/${g.id}`} className="font-extrabold hover:underline">{g.name}</Link>
                <p className="text-xs text-muted">{g.members} member{g.members === 1 ? "" : "s"}{g.role === "owner" ? " · you own this" : ""}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="text-lg font-black">Create a group</h2>
          <form action={createGroupAction} className="mt-3 flex flex-col gap-2">
            <label className="sr-only" htmlFor="gname">Name</label>
            <input id="gname" name="name" required minLength={3} maxLength={40} placeholder="Group name" className={input} />
            <label className="sr-only" htmlFor="gdesc">Description</label>
            <input id="gdesc" name="description" maxLength={300} placeholder="Description (optional)" className={input} />
            <Button type="submit">Create</Button>
          </form>
        </Card>
        <Card>
          <h2 className="text-lg font-black">Join with a code</h2>
          <form action={joinGroupAction} className="mt-3 flex flex-col gap-2">
            <label className="sr-only" htmlFor="code">Invite code</label>
            <input id="code" name="code" required maxLength={16} placeholder="Invite code" className={`${input} uppercase`} />
            <Button type="submit" variant="outline">Join</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
