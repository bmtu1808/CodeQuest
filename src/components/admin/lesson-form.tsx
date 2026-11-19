import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { saveLessonAction } from "@/features/admin/actions";
import type { LessonContent } from "@/server/db/schema";
import { Field, inputCls } from "./ui";

type Lesson = { id: string; title: string; summary: string; content: LessonContent; xpReward: number; published: boolean };

export function LessonForm({ unitId, lesson }: { unitId: string; lesson?: Lesson }) {
  const c = lesson?.content;
  return (
    <Card>
      <form action={saveLessonAction} className="grid gap-3">
        {lesson && <input type="hidden" name="id" value={lesson.id} />}
        <input type="hidden" name="unitId" value={unitId} />
        <Field label="Title"><input name="title" required defaultValue={lesson?.title} className={inputCls} /></Field>
        <Field label="Summary (shown on the path)"><input name="summary" defaultValue={lesson?.summary} className={inputCls} /></Field>
        <Field label="Concept (one sentence)"><input name="concept" required defaultValue={c?.concept} className={inputCls} /></Field>
        <Field label="Explanation" hint="Separate paragraphs with a blank line."><textarea name="explanation" required rows={6} defaultValue={c?.explanation.join("\n\n")} className={inputCls} /></Field>
        <Field label="Syntax (optional)"><textarea name="syntax" rows={2} defaultValue={c?.syntax} className={`${inputCls} font-mono`} /></Field>
        <Field label="Example code (optional)"><textarea name="exampleCode" rows={5} defaultValue={c?.example?.code} className={`${inputCls} font-mono`} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Example output"><textarea name="exampleOutput" rows={2} defaultValue={c?.example?.output} className={`${inputCls} font-mono`} /></Field>
          <Field label="Example note"><input name="exampleNote" defaultValue={c?.example?.note} className={inputCls} /></Field>
        </div>
        <Field label="Common mistakes" hint="One per line."><textarea name="mistakes" rows={3} defaultValue={c?.commonMistakes?.join("\n")} className={inputCls} /></Field>
        <div className="flex flex-wrap items-center gap-4">
          <Field label="XP reward"><input name="xpReward" type="number" min={0} max={500} defaultValue={lesson?.xpReward ?? 20} className={`${inputCls} w-28`} /></Field>
          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="published" defaultChecked={lesson?.published ?? false} /> Published</label>
        </div>
        <Button type="submit">{lesson ? "Save lesson" : "Create lesson"}</Button>
      </form>
    </Card>
  );
}
