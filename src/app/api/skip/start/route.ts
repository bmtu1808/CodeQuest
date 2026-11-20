import { z } from "zod";
import { handle, UUID } from "@/server/api";
import { startSkipTest } from "@/server/services/skip";

const body = z.object({ unitId: z.string().regex(UUID) });

export async function POST(req: Request) {
  return handle(
    async (user) => {
      const b = body.parse(await req.json());
      return startSkipTest(user.id, b.unitId);
    },
    { limit: 10, bucket: "skip-start" },
  );
}
