import type { Metadata } from "next";
import { Brain } from "lucide-react";
import { ReviewSession } from "@/components/lesson/review-session";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/server/auth/session";
import { getDueReviews, getReviewOverview } from "@/server/services/reviews";

export const metadata: Metadata = { title: "Review" };
export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const user = await requireUser();
  const [due, overview] = await Promise.all([getDueReviews(user.id, 10), getReviewOverview(user.id)]);
  if (due.length > 0) return <ReviewSession questions={due} />;
  return (
    <div className="mx-auto max-w-lg text-center">
      <Brain className="mx-auto text-grape" size={48} />
      <h1 className="mt-3 text-3xl font-black">Nothing to review right now</h1>
      <Card className="mt-6 p-5 text-left text-sm text-muted">
        {overview.scheduled === 0 ? (
          <p>Every lesson question you answer correctly joins your review schedule, and comes back after 1 day, then 3 days, then at longer and longer gaps. Finish a lesson to start building yours.</p>
        ) : (
          <p>
            You have {overview.scheduled} question{overview.scheduled === 1 ? "" : "s"} scheduled.{" "}
            {overview.nextDueAt ? `The next one is due ${overview.nextDueAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}.` : ""}
          </p>
        )}
      </Card>
      <ButtonLink href="/learn" size="lg" className="mt-6">
        Continue learning
      </ButtonLink>
    </div>
  );
}
