import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { addFriendAction, removeFriendAction, respondFriendAction } from "@/features/social/actions";
import { requireUser } from "@/server/auth/session";
import { getFriends, type PersonRow } from "@/server/services/social";

export const metadata: Metadata = { title: "Friends" };
export const dynamic = "force-dynamic";

function Person({ p, children }: { p: PersonRow; children?: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <Avatar name={p.displayName} color={p.avatarColor} size={40} />
      <div className="min-w-0 flex-1">
        <Link href={`/u/${p.username}`} className="truncate font-extrabold hover:underline">{p.displayName}</Link>
        <p className="truncate text-xs text-muted">@{p.username} · Level {p.level} · {p.streak} day streak</p>
      </div>
      {children}
    </li>
  );
}

export default async function FriendsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const v = await getFriends(user.id);
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black">Friends</h1>
        <p className="mt-1 text-muted">Add learners by username and compare progress on the <Link className="font-bold text-sky hover:underline" href="/leaderboard?scope=friends">friends leaderboard</Link>.</p>
      </div>
      {sp.error && <p role="alert" className="rounded-xl border-2 border-rose/50 bg-rose/10 px-4 py-2 text-sm font-bold">{sp.error}</p>}
      <Card>
        <form action={addFriendAction} className="flex gap-2">
          <label className="sr-only" htmlFor="username">Username</label>
          <input id="username" name="username" required minLength={3} maxLength={21} placeholder="Username, e.g. ada_lovelace" className="min-w-0 flex-1 rounded-xl border-2 border-line bg-surface px-3 py-2" />
          <Button type="submit">Add friend</Button>
        </form>
      </Card>
      {v.incoming.length > 0 && (
        <Card>
          <h2 className="text-lg font-black">Requests ({v.incoming.length})</h2>
          <ul className="divide-y-2 divide-line">
            {v.incoming.map((p) => (
              <Person key={p.userId} p={p}>
                <form action={respondFriendAction} className="flex gap-2">
                  <input type="hidden" name="id" value={p.friendshipId} />
                  <Button type="submit" size="sm" name="accept" value="1">Accept</Button>
                  <Button type="submit" size="sm" variant="outline" name="accept" value="0">Decline</Button>
                </form>
              </Person>
            ))}
          </ul>
        </Card>
      )}
      <Card>
        <h2 className="text-lg font-black">Your friends ({v.friends.length})</h2>
        {v.friends.length === 0 ? (
          <p className="mt-2 text-muted">No friends yet. Send a request using a username above.</p>
        ) : (
          <ul className="divide-y-2 divide-line">
            {v.friends.map((p) => (
              <Person key={p.userId} p={p}>
                <form action={removeFriendAction}>
                  <input type="hidden" name="userId" value={p.userId} />
                  <Button type="submit" size="sm" variant="outline">Remove</Button>
                </form>
              </Person>
            ))}
          </ul>
        )}
      </Card>
      {v.outgoing.length > 0 && (
        <Card>
          <h2 className="text-lg font-black">Sent requests</h2>
          <ul className="divide-y-2 divide-line">
            {v.outgoing.map((p) => (
              <Person key={p.userId} p={p}>
                <form action={removeFriendAction}>
                  <input type="hidden" name="userId" value={p.userId} />
                  <Button type="submit" size="sm" variant="outline">Cancel</Button>
                </form>
              </Person>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
