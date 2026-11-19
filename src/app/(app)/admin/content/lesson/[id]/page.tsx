import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LessonForm } from "@/components/admin/lesson-form";
import { DeleteQuestion, QuestionEditor } from "@/components/admin/question-editor";
import { Notice } from "@/components/admin/ui";
import { Card } from "@/components/ui/card";
import { questionToForm } from "@/features/admin/question-form";
import { requireRole } from "@/server/auth/session";
import { getDb, schema } from "@/server/db/client";
import { listQuestions } from "@/server/services/admin";
import { eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Admin · Lesson" };

export default async function LessonAdmin({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const me = await requireRole("admin", "content_editor");
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [lesson] = await getDb().select().from(schema.lessons).where(eq(schema.lessons.id, id));
  if (!lesson || lesson.deletedAt) notFound();
  const questions = await listQuestions(me, id);
  return (
    <div className="flex flex-col gap-5">
      <Link href="/admin/content" className="text-xs font-extrabold uppercase text-sky hover:underline">Curriculum</Link>
      <h1 className="text-3xl font-black">{lesson.title}</h1>
      <Notice error={sp.error} saved={sp.saved} />
      <LessonForm unitId={lesson.unitId} lesson={lesson} />
      <h2 className="text-2xl font-black">Questions ({questions.length})</h2>
      <p className="text-sm text-muted">Every save is checked: the stored answer must grade as correct, and the data sent to learners never contains the answer. A lesson needs at least one question to be playable.</p>
      {questions.map((q, i) => (
        <Card key={q.id}>
          <details>
            <summary className="cursor-pointer font-bold">{i + 1}. [{q.type}] {q.prompt.slice(0, 90)}</summary>
            <div className="mt-3 flex flex-col gap-3">
              <QuestionEditor lessonId={id} id={q.id} value={questionToForm(q)} />
              <DeleteQuestion lessonId={id} id={q.id} />
            </div>
          </details>
        </Card>
      ))}
      <Card>
        <h3 className="mb-3 text-lg font-black">Add a question</h3>
        <QuestionEditor lessonId={id} />
      </Card>
    </div>
  );
}
