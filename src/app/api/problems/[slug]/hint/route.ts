import { z } from "zod";
import { handle } from "@/server/api";
import { revealHint } from "@/server/services/problems";

const body = z.object({ level: z.number().int().min(1).max(3) });

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  return handle(async (user) => revealHint(user.id, slug, body.parse(await req.json()).level), { limit: 30, bucket: "hint" });
}
