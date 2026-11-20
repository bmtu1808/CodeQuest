import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/server/env";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __cqPool?: Pool };

function createPool() {
  const e = env();
  return new Pool({
    connectionString: e.DATABASE_URL,
    ssl: e.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    // Serverless hosts start many instances, each with its own pool. Keep them small so a free database is not exhausted.
    max: process.env.VERCEL ? 3 : 10,
  });
}

/** Lazily created singleton pool (survives Next.js dev hot reloads). */
export function getPool(): Pool {
  if (!globalForDb.__cqPool) globalForDb.__cqPool = createPool();
  return globalForDb.__cqPool;
}

let dbInstance: Db | null = null;

export function getDb(): Db {
  if (!dbInstance) dbInstance = drizzle(getPool(), { schema });
  return dbInstance;
}

export { schema };
