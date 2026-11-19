import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProblemForm } from "@/components/admin/problem-form";
import { Field, inputCls, Notice } from "@/components/admin/ui";
import { addTestsAction, deleteTestAction, publishProblemAction } from "@/features/admin/actions";
import { requireRole } from "@/server/auth/session";
import { getDb, schema } from "@/server/db/client";
import { listTestCases } from "@/server/services/admin";

export const metadata: Metadata = { title: "Admin · Problem" };

export default async function ProblemAdmin({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const me = await requireRole("admin", "content_editor");
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [p] = await getDb().select().from(schema.problems).where(eq(schema.problems.id, id));
  if (!p || p.deletedAt) notFound();
  const tests = await listTestCases(me, id);
  const hidden = tests.filter((t) => !t.isSample).length;
  return (
    <div className="flex flex-col gap-5">
      <Link href="/admin/problems" className="text-xs font-extrabold uppercase text-sky hover:underline">Problems</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black">{p.title}</h1>
        <form action={publishProblemAction} className="flex items-center gap-3">
          <input type="hidden" name="id" value={p.id} />
          <span className="text-sm font-bold">{p.published ? "Published" : "Draft"}</span>
          <Button type="submit" name="publish" value={p.published ? "0" : "1"} variant={p.published ? "outline" : "primary"}>{p.published ? "Unpublish" : "Publish"}</Button>
        </form>
      </div>
      <Notice error={sp.error} saved={sp.saved} />
      <ProblemForm p={p} />
      <Card>
        <h2 className="text-lg font-black">Test cases ({hidden} hidden)</h2>
        <p className="text-xs text-muted">Hidden tests never leave the server. Only a short preview is shown here.</p>
        <ul className="mt-2 divide-y-2 divide-line text-sm">
          {tests.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-2 py-2">
              <span><b>#{t.position}</b> {t.isSample ? "sample" : "hidden"} · input {t.inputBytes} B · output {t.outputBytes} B · <code className="text-xs text-muted">{t.inputPreview.replace(/\s+/g, " ")}</code></span>
              <form action={deleteTestAction}>
                <input type="hidden" name="id" value={t.id} />
                <input type="hidden" name="problemId" value={p.id} />
                <Button type="submit" size="sm" variant="outline">Delete</Button>
              </form>
            </li>
          ))}
        </ul>
        <form action={addTestsAction} encType="multipart/form-data" className="mt-4 grid gap-3 border-t-2 border-line pt-4">
          <input type="hidden" name="id" value={p.id} />
          <Field label="Upload files" hint="Pairs named 1.in / 1.out (or .ans). Each file up to 1 MB."><input type="file" name="files" multiple accept=".in,.out,.ans,.txt" className={inputCls} /></Field>
          <Field label="Or paste" hint="Input, a line with ===, then expected output. Separate cases with a line containing ---."><textarea name="pasted" rows={6} className={`${inputCls} font-mono`} placeholder={"1 2\n===\n3\n---\n10 20\n===\n30"} /></Field>
          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="replace" /> Replace the existing hidden tests</label>
          <Button type="submit">Add test cases</Button>
        </form>
      </Card>
    </div>
  );
}
