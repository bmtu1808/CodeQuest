import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, inputCls, Notice } from "@/components/admin/ui";
import { deleteContestAction, saveContestAction } from "@/features/admin/actions";
import { requireRole } from "@/server/auth/session";
import { getDb, schema } from "@/server/db/client";
import { asc, eq } from "drizzle-orm";
import { listContestsAdmin } from "@/server/services/admin";

export const metadata: Metadata = { title: "Admin · Contests" };

export default async function ContestsAdmin({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const sp = await searchParams;
  const me = await requireRole("admin", "content_editor");
  const rows = await listContestsAdmin(me);
  const cps = await getDb().select({ contestId: schema.contestProblems.contestId, slug: schema.problems.slug, position: schema.contestProblems.position }).from(schema.contestProblems).innerJoin(schema.problems, eq(schema.problems.id, schema.contestProblems.problemId)).orderBy(asc(schema.contestProblems.position));
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-black">Contests</h1>
      <p className="text-sm text-muted">Times are UTC. A contest with participants can no longer be edited, only unpublished. Problems are labelled A, B, C in the order given.</p>
      <Notice error={sp.error} saved={sp.saved} />
      {rows.map((c) => (
        <Card key={c.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-black">{c.title} <span className="text-xs font-bold text-muted">{c.published ? "" : "(draft) "}{c.participants} participants{c.ratedAt ? " · rated" : ""}</span></h2>
            {c.participants === 0 && (
              <form action={deleteContestAction}><input type="hidden" name="id" value={c.id} /><Button type="submit" size="sm" variant="outline">Delete</Button></form>
            )}
          </div>
          {c.participants === 0 && (
            <details className="mt-2"><summary className="cursor-pointer text-xs font-extrabold uppercase text-sky">Edit</summary>
              <ContestForm c={{ id: c.id, title: c.title, startsAt: c.startsAt, durationMin: c.durationMin, published: c.published, problems: cps.filter((x) => x.contestId === c.id).map((x) => x.slug).join(", ") }} />
            </details>
          )}
        </Card>
      ))}
      <Card><h2 className="text-lg font-black">New contest</h2><ContestForm /></Card>
    </div>
  );
}

function ContestForm({ c }: { c?: { id: string; title: string; startsAt: Date; durationMin: number; published: boolean; problems: string } }) {
  return (
    <form action={saveContestAction} className="mt-2 grid gap-3 sm:grid-cols-2">
      {c && <input type="hidden" name="id" value={c.id} />}
      <Field label="Title"><input name="title" required defaultValue={c?.title} className={inputCls} /></Field>
      <Field label="Start (UTC)"><input name="startsAt" type="datetime-local" required defaultValue={c?.startsAt.toISOString().slice(0, 16)} className={inputCls} /></Field>
      <Field label="Duration (minutes)"><input name="durationMin" type="number" min={10} max={600} required defaultValue={c?.durationMin ?? 90} className={inputCls} /></Field>
      <Field label="Problem slugs" hint="Comma separated, in order"><input name="problems" required defaultValue={c?.problems} className={inputCls} /></Field>
      <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="published" defaultChecked={c?.published} /> Published</label>
      <Button type="submit">{c ? "Save contest" : "Create contest"}</Button>
    </form>
  );
}
