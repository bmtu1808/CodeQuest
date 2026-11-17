import { cn } from "@/lib/cn";
import type { DayActivity } from "@/server/services/snapshot";

const dayName = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });

export function WeekChart({ days, today }: { days: DayActivity[]; today: string }) {
  const max = Math.max(20, ...days.map((d) => d.xp));
  return (
    <figure>
      <div className="flex h-32 items-end gap-2" role="img" aria-label={`XP earned in the last 7 days: ${days.map((d) => `${dayName(d.day)} ${d.xp}`).join(", ")}`}>
        {days.map((d) => (
          <div key={d.day} className="flex flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-[11px] font-bold text-muted">{d.xp || ""}</span>
            <div
              className={cn("w-full rounded-t-lg transition-all", d.xp > 0 ? "bg-brand" : "bg-surface-2", d.day === today && d.xp === 0 && "border-2 border-dashed border-line bg-transparent")}
              style={{ height: `${Math.max(6, (d.xp / max) * 84)}px` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        {days.map((d) => (
          <span key={d.day} className={cn("flex-1 text-center text-[11px] font-bold uppercase", d.day === today ? "text-sky" : "text-muted")}>
            {dayName(d.day)}
          </span>
        ))}
      </div>
    </figure>
  );
}
