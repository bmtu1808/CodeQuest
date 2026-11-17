import { z } from "zod";
import { responseSchema } from "@/features/learning/grader";
import { handle, UUID } from "@/server/api";
import { answerQuestion, ServiceError } from "@/server/services/lesson-run";

const body = z.object({ questionId: z.string().regex(UUID), response: responseSchema });

export async function POST(req: Request, ctx: { params: Promise<{ runId: string }> }) {
  const { runId } = await ctx.params;
  return handle(async (user) => {
    if (!UUID.test(runId)) throw new ServiceError("Run not found", 404);
    const { questionId, response } = body.parse(await req.json());
    return answerQuestion(user.id, runId, questionId, response);
  });
}
