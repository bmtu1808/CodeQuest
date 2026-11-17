"use client";

import Link from "next/link";
import { useActionState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/features/auth/schemas";

const subscribeNoop = () => () => {};
function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

type Field = { name: string; label: string; type?: string; autoComplete?: string; placeholder?: string };

export function AuthForm({
  action,
  fields,
  submitLabel,
  withTimezone,
  footer,
}: {
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  fields: Field[];
  submitLabel: string;
  withTimezone?: boolean;
  footer: { text: string; href: string; link: string };
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const tz = useSyncExternalStore(subscribeNoop, browserTimezone, () => "UTC");

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {withTimezone && <input type="hidden" name="timezone" value={tz} />}
      {state.error && (
        <p role="alert" className="rounded-2xl border-2 border-danger/40 bg-danger/10 px-4 py-3 text-sm font-bold text-danger">
          {state.error}
        </p>
      )}
      {fields.map((f) => {
        const err = state.fieldErrors?.[f.name];
        return (
          <label key={f.name} className="flex flex-col gap-1.5 text-sm font-bold">
            {f.label}
            <input
              name={f.name}
              type={f.type ?? "text"}
              defaultValue={state.values?.[f.name] ?? ""}
              autoComplete={f.autoComplete}
              placeholder={f.placeholder}
              aria-invalid={!!err}
              aria-describedby={err ? `${f.name}-err` : undefined}
              required
              className="h-12 rounded-2xl border-2 border-line bg-surface-2 px-4 text-base font-medium outline-none transition focus:border-sky"
            />
            {err && (
              <span id={`${f.name}-err`} className="text-xs font-bold text-danger">
                {err}
              </span>
            )}
          </label>
        );
      })}
      <Button type="submit" size="lg" disabled={pending} className="mt-2 w-full">
        {pending ? "Please wait..." : submitLabel}
      </Button>
      <p className="text-center text-sm text-muted">
        {footer.text}{" "}
        <Link href={footer.href} className="font-extrabold text-sky hover:underline">
          {footer.link}
        </Link>
      </p>
    </form>
  );
}
