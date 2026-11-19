import type { ReactNode } from "react";

export const inputCls = "w-full rounded-xl border-2 border-line bg-surface px-3 py-2 text-sm";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-extrabold">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Notice({ error, saved }: { error?: string; saved?: string }) {
  if (error) return <p role="alert" className="rounded-xl border-2 border-rose/50 bg-rose/10 px-4 py-2 text-sm font-bold">{error}</p>;
  if (saved) return <p role="status" className="rounded-xl border-2 border-brand/50 bg-brand/10 px-4 py-2 text-sm font-bold">Saved.</p>;
  return null;
}

export type AdminSearch = Promise<{ error?: string; saved?: string }>;
