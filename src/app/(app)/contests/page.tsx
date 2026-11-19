import type { Metadata } from "next";
import { Swords, Trophy } from "lucide-react";
import Link from "next/link";
import { Countdown } from "@/components/contest/countdown";
import { Card } from "@/components/ui/card";
import { ratingTitle } from "@/features/contest/rating";
import { cn } from "@/lib/cn";
import { requireUser } from "@/server/auth/session";
import { getRatingBoard, listContests, type ContestListItem } from "@/server/services/contests";

export const metadata: Metadata = { title: "Contests" };
export const dynamic = "force-dynamic";

const fmt = (d: Date) => d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" });

function Row({ c }: { c: ContestListItem }) {
  return (
    <li>
      <Link href={`/contests/${c.slug}`}>
        <Card className="flex flex-wrap items-center gap-x-4 gap-y-1 transition hover:border-sky/60">
          <div className="min-w-0 flex-1">
            <p className="font-extrabold">{c.title}</p>
            <p className="text-xs text-muted">
              {fmt(c.startsAt)} · {c.durationMin} min · {c.problemCount} problems · {c.participants} taking part
            </p>
          </div>
          {c.phase === "upcoming" && (
            <span className="text-sm font-extrabold text-sky">
              starts in <Countdown target={c.startsAt.toISOString()} />
            </span>
          )}
          {c.phase === "live" && (
            <span className="text-sm font-extrabold text-danger">
              LIVE · ends in <Countdown target={c.endsAt.toISOString()} />
            </span>
          )}
          {c.joined && <span className="rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-extrabold uppercase text-brand-dark dark:text-brand">Joined</span>}
        </Card>
      </Link>
    </li>
  );
}

export default async function ContestsPage() {
  const user = await requireUser();
  const [list, board] = await Promise.all([listContests(user.id), getRatingBoard(10)]);
  const section = (title: string, phase: ContestListItem["phase"], empty: string) => {
    const items = list.filter((c) => c.phase === phase);
    return (
      <section>
        <h2 className="mb-3 text-lg font-black">{title}</h2>
        {items.length === 0 ? <p className="rounded-2xl border-2 border-dashed border-line p-5 text-sm text-muted">{empty}</p> : <ul className="flex flex-col gap-3">{items.map((c) => <Row key={c.slug} c={c} />)}</ul>}
      </section>
    );
  };
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-black">
            <Swords /> Contest Arena
          </h1>
          <p className="mt-1 text-muted">Timed rounds with ICPC scoring: more problems first, then less penalty (minutes plus 20 per wrong attempt). Times are shown in UTC.</p>
        </div>
        {section("Live now", "live", "No contest is running right now.")}
        {section("Upcoming", "upcoming", "No contest is scheduled yet.")}
        {section("Past contests", "past", "Nothing here yet. Finished contests can be replayed as a virtual contest or practised.")}
      </div>
      <aside>
        <Card>
          <h2 className="flex items-center gap-2 text-lg font-black">
            <Trophy className="text-gold" size={20} /> Contest ratings
          </h2>
          {board.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Nobody is rated yet. Ratings start after the first finished live contest with at least two participants.</p>
          ) : (
            <ol className="mt-3 flex flex-col gap-2 text-sm">
              {board.map((r, i) => (
                <li key={r.userId} className={cn("flex justify-between gap-2", r.userId === user.id && "font-extrabold text-sky")}>
                  <span className="truncate">
                    {i + 1}. {r.displayName}
                  </span>
                  <span className="whitespace-nowrap text-muted">
                    {r.rating} · {ratingTitle(r.rating)}
                  </span>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-3 text-xs text-muted">Everyone starts at 1500. Only live participation is rated; virtual and practice runs are not.</p>
        </Card>
      </aside>
    </div>
  );
}
