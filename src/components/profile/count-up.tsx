"use client";
import { useEffect, useRef } from "react";

/** Counts from 0 to `value` once on mount. The final value is rendered by default (SSR, reduced motion). */
export function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || value <= 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const start = performance.now();
    el.textContent = "0";
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      el.textContent = Math.round(value * (1 - Math.pow(1 - k, 3))).toLocaleString("en-US");
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.textContent = value.toLocaleString("en-US");
    };
  }, [value, duration]);
  return <span ref={ref}>{value.toLocaleString("en-US")}</span>;
}
