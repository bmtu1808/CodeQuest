import { cn } from "@/lib/cn";

export function ProgressBar({
  value,
  className,
  color = "bg-brand",
  label,
}: {
  /** 0..1 */
  value: number;
  className?: string;
  color?: string;
  label?: string;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={label}
      className={cn("h-4 w-full overflow-hidden rounded-full bg-surface-2", className)}
    >
      <div className={cn("relative h-full rounded-full transition-[width] duration-500 ease-out", color)} style={{ width: `${pct}%` }}>
        <div className="absolute inset-x-2 top-1 h-1 rounded-full bg-white/30" />
      </div>
    </div>
  );
}
