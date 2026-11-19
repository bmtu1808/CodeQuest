import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, inputCls, Notice } from "@/components/admin/ui";
import { nodeAction, saveUnitAction, saveWorldAction } from "@/features/admin/actions";
import { requireRole } from "@/server/auth/session";
import { listCurriculum } from "@/server/services/admin";

export const metadata: Metadata = { title: "Admin · Curriculum" };

function NodeButtons({ kind, id, published }: { kind: string; id: string; published: boolean }) {
  const b = (op: string, label: string) => (
    <form action={nodeAction} key={op}>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" variant="outline" name="op" value={op}>{label}</Button>
    </form>
  );
  return <div className="flex flex-wrap gap-1">{b("up", "Up")}{b("down", "Down")}{b(published ? "unpublish" : "publish", published ? "Unpublish" : "Publish")}{b("delete", "Delete")}</div>;
}

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const sp = await searchParams;
  const me = await requireRole("admin", "content_editor");
  const tree = await listCurriculum(me);
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-black">Curriculum</h1>
      <p className="text-sm text-muted">Edited items are locked: <code>npm run db:seed</code> will not overwrite them. Deleting hides an item but keeps learner progress.</p>
      <Notice error={sp.error} saved={sp.saved} />
      {tree.map((w) => (
        <Card key={w.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-black">{w.title} {!w.published && <span className="text-xs font-bold text-muted">(draft)</span>}{w.locked && <span className="ml-2 text-xs font-bold text-sky">edited</span>}</h2>
            <NodeButtons kind="world" id={w.id} published={w.published} />
          </div>
          <details className="mt-2"><summary className="cursor-pointer text-xs font-extrabold uppercase text-sky">Edit world</summary>
            <form action={saveWorldAction} className="mt-2 grid gap-2 sm:grid-cols-2">
              <input type="hidden" name="id" value={w.id} />
              <Field label="Title"><input name="title" defaultValue={w.title} required className={inputCls} /></Field>
              <Field label="Icon (Lucide name)"><input name="icon" defaultValue={w.icon} className={inputCls} /></Field>
              <Field label="Color"><input name="color" defaultValue={w.color} className={inputCls} /></Field>
              <Field label="Description"><input name="description" defaultValue={w.description} className={inputCls} /></Field>
              <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="published" defaultChecked={w.published} /> Published</label>
              <Button type="submit">Save world</Button>
            </form>
          </details>
          <div className="mt-3 flex flex-col gap-3">
            {w.units.map((u) => (
              <div key={u.id} className="rounded-xl border-2 border-line p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-extrabold">{u.title} {!u.published && <span className="text-xs font-bold text-muted">(draft)</span>}</h3>
                  <NodeButtons kind="unit" id={u.id} published={u.published} />
                </div>
                <details className="mt-1"><summary className="cursor-pointer text-xs font-extrabold uppercase text-sky">Edit unit</summary>
                  <form action={saveUnitAction} className="mt-2 grid gap-2 sm:grid-cols-2">
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="worldId" value={w.id} />
                    <Field label="Title"><input name="title" defaultValue={u.title} required className={inputCls} /></Field>
                    <Field label="Icon"><input name="icon" defaultValue={u.icon} className={inputCls} /></Field>
                    <Field label="Description"><input name="description" defaultValue={u.description} className={inputCls} /></Field>
                    <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="published" defaultChecked={u.published} /> Published</label>
                    <Button type="submit">Save unit</Button>
                  </form>
                </details>
                <ul className="mt-2 divide-y-2 divide-line">
                  {u.lessons.map((l) => (
                    <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <Link href={`/admin/content/lesson/${l.id}`} className="font-bold hover:underline">{l.title} <span className="text-xs font-normal text-muted">{l.questions} questions{l.published ? "" : " · draft"}</span></Link>
                      <NodeButtons kind="lesson" id={l.id} published={l.published} />
                    </li>
                  ))}
                </ul>
                <Link href={`/admin/content/lesson/new?unit=${u.id}`} className="mt-2 inline-block text-xs font-extrabold uppercase text-sky hover:underline">+ Add lesson</Link>
              </div>
            ))}
          </div>
          <details className="mt-3"><summary className="cursor-pointer text-xs font-extrabold uppercase text-sky">+ Add unit</summary>
            <form action={saveUnitAction} className="mt-2 grid gap-2 sm:grid-cols-2">
              <input type="hidden" name="worldId" value={w.id} />
              <Field label="Title"><input name="title" required className={inputCls} /></Field>
              <Field label="Icon"><input name="icon" defaultValue="BookOpen" className={inputCls} /></Field>
              <Field label="Description"><input name="description" className={inputCls} /></Field>
              <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="published" /> Published</label>
              <Button type="submit">Create unit</Button>
            </form>
          </details>
        </Card>
      ))}
      <Card>
        <h2 className="text-lg font-black">Add world</h2>
        <form action={saveWorldAction} className="mt-2 grid gap-2 sm:grid-cols-2">
          <Field label="Title"><input name="title" required className={inputCls} /></Field>
          <Field label="Icon (Lucide name)"><input name="icon" defaultValue="Rocket" className={inputCls} /></Field>
          <Field label="Color"><input name="color" defaultValue="#58CC02" className={inputCls} /></Field>
          <Field label="Description"><input name="description" className={inputCls} /></Field>
          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="published" /> Published</label>
          <Button type="submit">Create world</Button>
        </form>
      </Card>
    </div>
  );
}
