"use client";

import { Check, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Toast } from "@/components/ui/toast";
import type { QuestionResponse } from "@/features/learning/grader";
import type { PublicQuestion } from "@/features/learning/types";
import { QuestionView } from "./question-views";

type Result = { passed: boolean; score: number; total: number; needed: number; retryAt: string | null; review: Array<{ questionId: string; correct: boolean; explanation: string | null; correctAnswer: string | null }> };

export function SkipTest({ unitId, unitTitle, questions: count, needed, passPercent, cooldownMin }: { unitId: string; unitTitle: string; questions: number; needed: number; passPercent: number; cooldownMin: number }) {
  const [phase, setPhase] = useState<"intro" | "test" | "result">("intro");
  const [attemptId, setAttemptId] = useState("");
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, QuestionResponse>>({});
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clearError = useCallback(() => setError(null), []);

  async function call<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = (await res.json()) as T & { error?: string };
    if (!res.ok) throw new Error(data.error ?? "Something went wrong");
    return data;
  }

  async function start() {
    setBusy(true);
    try {
      const d = await call<{ attemptId: string; questions: PublicQuestion[] }>("/api/skip/start", { unitId });
      setAttemptId(d.attemptId);
      setQuestions(d.questions);
      setAnswers({});
      setIndex(0);
      setPhase("test");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the test");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    setBusy(true);
    try {
      setResult(await call<Result>("/api/skip/submit", { attemptId, answers }));
      setPhase("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit the test");
    } finally {
      setBusy(false);
    }
  }

  if (phase === "intro") {
    return (
      <Card className="mt-6 p-6">
        <Toast message={error} onDone={clearError} />
        <p>Answer {count} questions taken from {unitTitle}. You need {needed} correct ({passPercent}%) to pass.</p>
        <ul className="mt-3 list-disc pl-5 text-sm text-muted">
          <li>Passing counts every lesson of the unit as done and opens the next unit.</li>
          <li>It costs no hearts and earns no XP. Replaying a lesson later still earns its XP once.</li>
          <li>You see the right answers only after you pass. If you fail, you can retry after {cooldownMin} minutes.</li>
        </ul>
        <Button type="button" size="lg" className="mt-5" onClick={start} disabled={busy}>
          {busy ? "Starting..." : "Start the test"}
        </Button>
      </Card>
    );
  }

  if (phase === "result" && result) {
    return (
      <div className="mt-6 flex flex-col gap-4">
        <Card className={result.passed ? "border-brand/50 bg-brand/10 p-6 text-center" : "border-danger/40 bg-danger/10 p-6 text-center"}>
          <h2 className="text-2xl font-black">{result.passed ? "You passed. Unit skipped." : "Not this time"}</h2>
          <p className="mt-1 font-bold">{result.score} of {result.total} correct (needed {result.needed})</p>
          {!result.passed && result.retryAt && <p className="mt-1 text-sm text-muted">Study the unit and try again after {new Date(result.retryAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}.</p>}
        </Card>
        <Card>
          <ol className="divide-y-2 divide-line">
            {result.review.map((r, i) => {
              const q = questions.find((x) => x.id === r.questionId);
              return (
                <li key={r.questionId} className="py-3">
                  <p className="flex items-start gap-2 font-bold">
                    {r.correct ? <Check className="mt-0.5 shrink-0 text-brand" size={18} /> : <X className="mt-0.5 shrink-0 text-danger" size={18} />}
                    <span>{i + 1}. {q?.prompt}</span>
                  </p>
                  {r.explanation && <p className="ml-6 mt-1 text-sm text-muted">{r.explanation}</p>}
                </li>
              );
            })}
          </ol>
        </Card>
        {result.passed ? <ButtonLink href="/learn" size="lg">Continue on the path</ButtonLink> : <Link href="/learn" className="text-center font-extrabold uppercase text-sky hover:underline">Back to the path</Link>}
      </div>
    );
  }

  const q = questions[index];
  if (!q) return null;
  const last = index === questions.length - 1;
  const value = answers[q.id] ?? null;
  return (
    <div className="mt-6 flex flex-col gap-6 pb-32">
      <Toast message={error} onDone={clearError} />
      <div className="flex items-center gap-4">
        <ProgressBar value={index / questions.length} label="Test progress" />
        <span className="whitespace-nowrap text-sm font-extrabold text-muted">{index + 1}/{questions.length}</span>
      </div>
      <QuestionView key={q.id} q={q} value={value} onChange={(v) =>
          setAnswers((a) => {
            const next = { ...a };
            if (v) next[q.id] = v;
            else delete next[q.id];
            return next;
          })
        } verdict={null} />
      <footer className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-line bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 lg:pl-72">
        <div className="mx-auto flex max-w-3xl justify-between gap-3">
          <Button type="button" variant="outline" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>Back</Button>
          {last ? (
            <Button type="button" disabled={busy || Object.keys(answers).length < questions.length} onClick={submit}>{busy ? "Submitting..." : "Submit test"}</Button>
          ) : (
            <Button type="button" disabled={!value} onClick={() => setIndex((i) => i + 1)}>Next</Button>
          )}
        </div>
      </footer>
    </div>
  );
}
