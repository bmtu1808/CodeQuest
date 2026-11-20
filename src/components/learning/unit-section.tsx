import { CheckCircle2, ExternalLink, FastForward } from "lucide-react";
import Link from "next/link";
import { DynamicIcon } from "@/components/ui/icon";
import { externalForUnit } from "@/content/external-problems";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { PathUnit } from "@/server/services/path";
import { LessonNode } from "./lesson-node";

const OFFSETS = [0, 44, 64, 44, 0, -44, -64, -44];

export function UnitSection({ unit, index, color }: { unit: PathUnit; index: number; color: string }) {
  return (
    <section aria-labelledby={`unit-${unit.id}`} className="mb-12">
      <div className="rounded-3xl border-b-4 p-5 text-white" style={{ background: color, borderColor: "rgb(0 0 0 / 0.18)" }}>
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/20">
            <DynamicIcon name={unit.icon} size={26} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold uppercase tracking-widest text-white/80">Unit {index + 1}</p>
            <h3 id={`unit-${unit.id}`} className="text-xl font-black">
              {unit.title}
            </h3>
            <p className="mt-1 text-sm text-white/90">{unit.description}</p>
          </div>
          {unit.state === "completed" && <CheckCircle2 aria-label="Unit completed" size={28} />}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <ProgressBar value={unit.total ? unit.completed / unit.total : 0} className="h-3 bg-black/20" color="bg-white" label={`${unit.title} progress`} />
          <span className="whitespace-nowrap text-xs font-extrabold">
            {unit.completed}/{unit.total} · {unit.xp} XP
          </span>
        </div>
        {unit.skipped && <p className="mt-3 text-xs font-extrabold uppercase text-white/90">Skipped by test. You can still replay any lesson.</p>}
        {unit.canSkip && (
          <Link href={`/learn/skip/${unit.id}`} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/20 px-3 py-1.5 text-xs font-extrabold uppercase hover:bg-white/30">
            <FastForward size={14} /> Already know this? Test out
          </Link>
        )}
        {externalForUnit(unit.slug).length > 0 && (
          <Link href={`/practice/links#${unit.slug}`} className="ml-2 mt-3 inline-flex items-center gap-2 rounded-xl bg-white/20 px-3 py-1.5 text-xs font-extrabold uppercase hover:bg-white/30">
            <ExternalLink size={14} /> {externalForUnit(unit.slug).length} practice links
          </Link>
        )}
      </div>
      <ol className="mt-8 flex flex-col items-center gap-7 p-0">
        {unit.lessons.map((l, i) => (
          <LessonNode key={l.id} lesson={l} offset={OFFSETS[i % OFFSETS.length]!} />
        ))}
      </ol>
    </section>
  );
}
