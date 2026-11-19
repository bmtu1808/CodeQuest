import { z } from "zod";
import { handle } from "@/server/api";
import { contestSubmit } from "@/server/services/contests";

export const maxDuration = 60;
const body = z.object({ source: z.string(), language: z.string() });

export async function POST(req: Request, ctx: { params: Promise<{ slug: string; label: string }> }) {
  const { slug, label } = await ctx.params;
  return handle(
    async (user) => {
      const b = body.parse(await req.json());
      return contestSubmit(user.id, slug, label, b.source, b.language);
    },
    { limit: 10, bucket: "submit" },
  );
}
