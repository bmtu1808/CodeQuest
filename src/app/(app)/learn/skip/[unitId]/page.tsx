import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SkipTest } from "@/components/lesson/skip-test";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/server/auth/session";
import { getDb, schema } from "@/server/db/client";
import { ServiceError } from "@/server/services/lesson-run";
import { getSkipStatus, SKIP_COOLDOWN_MS, SKIP_PASS_RATIO } from "@/server/services/skip";
import { eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Test out of a unit" };
export const dynamic = "force-dynamic";

export default async function SkipPage({ params }: { params: Promise<{ unitId: string }> }) {
  const { unitId } = await params;
  const user = await requireUser();
  if (!/^[0-9a-f-]{36}$/.test(unitId)) notFound();
  const status = await getSkipStatus(user.id, unitId).catch((e) => {
    if (e instanceof ServiceError) return null;
    throw e;
  });
  if (!status) notFound();
  const [unit] = await getDb().select().from(schema.units).where(eq(schema.units.id, unitId));
  const title = unit?.title ?? "this unit";
  const blocked = status.state === "passed" ? "You already skipped this unit. Its lessons count as done." : status.state === "done" ? status.reason : status.state === "unavailable" ? status.reason : null;
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/learn" className="text-xs font-extrabold uppercase text-sky hover:underline">Learning path</Link>
      <h1 className="mt-1 text-3xl font-black">Test out: {title}</h1>
      {blocked ? (
        <Card className="mt-6 p-6 text-center text-muted">{blocked}</Card>
      ) : status.state === "cooldown" ? (
        <Card className="mt-6 p-6 text-center">
          <p className="font-bold">You can try again after {status.until.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}.</p>
          <p className="mt-1 text-sm text-muted">Use the wait to study the lessons of this unit.</p>
        </Card>
      ) : status.state === "ready" ? (
        <SkipTest unitId={unitId} unitTitle={title} questions={status.questions} needed={status.needed} passPercent={Math.round(SKIP_PASS_RATIO * 100)} cooldownMin={SKIP_COOLDOWN_MS / 60000} />
      ) : null}
    </div>
  );
}
