import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/server/auth/session";
import { getOverview } from "@/server/services/admin";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminHome() {
  const user = await requireRole("admin", "content_editor");
  const o = await getOverview(user);
  const rate = o.subs.total ? Math.round((100 * o.subs.accepted) / o.subs.total) : 0;
  const tiles: Array<[string, string | number, string?]> = [
    ["Users", o.users.total, `${o.users.new7} new in 7 days · ${o.users.new30} in 30`],
    ["Daily active", o.act.dau, "earned XP in the last 24 hours"],
    ["Weekly active", o.act.wau, "last 7 days"],
    ["Monthly active", o.act.mau, "last 30 days"],
    ["Lessons completed", o.learn.lessons],
    ["XP awarded", o.learn.xp.toLocaleString("en-US")],
    ["Submissions", o.subs.total, `${o.subs.last7} in 7 days`],
    ["Acceptance rate", `${rate}%`],
    ["Published", `${o.content.lessons} lessons`, `${o.content.problems} problems · ${o.content.contests} contests`],
  ];
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-black">Overview</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {tiles.map(([l, v, sub]) => (
          <Card key={l} className="p-4">
            <p className="text-2xl font-black">{v}</p>
            <p className="text-[11px] font-bold uppercase text-muted">{l}</p>
            {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
          </Card>
        ))}
      </div>
      <Card>
        <h2 className="text-lg font-black">Hardest problems</h2>
        <p className="text-xs text-muted">Lowest acceptance rate, at least 3 submissions.</p>
        {o.hardest.length === 0 ? <p className="mt-2 text-muted">Not enough submissions yet.</p> : (
          <ul className="mt-2 divide-y-2 divide-line">
            {o.hardest.map((h) => (
              <li key={h.slug} className="flex justify-between py-2"><Link className="font-bold hover:underline" href={`/practice/${h.slug}`}>{h.title}</Link><span className="text-sm text-muted">{h.rate}% of {h.subs}</span></li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
