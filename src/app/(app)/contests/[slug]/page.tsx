import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Countdown } from "@/components/contest/countdown";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { practiceAction, registerAction, virtualAction } from "@/features/contest/actions";
import { cn } from "@/lib/cn";
import { requireUser } from "@/server/auth/session";
import { getContest, getScoreboard, mySubmissions, type Scoreboard } from "@/server/services/contests";
import { ServiceError } from "@/server/services/lesson-run";
import { VERDICT_LABEL } from "@/components/practice/verdict";

export const metadata: Metadata = { title: "Contest" };
export const dynamic = "force-dynamic";

const fmt = (d: Date) => d.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" });

function Cell({ c }: { c: Scoreboard["rows"][number]["cells"][string] | undefined }) {
  if (!c || (!c.solved && c.wrong === 0)) return <span className="text-muted/50">·</span>;
  return c.solved ? (
    <span className="font-extrabold text-brand-dark dark:text-brand">
      +{c.wrong > 0 ? c.wrong : ""}
      <span className="block text-[10px] font-bold text-muted">{c.minutes}m</span>
    </span>
  ) : (
    <span className="font-extrabold text-danger">-{c.wrong}</span>
  );
}

export default async function ContestPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string }> }) {
  const { slug } = await params;
  const { error } = await searchParams;
  const user = await requireUser();
  const data = await Promise.all([getContest(user.id, slug), getScoreboard(user.id, slug), mySubmissions(user.id, slug)]).catch((e: unknown) => {
    if (e instanceof ServiceError && e.status === 404) notFound();
    throw e;
  });
  const [c, board, mine] = data;
  const play = c.window;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-widest text-sky">{c.phase === "live" ? "Live contest" : c.phase === "upcoming" ? "Upcoming contest" : "Finished contest"}</p>
        <h1 className="text-3xl font-black">{c.title}</h1>
        <p className="mt-1 text-muted">
          {fmt(c.startsAt)} · {c.durationMin} minutes · {c.problemCount} problems
        </p>
        <p className="mt-1 text-sm text-muted">{c.description}</p>
      </div>
      {error && (
        <p role="alert" className="rounded-2xl border-2 border-danger/40 bg-danger/10 p-3 font-bold text-danger">
          {error}
        </p>
      )}

      <Card className="flex flex-wrap items-center gap-4">
        <div className="flex-1">
          {c.phase === "upcoming" && (
            <p className="text-lg font-black">
              Starts in <Countdown target={c.startsAt.toISOString()} />
            </p>
          )}
          {c.phase === "live" && (
            <p className="text-lg font-black text-danger">
              Ends in <Countdown target={c.endsAt.toISOString()} />
            </p>
          )}
          {c.phase === "past" && !play && <p className="text-lg font-black">This contest has ended.</p>}
          {play && play.mode !== "live" && (
            <p className="text-lg font-black">
              {play.mode === "virtual" ? "Your virtual contest ends in " : "Practice mode, no time limit"}
              {play.endsAt && <Countdown target={play.endsAt.toISOString()} />}
            </p>
          )}
          {c.joined && c.phase !== "past" && <p className="text-sm font-bold text-brand-dark dark:text-brand">You are registered.</p>}
        </div>
        {c.phase !== "past" && !c.joined && (
          <form action={registerAction.bind(null, c.slug)}>
            <Button type="submit" size="lg">{c.phase === "live" ? "Join now" : "Register"}</Button>
          </form>
        )}
        {c.phase === "past" && !c.virtualUsed && (
          <form action={virtualAction.bind(null, c.slug)}>
            <Button type="submit" size="lg" variant="blue">
              Start virtual contest
            </Button>
          </form>
        )}
        {c.phase === "past" && (
          <form action={practiceAction.bind(null, c.slug)}>
            <Button type="submit" size="lg" variant="outline">
              Practice mode
            </Button>
          </form>
        )}
      </Card>
      {c.phase === "past" && <p className="-mt-3 text-xs text-muted">A virtual contest gives you a personal timer of {c.durationMin} minutes (one run per contest) and shows where you would have placed. Practice has no timer. Neither is rated.</p>}

      <section>
        <h2 className="mb-3 text-lg font-black">Problems</h2>
        {c.problems === null ? (
          <p className="rounded-2xl border-2 border-dashed border-line p-5 text-muted">The {c.problemCount} problems are revealed when the contest starts. Register to be ready.</p>
        ) : !play ? (
          <p className="rounded-2xl border-2 border-dashed border-line p-5 text-muted">
            {c.phase === "past" ? "Start a virtual contest or practice mode to open the problems. The statements are also in the problem library now that the contest is over." : "Register to open the problems."}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {c.problems.map((p) => (
              <li key={p.label}>
                <Link href={`/contests/${c.slug}/${p.label}`}>
                  <Card className="flex items-center gap-4 p-4 transition hover:border-sky/60">
                    <span className="grid size-10 place-items-center rounded-xl bg-sky/15 text-lg font-black text-sky">{p.label}</span>
                    <span className="flex-1 font-extrabold">{p.title}</span>
                    {p.cell?.solved ? <CheckCircle2 className="text-brand" aria-label="Solved" /> : p.cell && p.cell.wrong > 0 ? <XCircle className="text-danger" aria-label="Attempted" /> : null}
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {c.phase !== "upcoming" && (
        <section>
          <h2 className="mb-3 text-lg font-black">Scoreboard</h2>
          {board.rows.length === 0 && !board.virtual ? (
            <p className="rounded-2xl border-2 border-dashed border-line p-5 text-muted">No submissions yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border-2 border-line">
              <table className="w-full min-w-[32rem] text-sm">
                <thead className="bg-surface-2 text-xs uppercase text-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2">Solved</th>
                    <th className="px-3 py-2">Penalty</th>
                    {board.labels.map((l) => (
                      <th key={l} className="px-2 py-2">
                        {l}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-line">
                  {board.rows.map((r) => (
                    <tr key={r.userId} className={cn(r.isMe && "bg-sky/10")}>
                      <td className="px-3 py-2 font-extrabold">{r.rank}</td>
                      <td className="px-3 py-2 font-bold">{r.displayName}</td>
                      <td className="px-3 py-2 text-center font-extrabold">{r.solved}</td>
                      <td className="px-3 py-2 text-center">{r.penalty}</td>
                      {board.labels.map((l) => (
                        <td key={l} className="px-2 py-2 text-center">
                          <Cell c={r.cells[l]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                  {board.virtual && (
                    <tr className="bg-grape/10">
                      <td className="px-3 py-2 font-extrabold">{board.virtual.rank}*</td>
                      <td className="px-3 py-2 font-bold">{user.displayName} (virtual)</td>
                      <td className="px-3 py-2 text-center font-extrabold">{board.virtual.solved}</td>
                      <td className="px-3 py-2 text-center">{board.virtual.penalty}</td>
                      {board.labels.map((l) => (
                        <td key={l} className="px-2 py-2 text-center">
                          <Cell c={board.virtual!.cells[l]} />
                        </td>
                      ))}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-2 text-xs text-muted">Official standings only include live participants. * Where your virtual run would have placed. Each cell: + solved (wrong attempts before it, minutes), - only wrong attempts.</p>
        </section>
      )}

      {board.ratingChanges && board.ratingChanges.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-black">Rating changes</h2>
          <ul className="divide-y-2 divide-line rounded-2xl border-2 border-line">
            {board.ratingChanges.map((r) => (
              <li key={r.userId} className="flex justify-between gap-3 px-4 py-2 text-sm">
                <span className="font-bold">
                  #{r.rank} {r.displayName}
                </span>
                <span className={r.newRating >= r.oldRating ? "font-extrabold text-brand-dark dark:text-brand" : "font-extrabold text-danger"}>
                  {r.oldRating} to {r.newRating} ({r.newRating - r.oldRating >= 0 ? "+" : ""}
                  {r.newRating - r.oldRating})
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {mine.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-black">Your submissions</h2>
          <ul className="divide-y-2 divide-line rounded-2xl border-2 border-line">
            {mine.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-x-4 px-4 py-2 text-sm">
                <span className="font-black">{s.label}</span>
                <span className={s.verdict === "accepted" ? "font-extrabold text-brand-dark dark:text-brand" : "font-extrabold text-danger"}>{VERDICT_LABEL[s.verdict] ?? s.verdict}</span>
                <span className="text-muted">
                  {s.testsPassed}/{s.testsTotal} tests
                </span>
                <time className="ml-auto text-xs text-muted" dateTime={s.createdAt.toISOString()}>
                  {s.createdAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "UTC" })} UTC
                </time>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
