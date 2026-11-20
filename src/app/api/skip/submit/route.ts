import { z } from "zod";
import { handle, UUID } from "@/server/api";
import { submitSkipTest } from "@/server/services/skip";

const body = z.object({ attemptId: z.string().regex(UUID), answers: z.record(z.string().regex(UUID), z.unknown()) });

export async function POST(req: Request) {
  return handle(
    async (user) => {
      const b = body.parse(await req.json());
      if (Object.keys(b.answers).length > 20) throw new Error("too many answers");
      return submitSkipTest(user.id, b.attemptId, b.answers);
    },
    { limit: 10, bucket: "skip-submit" },
  );
}
