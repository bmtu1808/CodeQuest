import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deletePostAction, deleteThreadAction, replyAction } from "@/features/social/actions";
import { requireUser } from "@/server/auth/session";
import { ServiceError } from "@/server/services/lesson-run";
import { getThread } from "@/server/services/social";

export const metadata: Metadata = { title: "Thread" };
export const dynamic = "force-dynamic";

export default async function ThreadPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireUser();
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const t = await getThread(id).catch((e) => {
    if (e instanceof ServiceError) return null;
    throw e;
  });
  if (!t) notFound();
  const staff = user.role === "admin" || user.role === "content_editor";
  const back = `/discuss/${t.thread.scopeType}/${t.thread.scopeId}`;
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href={back} className="text-xs font-extrabold uppercase text-sky hover:underline">All threads for {t.title}</Link>
      {sp.error && <p role="alert" className="rounded-xl border-2 border-rose/50 bg-rose/10 px-4 py-2 text-sm font-bold">{sp.error}</p>}
      <Card>
        <h1 className="text-2xl font-black">{t.thread.title}</h1>
        <p className="text-xs text-muted"><Link className="hover:underline" href={`/u/${t.thread.username}`}>{t.thread.author}</Link> · {t.thread.createdAt.toLocaleString("en-US")}</p>
        <p className="mt-3 whitespace-pre-wrap break-words">{t.thread.body}</p>
        {(t.thread.authorId === user.id || staff) && (
          <form action={deleteThreadAction} className="mt-3">
            <input type="hidden" name="threadId" value={t.thread.id} />
            <input type="hidden" name="back" value={back} />
            <Button type="submit" size="sm" variant="outline">Delete thread</Button>
          </form>
        )}
      </Card>
      {t.posts.map((p) => (
        <Card key={p.id}>
          <p className="text-xs text-muted"><Link className="hover:underline" href={`/u/${p.username}`}>{p.author}</Link> · {p.createdAt.toLocaleString("en-US")}</p>
          <p className="mt-2 whitespace-pre-wrap break-words">{p.body}</p>
          {(p.authorId === user.id || staff) && (
            <form action={deletePostAction} className="mt-2">
              <input type="hidden" name="threadId" value={t.thread.id} />
              <input type="hidden" name="postId" value={p.id} />
              <Button type="submit" size="sm" variant="outline">Delete</Button>
            </form>
          )}
        </Card>
      ))}
      <Card>
        <form action={replyAction} className="flex flex-col gap-2">
          <input type="hidden" name="threadId" value={t.thread.id} />
          <label className="sr-only" htmlFor="body">Reply</label>
          <textarea id="body" name="body" required maxLength={4000} rows={3} placeholder="Write a reply" className="w-full rounded-xl border-2 border-line bg-surface px-3 py-2" />
          <Button type="submit">Reply</Button>
        </form>
      </Card>
    </div>
  );
}
