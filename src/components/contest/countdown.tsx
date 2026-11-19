"use client";

import { useSyncExternalStore } from "react";

const subscribe = (cb: () => void) => {
  const id = setInterval(cb, 1000);
  return () => clearInterval(id);
};
const now = () => Math.floor(Date.now() / 1000);

export function formatRemaining(sec: number): string {
  const s = Math.max(0, sec);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const hms = [h, m, ss].map((n) => String(n).padStart(2, "0")).join(":");
  return d > 0 ? `${d}d ${hms}` : hms;
}

/** Live countdown. Server render shows a placeholder so there is no hydration mismatch. */
export function Countdown({ target, doneText = "now" }: { target: string; doneText?: string }) {
  const t = useSyncExternalStore(subscribe, now, () => null);
  if (t === null) return <span suppressHydrationWarning>--:--:--</span>;
  const left = Math.floor(new Date(target).getTime() / 1000) - t;
  return <span className="tabular-nums">{left <= 0 ? doneText : formatRemaining(left)}</span>;
}
