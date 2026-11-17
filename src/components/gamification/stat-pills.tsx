import { Flame, Zap } from "lucide-react";
import { cn } from "@/lib/cn";

export function StreakCounter({ value, atRisk, className }: { value: number; atRisk?: boolean; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 font-extrabold", value > 0 ? "text-tangerine" : "text-muted", className)}
      title={atRisk ? "Practise today to keep your streak!" : `${value}-day streak`}
      aria-label={`${value} day streak`}
    >
      <Flame size={22} fill={value > 0 ? "currentColor" : "none"} />
      {value}
    </span>
  );
}

export function XpCounter({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-extrabold text-gold-dark dark:text-gold", className)} aria-label={`${value} XP`}>
      <Zap size={22} fill="currentColor" />
      {value.toLocaleString("en-US")}
    </span>
  );
}
