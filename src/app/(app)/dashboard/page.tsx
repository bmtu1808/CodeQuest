import type { Metadata } from "next";
import { Brain, Flame, Heart, Sparkles, Swords, Target, Trophy, Zap } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HeartsCounter } from "@/components/gamification/hearts-counter";
import { QuestList } from "@/components/gamification/quest-list";
import { CountUp } from "@/components/profile/count-up";
import { WeekChart } from "@/components/dashboard/week-chart";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { requireUser } from "@/server/auth/session";
import { DifficultyBadge } from "@/components/practice/difficulty-badge";
import { Countdown } from "@/components/contest/countdown";
import { getInsights } from "@/server/services/analytics";
import { listContests } from "@/server/services/contests";
import { getReviewOverview } from "@/server/services/reviews";
import { getQuestsView } from "@/server/services/gamification-views";
import { getLeaderboard } from "@/server/services/leaderboard";
import { getLearningPath, nextLesson } from "@/server/services/path";
import { getActivity, getRecentCompletions, getSnapshot } from "@/server/services/snapshot";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  if (!user.onboardingCompleted) redirect("/onboarding");
  const snap = await getSnapshot(user);
  const [path, week, recent, quests, board, insights, review, contests] = await Promise.all([
    getLearningPath(user.id),
    getActivity(user, 7),
    getRecentCompletions(user.id),
    getQuestsView(user.id, snap.today),
    getLeaderboard(user.id, "weekly"),
    getInsights(user.id, 3),
    getReviewOverview(user.id),
    listContests(user.id),
  ]);
  const nextContest = [...contests].filter((c) => c.phase !== "past").sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0];
  const next = nextLesson(path);
  const nextUnit = path.flatMap((w) => w.units).find((u) => u.lessons.some((l) => l.id === next?.id));
  const total = path.reduce((s, w) => s + w.total, 0);
  const done = path.reduce((s, w) => s + w.completed, 0);
  const goalPct = snap.dailyGoal ? Math.min(1, snap.todayXp / snap.dailyGoal) : 0;
  const firstTime = snap.lessonsCompleted === 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="stagger flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-black">{firstTime ? `Welcome, ${user.displayName.split(" ")[0]}!` : "Welcome back, Programmer!"}</h1>
          <p className="mt-1 text-muted">
            {snap.streakAtRisk ? "Your streak is waiting. One lesson keeps it alive." : firstTime ? "Your C++ adventure starts with a single line of code." : "Keep the momentum going."}
          </p>
        </div>

        <Card className="relative overflow-hidden border-brand/40 bg-brand/10 p-6">
          {next ? (
            <>
              <p className="text-xs font-extrabold uppercase tracking-widest text-brand-dark dark:text-brand">{nextUnit?.title ?? "Next lesson"}</p>
              <h2 className="mt-1 text-2xl font-black">{next.title}</h2>
              <p className="mt-1 max-w-md text-muted">{next.summary}</p>
              <ButtonLink href={`/lesson/${next.id}`} prefetch={false} size="lg" className="mt-5 animate-float">
                {next.state === "in_progress" ? "Continue Learning" : firstTime ? "Start Learning" : "Continue Learning"}
              </ButtonLink>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-black">You finished every available lesson!</h2>
              <p className="mt-1 text-muted">More worlds are on the way. Replay any lesson from the Learning Path to polish your skills.</p>
              <ButtonLink href="/learn" size="lg" variant="blue" className="mt-5">
                Open Learning Path
              </ButtonLink>
            </>
          )}
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="flex items-center gap-3 p-4 transition-transform duration-200 hover:-translate-y-1">
            <Zap className="animate-pop text-gold" fill="currentColor" />
            <div>
              <p className="text-2xl font-black leading-none"><CountUp value={snap.totalXp} /></p>
              <p className="text-xs font-bold uppercase text-muted">Total XP</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3 p-4 transition-transform duration-200 hover:-translate-y-1">
            <Flame className={`origin-bottom text-tangerine ${snap.streak > 0 ? "animate-wiggle" : ""}`} fill="currentColor" />
            <div>
              <p className="text-2xl font-black leading-none"><CountUp value={snap.streak} /></p>
              <p className="text-xs font-bold uppercase text-muted">Day streak</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3 p-4 transition-transform duration-200 hover:-translate-y-1">
            <Sparkles className="text-grape" />
            <div>
              <p className="text-2xl font-black leading-none"><CountUp value={snap.lessonsCompleted} /></p>
              <p className="text-xs font-bold uppercase text-muted">Lessons done</p>
            </div>
          </Card>
        </div>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black">Recommended problems</h2>
            <Link href="/stats" className="text-xs font-extrabold uppercase text-sky hover:underline">
              Why these?
            </Link>
          </div>
          {insights.recommendations.length === 0 ? (
            <p className="text-sm text-muted">You have solved every open problem. New ones will appear here.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {insights.recommendations.map((r) => (
                <li key={r.slug}>
                  <Link href={`/practice/${r.slug}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border-2 border-line p-3 transition hover:border-sky/60">
                    <span className="font-extrabold">{r.title}</span>
                    <DifficultyBadge difficulty={r.difficulty} rating={r.rating} />
                    <span className="w-full text-xs text-muted">{r.reason}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black">Daily quests</h2>
            <Link href="/quests" className="text-xs font-extrabold uppercase text-sky hover:underline">
              View all
            </Link>
          </div>
          <QuestList quests={quests} />
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-black">This week</h2>
          <WeekChart days={week} today={snap.today} />
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-black">Recent activity</h2>
          {recent.length === 0 ? (
            <p className="text-muted">No lessons completed yet. Your first one is only a few minutes away.</p>
          ) : (
            <ul className="divide-y-2 divide-line">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-bold">{r.title}</p>
                    <p className="text-xs text-muted">
                      {r.completedAt?.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {r.mistakes === 0 ? "Perfect" : `${r.mistakes} mistake${r.mistakes > 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <span className="font-extrabold text-gold-dark dark:text-gold">{r.xp > 0 ? `+${r.xp} XP` : "Practice"}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <aside className="stagger flex flex-col gap-6">
        <Card>
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-black">Level {snap.level.level}</h2>
            <span className="text-sm font-bold text-muted">{snap.level.title}</span>
          </div>
          <ProgressBar value={snap.level.progress} className="mt-3 [&>div]:origin-left [&>div]:animate-grow" color="bg-grape" label="Level progress" />
          <p className="mt-2 text-xs font-bold text-muted">
            {snap.level.isMax ? "Max level reached" : `${snap.level.xpIntoLevel} / ${snap.level.xpForNext} XP to level ${snap.level.level + 1}`}
          </p>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <Target className="text-sky" size={20} />
            <h2 className="text-lg font-black">Daily goal</h2>
          </div>
          <ProgressBar value={goalPct} className="mt-3 [&>div]:origin-left [&>div]:animate-grow" color="bg-sky" label="Daily XP goal" />
          <p className="mt-2 text-xs font-bold text-muted">
            {snap.todayXp} / {snap.dailyGoal} XP today {goalPct >= 1 && "· Goal reached!"}
          </p>
        </Card>
        <Card>
          <h2 className="text-lg font-black">Course progress</h2>
          <ProgressBar value={total ? done / total : 0} className="mt-3 [&>div]:origin-left [&>div]:animate-grow" label="Course progress" />
          <p className="mt-2 text-xs font-bold text-muted">
            {done} of {total} lessons completed
          </p>
          <ButtonLink href="/learn" variant="outline" size="sm" className="mt-4 w-full">
            Open Learning Path
          </ButtonLink>
        </Card>
        <Card className={review.due > 0 ? "border-grape/50 bg-grape/10" : ""}>
          <div className="flex items-center gap-2">
            <Brain className="text-grape" size={20} />
            <h2 className="text-lg font-black">Review</h2>
          </div>
          {review.due > 0 ? (
            <>
              <p className="mt-2 text-sm font-bold">
                {review.due} question{review.due === 1 ? "" : "s"} due now
              </p>
              <ButtonLink href="/review" prefetch={false} size="sm" className="mt-3 w-full">
                Start review
              </ButtonLink>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">{review.scheduled === 0 ? "Questions you answer correctly in lessons come back here for spaced review." : "All caught up. Reviews come back at growing intervals."}</p>
          )}
        </Card>
        {nextContest && (
          <Card>
            <div className="flex items-center gap-2">
              <Swords className="text-sky" size={20} />
              <h2 className="text-lg font-black">{nextContest.phase === "live" ? "Contest live" : "Next contest"}</h2>
            </div>
            <Link href={`/contests/${nextContest.slug}`} className="mt-2 block font-bold hover:underline">
              {nextContest.title}
            </Link>
            <p className="text-xs text-muted">
              {nextContest.phase === "live" ? "ends in " : "starts in "}
              <Countdown target={(nextContest.phase === "live" ? nextContest.endsAt : nextContest.startsAt).toISOString()} />
            </p>
          </Card>
        )}
        <Card>
          <div className="flex items-center gap-2">
            <Heart className="text-danger" size={20} fill="currentColor" />
            <h2 className="text-lg font-black">Hearts</h2>
            <HeartsCounter hearts={snap.hearts} className="ml-auto" />
          </div>
          <p className="mt-2 text-xs text-muted">A wrong answer in a new lesson costs a heart. One comes back every 30 minutes, or replay a finished lesson to earn one. Replays never cost hearts.</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="text-gold" size={20} />
              <h2 className="text-lg font-black">Weekly top</h2>
            </div>
            <Link href="/leaderboard" className="text-xs font-extrabold uppercase text-sky hover:underline">
              Full board
            </Link>
          </div>
          {board.rows.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No XP earned this week yet. Be the first!</p>
          ) : (
            <ol className="mt-3 flex flex-col gap-1.5 text-sm">
              {board.rows.slice(0, 3).map((r) => (
                <li key={r.userId} className="flex justify-between gap-2">
                  <span className={r.userId === user.id ? "font-extrabold text-sky" : "font-bold"}>
                    {r.rank}. {r.displayName}
                  </span>
                  <span className="text-muted">{r.xp} XP</span>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-3 text-xs font-bold text-muted">{board.me.rank ? `You: #${board.me.rank}` : "You: not ranked yet"}</p>
        </Card>
      </aside>
    </div>
  );
}
