import { cn } from "@/lib/cn";

const short = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** Column chart over days. Server-rendered, with a text alternative for screen readers. */
export function DayBars({ data, label, unit, color = "bg-brand" }: { data: Array<{ day: string; value: number }>; label: string; unit: string; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <figure>
      <div className="flex h-36 items-end gap-[3px]" role="img" aria-label={`${label}: ${total} ${unit} in the last ${data.length} days. ${data.filter((d) => d.value > 0).map((d) => `${short(d.day)} ${d.value}`).join(", ")}`}>
        {data.map((d) => (
          <div key={d.day} title={`${short(d.day)}: ${d.value} ${unit}`} className={cn("flex-1 rounded-t-sm", d.value > 0 ? color : "bg-surface-2")} style={{ height: `${d.value > 0 ? Math.max(8, (d.value / max) * 100) : 4}%` }} />
        ))}
      </div>
      <figcaption className="mt-2 flex justify-between text-[11px] font-bold text-muted">
        <span>{short(data[0]!.day)}</span>
        <span>{short(data[data.length - 1]!.day)}</span>
      </figcaption>
    </figure>
  );
}

/** Horizontal bars for a distribution. */
export function HBars({ data, color = "bg-sky", empty }: { data: Array<{ label: string; value: number }>; color?: string; empty: string }) {
  const rows = data.filter((d) => d.value > 0);
  if (rows.length === 0) return <p className="text-sm text-muted">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((r) => (
        <li key={r.label} className="flex items-center gap-3 text-sm">
          <span className="w-28 shrink-0 truncate font-bold">{r.label}</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div className={cn("h-full rounded-full", color)} style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
          <span className="w-6 text-right font-extrabold">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}

export function MasteryBar({ value, label, note }: { value: number; label: string; note?: string }) {
  const tone = value >= 75 ? "bg-brand" : value >= 60 ? "bg-gold" : "bg-danger";
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className="w-32 shrink-0 truncate font-bold" title={label}>
        {label}
      </span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-label={`${label} mastery`} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${value}%` }} />
      </div>
      <span className="w-10 text-right font-extrabold">{value}%</span>
      {note && <span className="hidden w-24 text-xs text-muted sm:block">{note}</span>}
    </li>
  );
}
