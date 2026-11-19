import type { Metadata } from "next";
import { Lightbulb, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { DayBars, HBars, MasteryBar } from "@/components/dashboard/charts";
import { Heatmap } from "@/components/dashboard/heatmap";
import { DifficultyBadge } from "@/components/practice/difficulty-badge";
import { Card } from "@/components/ui/card";
import { ratingTitle } from "@/features/contest/rating";
import { requireUser } from "@/server/auth/session";
import { getStats } from "@/server/services/analytics";
import { getActivity } from "@/server/services/snapshot";

export const metadata: Metadata = { title: "Statistics" };
export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const user = await requireUser();
  const [s, heat] = await Promise.all([getStats(user), getActivity(user, 119)]);
  const t = s.totals;
  const tiles: Array<[string, string]> = [
    ["Total XP", t.xp.toLocaleString("en-US")],
    ["Level", `${t.level} · ${t.levelTitle}`],
    ["Lessons completed", String(t.lessons)],
    ["Problems solved", String(t.problemsSolved)],
    ["Acceptance rate", t.acceptanceRate === null ? "no submissions yet" : `${Math.round(t.acceptanceRate * 100)}% of ${t.judged}`],
    ["Current streak", `${t.streak} days`],
    ["Longest streak", `${t.longestStreak} days`],
    ["Contest rating", s.rating ? `${s.rating.rating} · ${ratingTitle(s.rating.rating)}` : "not rated yet"],
    ["This week", `${s.week.xp} XP · ${s.week.activeDays} active days`],
    ["Last 30 days", `${s.month.xp} XP · ${s.month.activeDays} active days`],
    ["Avg XP per active day", s.avgXpPerActiveDay === null ? "no activity yet" : String(s.avgXpPerActiveDay)],
  ];
  const i = s.insights;
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black">Statistics</h1>
        <p className="mt-1 text-muted">Everything here is computed from your real activity. Study time is not tracked, so it is not shown.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map(([k, v]) => (
          <Card key={k} className="p-4">
            <p className="text-lg font-black leading-tight">{v}</p>
            <p className="mt-1 text-[11px] font-bold uppercase text-muted">{k}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-black">
          <Lightbulb className="text-gold" size={20} /> What your data says
        </h2>
        <ul className="flex flex-col gap-2">
          {i.insights.map((x, n) => (
            <li key={n} className="flex items-start gap-2 text-sm">
              {x.kind === "strength" ? <TrendingUp className="mt-0.5 shrink-0 text-brand" size={16} /> : x.kind === "weakness" ? <TrendingDown className="mt-0.5 shrink-0 text-danger" size={16} /> : <Lightbulb className="mt-0.5 shrink-0 text-sky" size={16} />}
              <span className={x.kind === "info" ? "font-bold" : ""}>{x.text}</span>
            </li>
          ))}
        </ul>
        {i.recommendations.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-2 text-sm font-extrabold uppercase text-muted">Recommended next</h3>
            <ul className="flex flex-col gap-2">
              {i.recommendations.map((r) => (
                <li key={r.slug}>
                  <Link href={`/practice/${r.slug}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border-2 border-line p-3 transition hover:border-sky/60">
                    <span className="font-extrabold">{r.title}</span>
                    <DifficultyBadge difficulty={r.difficulty} rating={r.rating} />
                    <span className="w-full text-xs text-muted sm:ml-auto sm:w-auto">{r.reason}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-black">Problem topics mastery</h2>
          {i.topics.length === 0 ? (
            <p className="text-sm text-muted">Attempt a few problems and your mastery per topic appears here.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {i.topics.map((m) => (
                <MasteryBar key={m.topic} label={m.topic} value={m.mastery} note={`${m.solved}/${m.attempted} solved${m.confidence === "low" ? " · early" : ""}`} />
              ))}
            </ul>
          )}
          {i.untried.length > 0 && <p className="mt-3 text-xs text-muted">Not tried yet: {i.untried.join(", ")}.</p>}
          <p className="mt-3 text-xs text-muted">Mastery = 60% success rate (solved vs attempted, weighted by difficulty) + 40% coverage of the topic.</p>
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-black">Lesson accuracy by unit</h2>
          {i.units.length === 0 ? (
            <p className="text-sm text-muted">Answer some lesson questions to see your accuracy per unit.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {i.units.map((u) => (
                <MasteryBar key={u.slug} label={u.title} value={u.accuracy} note={`${u.attempts} answers${u.confidence === "low" ? " · early" : ""}`} />
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted">Share of your answers that were correct, counting every try.</p>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-lg font-black">XP over the last 30 days</h2>
        <DayBars data={s.xpSeries} label="XP earned per day" unit="XP" />
      </Card>
      <Card>
        <h2 className="mb-3 text-lg font-black">Problems solved per day</h2>
        <DayBars data={s.solvedSeries} label="Problems first solved per day" unit="problems" color="bg-sky" />
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-black">Topic distribution</h2>
          <HBars data={s.topicDistribution} empty="Solve a problem to see which topics you practise." />
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-black">Difficulty distribution</h2>
          <HBars data={s.difficultyDistribution} color="bg-grape" empty="Solve a problem to see the difficulty mix." />
        </Card>
      </div>
      <Card>
        <h2 className="mb-3 text-lg font-black">Activity heatmap</h2>
        <Heatmap days={heat} />
      </Card>
    </div>
  );
}
