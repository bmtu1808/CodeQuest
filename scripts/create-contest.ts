import { drizzle } from "drizzle-orm/node-postgres";
import { eq, inArray } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "../src/server/db/schema";
import { loadEnvFiles } from "./load-env";

loadEnvFiles();

/**
 * Create or update a contest from existing problems.
 *   npm run contest:create -- <slug> "<title>" <startsAtISO> <durationMin> <problem-slug> [<problem-slug> ...]
 * Example:
 *   npm run contest:create -- weekly-3 "Weekly Round 3" 2026-12-05T13:00:00Z 90 sum-of-digits prime-or-not balanced-brackets
 * Problems get labels A, B, C... in the order given. Until the contest ends they are hidden from normal practice.
 */
async function main() {
  const [slug, title, startsAtIso, durationRaw, ...problemSlugs] = process.argv.slice(2);
  const durationMin = Number(durationRaw);
  if (!slug || !title || !startsAtIso || !Number.isInteger(durationMin) || durationMin < 10 || problemSlugs.length === 0) {
    console.error('usage: npm run contest:create -- <slug> "<title>" <startsAtISO> <durationMin>=10+ <problem-slug>...');
    process.exit(2);
  }
  const startsAt = new Date(startsAtIso);
  if (Number.isNaN(startsAt.getTime())) throw new Error(`Invalid start time: ${startsAtIso}`);
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (see .env.example)");
  const pool = new Pool({ connectionString: url, ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined });
  const db = drizzle(pool, { schema });
  const found = await db.select({ id: schema.problems.id, slug: schema.problems.slug }).from(schema.problems).where(inArray(schema.problems.slug, problemSlugs));
  const missing = problemSlugs.filter((s) => !found.some((f) => f.slug === s));
  if (missing.length) throw new Error(`Unknown problems: ${missing.join(", ")}`);
  await db.transaction(async (tx) => {
    const [c] = await tx
      .insert(schema.contests)
      .values({ slug, title, startsAt, durationMin, description: `${problemSlugs.length} problems, ${durationMin} minutes. ICPC scoring: more problems first, then lower penalty (minutes plus 20 per wrong attempt).` })
      .onConflictDoUpdate({ target: schema.contests.slug, set: { title, startsAt, durationMin } })
      .returning();
    const existing = await tx.select({ id: schema.contestParticipants.id }).from(schema.contestParticipants).where(eq(schema.contestParticipants.contestId, c!.id)).limit(1);
    if (existing.length) throw new Error("This contest already has participants; its problems cannot be changed.");
    await tx.delete(schema.contestProblems).where(eq(schema.contestProblems.contestId, c!.id));
    for (const [i, ps] of problemSlugs.entries()) {
      await tx.insert(schema.contestProblems).values({ contestId: c!.id, problemId: found.find((f) => f.slug === ps)!.id, label: String.fromCharCode(65 + i), position: i + 1 });
    }
  });
  console.log(`✔ contest "${title}" (${slug}) starts ${startsAt.toISOString()}, ${durationMin} min, ${problemSlugs.length} problems`);
  await pool.end();
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
