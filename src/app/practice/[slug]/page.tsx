import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProblemWorkspace } from "@/components/practice/workspace";
import { requireUser } from "@/server/auth/session";
import { ServiceError } from "@/server/services/lesson-run";
import { getProblem, listSubmissions } from "@/server/services/problems";

export const metadata: Metadata = { title: "Problem" };
export const dynamic = "force-dynamic";

export default async function ProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();
  const data = await Promise.all([getProblem(user.id, slug), listSubmissions(user.id, slug)]).catch((e: unknown) => {
    if (e instanceof ServiceError && e.status === 404) notFound();
    throw e;
  });
  return <ProblemWorkspace key={slug} problem={data[0]} submissions={data[1]} />;
}
