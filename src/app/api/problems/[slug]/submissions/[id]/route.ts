import { and, eq } from "drizzle-orm";
import { handle, UUID } from "@/server/api";
import { getDb, schema } from "@/server/db/client";
import { ServiceError } from "@/server/services/lesson-run";

/** Source code of one of the caller's own submissions (so it can be loaded back into the editor). */
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { id } = await ctx.params;
  return handle(async (user) => {
    if (!UUID.test(id)) throw new ServiceError("Submission not found", 404);
    const [s] = await getDb()
      .select({ sourceCode: schema.submissions.sourceCode, language: schema.submissions.language })
      .from(schema.submissions)
      .where(and(eq(schema.submissions.id, id), eq(schema.submissions.userId, user.id)));
    if (!s) throw new ServiceError("Submission not found", 404);
    return s;
  });
}
