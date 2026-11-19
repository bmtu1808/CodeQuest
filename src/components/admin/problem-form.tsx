import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { saveProblemAction } from "@/features/admin/actions";
import type { Problem } from "@/server/db/schema";
import { Field, inputCls } from "./ui";

export function ProblemForm({ p }: { p?: Problem }) {
  const sample = p?.samples[0];
  return (
    <Card>
      <form action={saveProblemAction} className="grid gap-3">
        {p && <input type="hidden" name="id" value={p.id} />}
        <Field label="Title"><input name="title" required defaultValue={p?.title} className={inputCls} /></Field>
        <Field label="Statement"><textarea name="statement" required rows={6} defaultValue={p?.statement} className={inputCls} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Input format"><textarea name="inputFormat" required rows={3} defaultValue={p?.inputFormat} className={inputCls} /></Field>
          <Field label="Output format"><textarea name="outputFormat" required rows={3} defaultValue={p?.outputFormat} className={inputCls} /></Field>
        </div>
        <Field label="Constraints"><textarea name="constraints" required rows={2} defaultValue={p?.constraints} className={inputCls} /></Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Difficulty"><select name="difficulty" defaultValue={p?.difficulty ?? "easy"} className={inputCls}>{["newbie", "easy", "medium", "hard", "expert"].map((d) => <option key={d}>{d}</option>)}</select></Field>
          <Field label="Rating"><input name="rating" type="number" defaultValue={p?.rating ?? 1000} className={inputCls} /></Field>
          <Field label="Estimated minutes"><input name="estimatedMinutes" type="number" defaultValue={p?.estimatedMinutes ?? 15} className={inputCls} /></Field>
          <Field label="Time limit (ms)"><input name="timeLimitMs" type="number" defaultValue={p?.timeLimitMs ?? 1000} className={inputCls} /></Field>
          <Field label="Memory limit (MB)"><input name="memoryLimitMb" type="number" defaultValue={p?.memoryLimitMb ?? 256} className={inputCls} /></Field>
          <Field label="Tags" hint="Comma separated"><input name="tags" defaultValue={p?.tags.join(", ")} className={inputCls} /></Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Sample input"><textarea name="sampleInput" required rows={3} defaultValue={sample?.input} className={`${inputCls} font-mono`} /></Field>
          <Field label="Sample output"><textarea name="sampleOutput" required rows={3} defaultValue={sample?.output} className={`${inputCls} font-mono`} /></Field>
        </div>
        {[1, 2, 3].map((n) => (
          <Field key={n} label={`Hint ${n}`} hint={n === 1 ? "Revealed one at a time, from a nudge to almost the answer." : undefined}><input name={`hint${n}`} required defaultValue={p?.hints[n - 1]} className={inputCls} /></Field>
        ))}
        <Field label="Editorial (shown after solving)"><textarea name="editorial" required rows={4} defaultValue={p?.editorial} className={inputCls} /></Field>
        <Field label="Reference solution C++ (shown after solving)"><textarea name="referenceSolution" required rows={8} defaultValue={p?.referenceSolution} className={`${inputCls} font-mono`} /></Field>
        <Button type="submit">{p ? "Save problem" : "Create problem (as draft)"}</Button>
      </form>
    </Card>
  );
}
