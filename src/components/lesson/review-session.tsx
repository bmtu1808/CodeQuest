"use client";

import { Check, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Toast } from "@/components/ui/toast";
import type { QuestionResponse } from "@/features/learning/grader";
import type { PublicQuestion } from "@/features/learning/types";
import { cn } from "@/lib/cn";
import { QuestionView } from "./question-views";

type Feedback = { correct: boolean; correctAnswer: string; explanation: string; intervalDays: number; rewards: Array<{ kind: string; title: string; xp: number }> };

export function ReviewSession({ questions }: { questions: PublicQuestion[] }) {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState<QuestionResponse | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [right, setRight] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clearError = useCallback(() => setError(null), []);
  const current = questions[index];

  async function check() {
    if (!current || !value || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/review/answer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questionId: current.id, response: value }) });
      const data = (await res.json()) as Feedback & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not check your answer");
      setFeedback(data);
      if (data.correct) setRight((r) => r + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not check your answer");
    } finally {
      setBusy(false);
    }
  }

  function next() {
    setFeedback(null);
    setValue(null);
    setIndex((i) => i + 1);
  }

  if (!current) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-3xl font-black">Review done</h1>
        <p className="mt-2 text-muted">
          {right} of {questions.length} correct. Questions you missed come back in about 10 minutes; the ones you got right return after a longer break.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <ButtonLink href="/review" prefetch={false} size="lg">
            Check for more
          </ButtonLink>
          <ButtonLink href="/dashboard" variant="outline" size="lg">
            Back to dashboard
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-40">
      <Toast message={error} onDone={clearError} />
      <div className="flex items-center gap-4">
        <ProgressBar value={index / questions.length} label="Review progress" />
        <span className="whitespace-nowrap text-sm font-extrabold text-muted">
          {index + 1}/{questions.length}
        </span>
      </div>
      <QuestionView key={current.id} q={current} value={value} onChange={setValue} verdict={feedback && { correct: feedback.correct, correctAnswer: feedback.correctAnswer }} />
      <footer className={cn("fixed inset-x-0 bottom-0 z-30 border-t-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 lg:pl-72", feedback ? (feedback.correct ? "border-brand/40 bg-brand/15" : "border-danger/40 bg-danger/15") : "border-line bg-surface")}>
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {feedback && (
            <div role="status" aria-live="polite">
              <p className={cn("flex items-center gap-2 text-lg font-black", feedback.correct ? "text-brand-dark dark:text-brand" : "text-danger")}>
                {feedback.correct ? <Check size={22} /> : <X size={22} />}
                {feedback.correct ? `Correct! See it again in ${feedback.intervalDays} day${feedback.intervalDays === 1 ? "" : "s"}.` : "Not quite. It comes back in about 10 minutes."}
              </p>
              <p className="mt-1 text-sm">{feedback.explanation}</p>
              {feedback.rewards.map((r) => (
                <p key={r.title} className="mt-1 text-sm font-extrabold text-sky">
                  {r.kind === "quest" ? "Quest complete" : "Achievement unlocked"}: {r.title} (+{r.xp} XP)
                </p>
              ))}
            </div>
          )}
          {feedback ? (
            <Button size="lg" onClick={next} className="w-full sm:ml-auto sm:w-56">
              {index + 1 >= questions.length ? "Finish" : "Continue"}
            </Button>
          ) : (
            <Button size="lg" onClick={() => void check()} disabled={!value || busy} className="w-full sm:ml-auto sm:w-56">
              {busy ? "Checking..." : "Check"}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
