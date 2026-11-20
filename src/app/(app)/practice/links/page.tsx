import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { EXTERNAL_BY_UNIT, PRACTICE_SITES } from "@/content/external-problems";
import { loadCurriculum } from "@/server/services/path";

export const metadata: Metadata = { title: "Practice links" };
export const dynamic = "force-dynamic";

export default async function PracticeLinksPage() {
  const curriculum = await loadCurriculum();
  const units = curriculum.filter((w) => w.world.published).flatMap((w) => w.units.map((u) => u.unit)).filter((u) => (EXTERNAL_BY_UNIT[u.slug] ?? []).length > 0);
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black">Practice on other judges</h1>
        <p className="mt-1 text-muted">
          Hand-picked problems on CSES, Codeforces, AtCoder and VNOJ for each unit. They open on the other site: CodeQuest does not judge them and they give no XP.
        </p>
      </div>
      <Card>
        <h2 className="text-lg font-black">Where to find more</h2>
        <ul className="mt-2 divide-y-2 divide-line">
          {PRACTICE_SITES.map((s) => (
            <li key={s.platform} className="py-2">
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-extrabold hover:underline">{s.platform} ↗</a>
              <p className="text-sm text-muted">{s.note}</p>
            </li>
          ))}
        </ul>
      </Card>
      {units.map((u) => (
        <Card key={u.id} id={u.slug}>
          <h2 className="text-lg font-black">{u.title}</h2>
          <ul className="mt-2 divide-y-2 divide-line">
            {(EXTERNAL_BY_UNIT[u.slug] ?? []).map((p) => (
              <li key={p.url} className="flex items-center justify-between gap-3 py-2">
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="font-bold hover:underline">{p.title} ↗</a>
                <span className="rounded-lg bg-line px-2 py-0.5 text-xs font-extrabold">{p.platform}</span>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
