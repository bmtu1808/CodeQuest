import { Button } from "@/components/ui/button";
import { deleteQuestionAction, saveQuestionAction } from "@/features/admin/actions";
import type { QuestionFormInput } from "@/features/admin/question-form";
import { QUESTION_TYPES } from "@/features/learning/types";
import { Field, inputCls } from "./ui";

/** One form for every type. Fields that do not apply to the chosen type are ignored on the server. */
export function QuestionEditor({ lessonId, id, value }: { lessonId: string; id?: string; value?: QuestionFormInput }) {
  const v = value;
  return (
    <form action={saveQuestionAction} className="grid gap-3">
      <input type="hidden" name="lessonId" value={lessonId} />
      {id && <input type="hidden" name="id" value={id} />}
      <div className="grid gap-3 sm:grid-cols-[1fr_6rem]">
        <Field label="Type">
          <select name="type" defaultValue={v?.type ?? "multiple_choice"} className={inputCls}>
            {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="XP"><input name="xp" type="number" min={0} max={20} defaultValue={v?.xp ?? "2"} className={inputCls} /></Field>
      </div>
      <Field label="Prompt"><textarea name="prompt" required rows={2} defaultValue={v?.prompt} className={inputCls} /></Field>
      <Field label="Code (optional)" hint="For fill_blank, mark the blank as ___"><textarea name="code" rows={3} defaultValue={v?.code} className={`${inputCls} font-mono`} /></Field>
      <Field label="Options / lines / left column" hint="One per line. Choice types: the options. arrange_code: the lines in shuffled order. match_concept: the left column. true_false may stay empty."><textarea name="items" rows={4} defaultValue={v?.items} className={`${inputCls} font-mono`} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Correct option number" hint="Choice types. 1 is the first option."><input name="correct" defaultValue={v?.correct} className={inputCls} /></Field>
        <Field label="Correct order" hint="arrange_code, e.g. 2,1,3 (numbers of the lines above)"><input name="order" defaultValue={v?.order} className={inputCls} /></Field>
        <Field label="Right column" hint="match_concept, one per line"><textarea name="right" rows={3} defaultValue={v?.right} className={inputCls} /></Field>
        <Field label="Pairs" hint="match_concept: for each left row, the number of its right item, e.g. 2,1,3"><input name="pairs" defaultValue={v?.pairs} className={inputCls} /></Field>
        <Field label="Accepted answers" hint="fill_blank, one per line"><textarea name="accepted" rows={3} defaultValue={v?.accepted} className={`${inputCls} font-mono`} /></Field>
        <Field label="Word bank (optional)" hint="fill_blank, one per line"><textarea name="bank" rows={3} defaultValue={v?.bank} className={`${inputCls} font-mono`} /></Field>
      </div>
      <Field label="Explanation (shown after answering)"><textarea name="explanation" required rows={2} defaultValue={v?.explanation} className={inputCls} /></Field>
      <Button type="submit">{id ? "Save question" : "Add question"}</Button>
    </form>
  );
}

export function DeleteQuestion({ lessonId, id }: { lessonId: string; id: string }) {
  return (
    <form action={deleteQuestionAction}>
      <input type="hidden" name="lessonId" value={lessonId} />
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" variant="outline">Delete</Button>
    </form>
  );
}
