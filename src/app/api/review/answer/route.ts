import { z } from "zod";
import { responseSchema } from "@/features/learning/grader";
import { handle, UUID } from "@/server/api";
import { answerReview } from "@/server/services/reviews";

const body = z.object({ questionId: z.string().regex(UUID), response: responseSchema });

export async function POST(req: Request) {
  return handle(
    async (user) => {
      const b = body.parse(await req.json());
      return answerReview(user.id, b.questionId, b.response);
    },
    { limit: 60, bucket: "review" },
  );
}
