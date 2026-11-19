import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
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
    if (e instanceof ServiceError && e.status === 423) return e;
    throw e;
  });
  if (data instanceof ServiceError) {
    return (
      <main className="grid min-h-dvh place-items-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-black">Not open yet</h1>
          <p className="mt-2 text-muted">{data.message}</p>
          <ButtonLink href="/contests" className="mt-6">
            Go to contests
          </ButtonLink>
        </div>
      </main>
    );
  }
  return <ProblemWorkspace key={slug} problem={data[0]} submissions={data[1]} />;
}
