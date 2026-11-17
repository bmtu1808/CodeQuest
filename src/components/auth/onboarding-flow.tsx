"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { completeOnboardingAction, skipOnboardingAction } from "@/features/auth/onboarding-actions";
import { ONBOARDING_OPTIONS } from "@/features/learning/recommend";
import { cn } from "@/lib/cn";

const STEPS = [
  { field: "knowsProgramming", title: "Have you written code before?" },
  { field: "knowsCpp", title: "How well do you know C++?" },
  { field: "selfLevel", title: "Which level describes you best?" },
  { field: "goal", title: "What is your goal?" },
  { field: "dailyMinutes", title: "How much time can you learn each day?" },
] as const;

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const current = STEPS[step]!;
  const options = ONBOARDING_OPTIONS[current.field];
  const selected = answers[current.field];
  const last = step === STEPS.length - 1;

  function next() {
    if (!selected) return;
    if (!last) return setStep(step + 1);
    start(async () => {
      const res = await completeOnboardingAction(answers);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 py-6">
      <div className="flex items-center gap-4">
        <ProgressBar value={(step + 1) / STEPS.length} label="Onboarding progress" />
        <form action={skipOnboardingAction}>
          <button type="submit" className="whitespace-nowrap text-sm font-extrabold uppercase tracking-wide text-muted hover:text-fg">
            Skip
          </button>
        </form>
      </div>
      <h1 className="mt-10 text-center text-2xl font-black sm:text-3xl">{current.title}</h1>
      <div role="radiogroup" aria-label={current.title} className="mt-8 flex flex-col gap-3">
        {options.map((o) => {
          const active = selected === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setAnswers({ ...answers, [current.field]: o.value })}
              className={cn(
                "rounded-2xl border-2 border-b-4 px-5 py-4 text-left transition active:translate-y-[2px]",
                active ? "border-sky bg-sky/10" : "border-line bg-surface hover:bg-surface-2",
              )}
            >
              <span className={cn("block text-lg font-extrabold", active && "text-sky")}>{o.label}</span>
              <span className="text-sm text-muted">{o.hint}</span>
            </button>
          );
        })}
      </div>
      {error && <p role="alert" className="mt-4 text-center font-bold text-danger">{error}</p>}
      <div className="mt-auto flex gap-3 pt-8">
        {step > 0 && (
          <Button variant="outline" size="lg" onClick={() => setStep(step - 1)} className="flex-1">
            Back
          </Button>
        )}
        <Button size="lg" onClick={next} disabled={!selected || pending} className="flex-[2]">
          {last ? (pending ? "Building your path..." : "Finish") : "Continue"}
        </Button>
      </div>
    </div>
  );
}
