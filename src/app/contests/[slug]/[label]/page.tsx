import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProblemWorkspace } from "@/components/practice/workspace";
import { requireUser } from "@/server/auth/session";
import { getContestProblem, mySubmissions } from "@/server/services/contests";
import { ServiceError } from "@/server/services/lesson-run";

export const metadata: Metadata = { title: "Contest problem" };
export const dynamic = "force-dynamic";

export default async function ContestProblemPage({ params }: { params: Promise<{ slug: string; label: string }> }) {
  const { slug, label } = await params;
  const user = await requireUser();
  const data = await getContestProblem(user.id, slug, label).catch((e: unknown) => {
    if (e instanceof ServiceError && e.status === 404) notFound();
    if (e instanceof ServiceError && e.status === 403) redirect(`/contests/${slug}?error=${encodeURIComponent(e.message)}`);
    throw e;
  });
  const subs = (await mySubmissions(user.id, slug, 100)).filter((s) => s.label === label).slice(0, 10);
  const { contest, ...problem } = data;
  return (
    <ProblemWorkspace
      key={`${slug}-${label}`}
      problem={problem}
      contest={{ slug: contest.slug, title: contest.title, label, mode: contest.mode, endsAt: contest.endsAt ? contest.endsAt.toISOString() : null }}
      submissions={subs.map((s) => ({ id: s.id, verdict: s.verdict, language: "cpp17", timeMs: null, memoryKb: null, testsPassed: s.testsPassed, testsTotal: s.testsTotal, createdAt: s.createdAt }))}
    />
  );
}
