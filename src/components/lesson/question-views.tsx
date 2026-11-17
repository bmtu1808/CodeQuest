"use client";

import { useState } from "react";
import type { QuestionResponse } from "@/features/learning/grader";
import type { PublicQuestion } from "@/features/learning/types";
import { cn } from "@/lib/cn";
import { CodeBlock } from "./code-block";

export type Verdict = { correct: boolean; correctAnswer: string } | null;

type Props = {
  q: PublicQuestion;
  value: QuestionResponse | null;
  onChange: (v: QuestionResponse | null) => void;
  verdict: Verdict;
};

const opts = (q: PublicQuestion) => (q.data.options as string[] | undefined) ?? [];

function OptionList({ q, value, onChange, verdict }: Props) {
  const selected = value && "index" in value ? value.index : null;
  const options = opts(q);
  return (
    <div role="radiogroup" aria-label="Answer options" className="flex flex-col gap-3">
      {options.map((text, i) => {
        const isSel = selected === i;
        const isCorrectOpt = verdict && text === verdict.correctAnswer;
        const isWrongSel = verdict && isSel && !verdict.correct;
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={isSel}
            disabled={!!verdict}
            onClick={() => onChange({ index: i })}
            className={cn(
              "flex items-center gap-4 rounded-2xl border-2 border-b-4 px-4 py-3.5 text-left font-mono text-[15px] font-semibold transition active:translate-y-[2px]",
              !verdict && (isSel ? "border-sky bg-sky/10 text-sky" : "border-line bg-surface hover:bg-surface-2"),
              verdict && isCorrectOpt && "border-brand bg-brand/15 text-brand-dark dark:text-brand",
              isWrongSel && "animate-shake border-danger bg-danger/10 text-danger",
              verdict && !isCorrectOpt && !isWrongSel && "border-line opacity-60",
            )}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg border-2 border-current/40 font-sans text-sm font-extrabold">{i + 1}</span>
            <span className="whitespace-pre-wrap">{text}</span>
          </button>
        );
      })}
    </div>
  );
}

