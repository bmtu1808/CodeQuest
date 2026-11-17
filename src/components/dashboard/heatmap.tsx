import { cn } from "@/lib/cn";
import type { DayActivity } from "@/server/services/snapshot";

const level = (xp: number) => (xp === 0 ? 0 : xp < 20 ? 1 : xp < 40 ? 2 : xp < 80 ? 3 : 4);
const COLORS = ["bg-surface-2", "bg-brand/30", "bg-brand/55", "bg-brand/80", "bg-brand"];

/** GitHub-style calendar: columns are weeks (Mon..Sun rows). `days` must be consecutive, oldest first. */
export function Heatmap({ days }: { days: DayActivity[] }) {
  const weekday = (d: string) => (new Date(`${d}T12:00:00Z`).getUTCDay() + 6) % 7; // Mon=0
  const lead = days.length ? weekday(days[0]!.day) : 0;
  const cells: Array<DayActivity | null> = [...Array(lead).fill(null), ...days];
  const weeks: Array<Array<DayActivity | null>> = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const active = days.filter((d) => d.xp > 0).length;
  return (
    <figure>
      <div className="flex gap-1 overflow-x-auto pb-2" role="img" aria-label={`Activity calendar: ${active} active days in the last ${days.length} days`}>
        {weeks.map((w, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {Array.from({ length: 7 }, (_, di) => {
              const d = w[di];
              return d === undefined || d === null ? (
                <span key={di} className="size-4 rounded-[5px]" />
              ) : (
                <span key={di} title={`${d.day}: ${d.xp} XP`} className={cn("size-4 rounded-[5px]", COLORS[level(d.xp)])} />
              );
            })}
          </div>
        ))}
      </div>
      <figcaption className="mt-1 flex items-center gap-1.5 text-xs text-muted">
        Less {COLORS.map((c) => <span key={c} className={cn("size-3 rounded-[4px]", c)} />)} More
      </figcaption>
    </figure>
  );
}
