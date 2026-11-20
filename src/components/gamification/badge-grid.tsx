import { Lock } from "lucide-react";
import { DynamicIcon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

export type Medal = { key: string; title: string; description: string; icon: string; earned: boolean; times?: number; note?: string };

/** Duolingo-style round medals: coloured when collected, greyed with a lock when not. */
export function MedalGrid({ medals, tone = "grape", className }: { medals: Medal[]; tone?: "grape" | "gold"; className?: string }) {
  const on = tone === "gold" ? "bg-gold border-gold-dark" : "bg-grape border-grape-dark";
  return (
    <ul className={cn("grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5", className)}>
      {medals.map((m, i) => (
        <li
          key={m.key}
          title={`${m.title}: ${m.description}`}
          style={{ animationDelay: `${Math.min(i, 14) * 50}ms` }}
          className="group flex animate-pop flex-col items-center text-center [animation-fill-mode:backwards]"
        >
          <span className="relative">
            <span
              className={cn(
                "grid size-16 place-items-center rounded-full border-b-[6px] text-white transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-110",
                m.earned ? on : "border-line bg-surface-2 text-muted",
              )}
            >
              {m.earned ? <DynamicIcon name={m.icon} size={30} /> : <Lock size={22} />}
            </span>
            {m.earned && (m.times ?? 0) > 1 && (
              <span className="absolute -right-1 -top-1 rounded-full bg-sky px-1.5 text-[11px] font-black text-white">×{m.times}</span>
            )}
          </span>
          <span className={cn("mt-2 text-xs font-extrabold leading-tight", !m.earned && "text-muted")}>{m.title}</span>
          {m.note && <span className="text-[10px] font-bold text-muted">{m.note}</span>}
        </li>
      ))}
    </ul>
  );
}
