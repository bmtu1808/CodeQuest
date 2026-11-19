import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createThreadAction } from "@/features/social/actions";
import { requireUser } from "@/server/auth/session";
import { ServiceError } from "@/server/services/lesson-run";
import { listThreads } from "@/server/services/social";

export const metadata: Metadata = { title: "Discussion" };
export const dynamic = "force-dynamic";
const input = "w-full rounded-xl border-2 border-line bg-surface px-3 py-2";

export default async function DiscussPage({ params, searchParams }: { params: Promise<{ scope: string; id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { scope, id } = await params;
  const sp = await searchParams;
  await requireUser();
  if ((scope !== "problem" && scope !== "lesson") || !/^[0-9a-f-]{36}$/.test(id)) notFound();
  const res = await listThreads(scope, id).catch((e) => {
    if (e instanceof ServiceError) return e;
    throw e;
  });
  if (res instanceof ServiceError) {
    if (res.status === 423) return <Card className="mx-auto max-w-2xl p-8 text-center text-muted">{res.message}</Card>;
    notFound();
  }
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link href={res.backHref} className="text-xs font-extrabold uppercase text-sky hover:underline">Back</Link>
        <h1 className="text-3xl font-black">Discussion: {res.title}</h1>
        <p className="mt-1 text-sm text-muted">Be kind. Do not paste full solutions to practice problems without a spoiler warning in the title.</p>
      </div>
      {sp.error && <p role="alert" className="rounded-xl border-2 border-rose/50 bg-rose/10 px-4 py-2 text-sm font-bold">{sp.error}</p>}
      <Card>
        <ul className="divide-y-2 divide-line">
          {res.threads.length === 0 && <li className="py-3 text-muted">No threads yet. Start the first one.</li>}
          {res.threads.map((t) => (
            <li key={t.id} className="py-3">
              <Link href={`/discuss/thread/${t.id}`} className="font-extrabold hover:underline">{t.title}</Link>
              <p className="text-xs text-muted">{t.author} · {t.replies} repl{t.replies === 1 ? "y" : "ies"} · {t.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2 className="text-lg font-black">New thread</h2>
        <form action={createThreadAction} className="mt-3 flex flex-col gap-2">
          <input type="hidden" name="scope" value={scope} />
          <input type="hidden" name="scopeId" value={id} />
          <label className="sr-only" htmlFor="title">Title</label>
          <input id="title" name="title" required minLength={3} maxLength={120} placeholder="Title" className={input} />
          <label className="sr-only" htmlFor="body">Message</label>
          <textarea id="body" name="body" required maxLength={4000} rows={4} placeholder="Your question or idea" className={input} />
          <Button type="submit">Post thread</Button>
        </form>
      </Card>
    </div>
  );
}
