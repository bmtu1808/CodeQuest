import { handle, UUID } from "@/server/api";
import { completeRun, ServiceError } from "@/server/services/lesson-run";
import { getLearningPath, nextLesson } from "@/server/services/path";

export async function POST(_req: Request, ctx: { params: Promise<{ runId: string }> }) {
  const { runId } = await ctx.params;
  return handle(async (user) => {
    if (!UUID.test(runId)) throw new ServiceError("Run not found", 404);
    const summary = await completeRun(user.id, runId);
    const next = nextLesson(await getLearningPath(user.id));
    return { ...summary, nextLessonId: next?.id ?? null };
  }, { limit: 30 });
}
