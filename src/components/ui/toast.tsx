"use client";

import { useEffect } from "react";

export function Toast({ message, onDone, tone = "error" }: { message: string | null; onDone: () => void; tone?: "error" | "success" }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [message, onDone]);
  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-4 top-4 z-50 mx-auto max-w-md animate-pop rounded-2xl px-4 py-3 text-center font-bold text-white shadow-lg ${tone === "error" ? "bg-danger" : "bg-brand"}`}
    >
      {message}
    </div>
  );
}