function FillBlank({ q, value, onChange, verdict }: Props) {
  const text = value && "text" in value ? value.text : "";
  const bank = (q.data.bank as string[] | undefined) ?? [];
  const [before = "", after = ""] = (q.code ?? "").split("___");
  return (
    <div className="flex flex-col gap-4">
      <pre className="overflow-x-auto rounded-2xl border-2 border-line bg-code p-4 font-mono text-[13px] leading-relaxed sm:text-sm">
        <code>
          {before}
          <input
            aria-label="Your answer"
            value={text}
            disabled={!!verdict}
            maxLength={60}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            onChange={(e) => onChange(e.target.value.trim() ? { text: e.target.value } : null)}
            style={{ width: `${Math.max(6, text.length + 2)}ch` }}
            className={cn(
              "mx-1 rounded-md border-b-2 bg-surface px-1 py-0.5 text-center font-mono outline-none",
              verdict ? (verdict.correct ? "border-brand text-brand-dark dark:text-brand" : "border-danger text-danger") : "border-sky focus:bg-sky/10",
            )}
          />
          {after}
        </code>
      </pre>
      {bank.length > 0 && !verdict && (
        <div className="flex flex-wrap gap-2" aria-label="Word bank">
          {bank.map((w) => (
            <button key={w} type="button" onClick={() => onChange({ text: w })} className="rounded-xl border-2 border-b-4 border-line bg-surface px-3 py-1.5 font-mono text-sm font-bold hover:bg-surface-2 active:translate-y-[2px]">
              {w}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ArrangeCode({ q, value, onChange, verdict }: Props) {
  const lines = (q.data.lines as string[]) ?? [];
  const chosen = value && "order" in value ? value.order : [];
  const remaining = lines.map((_, i) => i).filter((i) => !chosen.includes(i));
  const set = (next: number[]) => onChange(next.length ? { order: next } : null);
  return (
    <div className="flex flex-col gap-4">
      <div aria-label="Your arrangement" className="min-h-28 rounded-2xl border-2 border-dashed border-line bg-code p-3">
        {chosen.length === 0 && <p className="p-2 text-sm text-muted">Tap the lines below in the right order.</p>}
        <ol className="flex flex-col gap-2">
          {chosen.map((idx, pos) => (
            <li key={idx}>
              <button
                type="button"
                disabled={!!verdict}
                onClick={() => set(chosen.filter((c) => c !== idx))}
                className="w-full rounded-xl border-2 border-b-4 border-sky bg-sky/10 px-3 py-2 text-left font-mono text-sm font-semibold whitespace-pre"
                aria-label={`Line ${pos + 1}: ${lines[idx]}. Tap to remove`}
              >
                {lines[idx]}
              </button>
            </li>
          ))}
        </ol>
      </div>
      {!verdict && (
        <div className="flex flex-col gap-2">
          {remaining.map((idx) => (
            <button key={idx} type="button" onClick={() => set([...chosen, idx])} className="rounded-xl border-2 border-b-4 border-line bg-surface px-3 py-2 text-left font-mono text-sm font-semibold whitespace-pre hover:bg-surface-2 active:translate-y-[2px]">
              {lines[idx]}
            </button>
          ))}
        </div>
      )}
      {verdict && !verdict.correct && <CodeBlock code={verdict.correctAnswer} label="Correct order" />}
    </div>
  );
}

function MatchConcept({ q, onChange, verdict }: Props) {
  const left = (q.data.left as string[]) ?? [];
  const right = (q.data.right as string[]) ?? [];
  // pairs[i] = index into `right` chosen for left[i], or -1. The component is re-mounted per question.
  const [pairs, setPairs] = useState<number[]>(() => left.map(() => -1));
  const [active, setActive] = useState<number | null>(null);
  const used = new Set(pairs.filter((p) => p >= 0));

  function update(next: number[]) {
    setPairs(next);
    onChange(next.every((v) => v >= 0) ? { pairs: next } : null);
  }
  function pickRight(r: number) {
    if (active === null || verdict) return;
    const next = [...pairs];
    next[active] = r;
    setActive(null);
    update(next);
  }
  function pickLeft(i: number) {
    if (verdict) return;
    if (pairs[i]! >= 0) {
      const next = [...pairs];
      next[i] = -1;
      update(next);
    }
    setActive(i);
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-2">
        {left.map((text, i) => (
          <button
            key={i}
            type="button"
            disabled={!!verdict}
            onClick={() => pickLeft(i)}
            aria-pressed={active === i}
            className={cn(
              "rounded-xl border-2 border-b-4 px-3 py-3 text-left text-sm font-bold transition",
              active === i ? "border-sky bg-sky/10" : pairs[i]! >= 0 ? "border-brand/60 bg-brand/10" : "border-line bg-surface hover:bg-surface-2",
            )}
          >
            {text}
            {pairs[i]! >= 0 && <span className="mt-1 block text-xs font-semibold text-muted">→ {right[pairs[i]!]}</span>}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {right.map((text, r) => (
          <button
            key={r}
            type="button"
            disabled={used.has(r) || !!verdict || active === null}
            onClick={() => pickRight(r)}
            className="rounded-xl border-2 border-b-4 border-line bg-surface px-3 py-3 text-left text-sm font-bold transition enabled:hover:bg-surface-2 disabled:opacity-40"
          >
            {text}
          </button>
        ))}
      </div>
      <p className="col-span-2 text-sm text-muted">Tap a term on the left, then its meaning on the right.</p>
      {verdict && !verdict.correct && <pre className="col-span-2 whitespace-pre-wrap rounded-2xl bg-code p-3 text-sm">{verdict.correctAnswer}</pre>}
    </div>
  );
}

export function QuestionView(props: Props) {
  const { q } = props;
  const showCode = q.code && q.type !== "fill_blank";
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-black sm:text-2xl">{q.prompt}</h1>
      {showCode && <CodeBlock code={q.code!} />}
      {(q.type === "multiple_choice" || q.type === "true_false" || q.type === "predict_output" || q.type === "find_bug") && <OptionList {...props} />}
      {q.type === "fill_blank" && <FillBlank {...props} />}
      {q.type === "arrange_code" && <ArrangeCode {...props} />}
      {q.type === "match_concept" && <MatchConcept {...props} />}
    </div>
  );
}
