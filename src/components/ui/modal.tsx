"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(92vw,26rem)] rounded-3xl border-2 border-line bg-surface p-6 text-fg backdrop:bg-black/50 open:animate-pop"
    >
      <h2 className="mb-3 text-xl font-extrabold">{title}</h2>
      {children}
    </dialog>
  );
}
