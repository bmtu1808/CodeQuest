import { cn } from "@/lib/cn";
import { DIFFICULTY_LABEL, DIFFICULTY_STYLE } from "./verdict";

export function DifficultyBadge({ difficulty, rating, className }: { difficulty: string; rating?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wide", DIFFICULTY_STYLE[difficulty], className)}>
      {DIFFICULTY_LABEL[difficulty] ?? difficulty}
      {rating ? <span className="font-bold opacity-70">· {rating}</span> : null}
    </span>
  );
}
