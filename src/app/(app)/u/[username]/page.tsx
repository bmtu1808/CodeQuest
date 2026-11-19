import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { addFriendAction, removeFriendAction, respondFriendAction } from "@/features/social/actions";
import { requireUser } from "@/server/auth/session";
import { ServiceError } from "@/server/services/lesson-run";
import { friendshipState, getFriends, getPublicProfile } from "@/server/services/social";

export const metadata: Metadata = { title: "Learner profile" };
export const dynamic = "force-dynamic";

export default async function PublicProfile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const me = await requireUser();
  const p = await getPublicProfile(username).catch((e) => {
    if (e instanceof ServiceError) return null;
    throw e;
  });
  if (!p) notFound();
  const state = await friendshipState(me.id, p.id);
  const incoming = state === "received" ? (await getFriends(me.id)).incoming.find((i) => i.userId === p.id) : undefined;
  const stats = [
    ["Total XP", p.totalXp.toLocaleString("en-US")],
    ["Level", p.level.level],
    ["Streak", p.streak],
    ["Lessons", p.lessons],
    ["Problems solved", p.solved],
    ["Contest rating", p.rating ?? "Not rated"],
  ] as const;
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Card className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
        <Avatar name={p.displayName} color={p.avatarColor} size={80} />
        <div className="flex-1">
          <h1 className="text-2xl font-black">{p.displayName}</h1>
          <p className="text-muted">@{p.username} · Joined {p.joined.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
          {p.bio && <p className="mt-1">{p.bio}</p>}
        </div>
        {state === "none" && (
          <form action={addFriendAction}><input type="hidden" name="username" value={p.username} /><Button type="submit">Add friend</Button></form>
        )}
        {state === "sent" && <span className="text-sm font-bold text-muted">Request sent</span>}
        {state === "received" && incoming && (
          <form action={respondFriendAction}><input type="hidden" name="id" value={incoming.friendshipId} /><Button type="submit" name="accept" value="1">Accept request</Button></form>
        )}
        {state === "friends" && (
          <form action={removeFriendAction}><input type="hidden" name="userId" value={p.id} /><Button type="submit" variant="outline">Remove friend</Button></form>
        )}
      </Card>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map(([l, v]) => (
          <Card key={l} className="p-4 text-center"><p className="text-2xl font-black">{v}</p><p className="text-[11px] font-bold uppercase text-muted">{l}</p></Card>
        ))}
      </div>
      <Card>
        <h2 className="mb-3 text-lg font-black">Achievements</h2>
        {p.achievements.length === 0 ? <p className="text-muted">None yet.</p> : (
          <ul className="flex flex-wrap gap-2">{p.achievements.map((a) => <li key={a} className="rounded-full bg-gold/15 px-3 py-1 text-sm font-bold text-gold-dark dark:text-gold">{a}</li>)}</ul>
        )}
      </Card>
    </div>
  );
}
