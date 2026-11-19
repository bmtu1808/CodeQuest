import { drizzle } from "drizzle-orm/node-postgres";
import { count } from "drizzle-orm";
import { Pool } from "pg";
import { execFileSync } from "node:child_process";
import * as schema from "../src/server/db/schema";
import { loadEnvFiles } from "./load-env";

loadEnvFiles();

/**
 * Demo contests built from the existing problem library, dated relative to now: one that has already ended (so virtual
 * and practice runs can be tried) and one that starts in two days. Only runs when there are no contests yet.
 * Real contests are created with `npm run contest:create`.
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (see .env.example)");
  const pool = new Pool({ connectionString: url, ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined });
  const db = drizzle(pool, { schema });
  const row = (await db.select({ n: count() }).from(schema.contests))[0];
  const n = row?.n ?? 0;
  await pool.end();
  if (n > 0) {
    console.log("contests already exist, nothing to seed");
    return;
  }
  const day = 86_400_000;
  const run = (args: string[]) => execFileSync("npx", ["tsx", "scripts/create-contest.ts", ...args], { stdio: "inherit", env: process.env });
  const past = new Date(Date.now() - 3 * day).toISOString();
  const soon = new Date(Date.now() + 2 * day).toISOString();
  run(["warmup-round-1", "Warm-up Round #1", past, "60", "sum-of-digits", "count-even-numbers", "prime-or-not", "reverse-the-array"]);
  run(["warmup-round-2", "Warm-up Round #2", soon, "90", "longest-equal-run", "balanced-brackets", "range-sum-queries", "pair-with-given-sum"]);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
