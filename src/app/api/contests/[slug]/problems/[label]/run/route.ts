import { z } from "zod";
import { handle } from "@/server/api";
import { contestRun } from "@/server/services/contests";

export const maxDuration = 60;
const body = z.object({ source: z.string(), language: z.string(), customInput: z.string().optional() });

export async function POST(req: Request, ctx: { params: Promise<{ slug: string; label: string }> }) {
  const { slug, label } = await ctx.params;
  return handle(
    async (user) => {
      const b = body.parse(await req.json());
      return contestRun(user.id, slug, label, b.source, b.language, b.customInput);
    },
    { limit: 20, bucket: "run" },
  );
}
