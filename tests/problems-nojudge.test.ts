import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.TEST_DATABASE_URL;
const d = url ? describe : describe.skip;

d("practice without a configured judge", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let svc: any, db: any, schema: any, orm: any;
  let userId: string;
  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    delete process.env.JUDGE0_URL;
    orm = await import("drizzle-orm");
    ({ getDb: db, schema } = await import("@/server/db/client"));
    svc = await import("@/server/services/problems");
    const h = db();
    await h.execute(orm.sql`TRUNCATE users, problems CASCADE`);
    const [u] = await h.insert(schema.users).values({ email: "n@example.com", username: "nojudge", passwordHash: "x", displayName: "N" }).returning();
    userId = u.id;
    await h.insert(schema.userStats).values({ userId });
    const [p] = await h.insert(schema.problems).values({ slug: "nj", title: "NJ", statement: "s", inputFormat: "i", outputFormat: "o", constraints: "c", difficulty: "easy", rating: 1000, samples: [{ input: "1\n", output: "1\n" }], hints: ["a", "b", "c"], editorial: "e", referenceSolution: "r" }).returning();
    await h.insert(schema.problemTestCases).values({ problemId: p.id, position: 1, input: "1\n", expectedOutput: "1\n", isSample: true });
  });
  afterAll(async () => {
    const { getPool } = await import("@/server/db/client");
    await getPool().end();
  });
  it("reports the judge as unavailable and never marks anything Accepted", async () => {
    expect((await svc.getProblem(userId, "nj")).judgeAvailable).toBe(false);
    await expect(svc.submit(userId, "nj", "int main(){}", "cpp17")).rejects.toMatchObject({ status: 503 });
    await expect(svc.runSamples(userId, "nj", "int main(){}", "cpp17")).rejects.toMatchObject({ status: 503 });
    const subs = await db().select().from(schema.submissions);
    expect(subs.length).toBe(0);
  });
});
