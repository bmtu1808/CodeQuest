import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DATABASE_SSL: z.enum(["true", "false"]).default("false"),
  // Code judge (Judge0). All optional: without JUDGE0_URL the practice judge reports "unavailable".
  JUDGE0_URL: z.string().url().optional(),
  JUDGE0_AUTH_TOKEN: z.string().optional(),
  JUDGE0_RAPIDAPI_KEY: z.string().optional(),
  JUDGE0_RAPIDAPI_HOST: z.string().optional(),
  JUDGE0_CPP17_ID: z.coerce.number().int().default(54),
  JUDGE0_CPP20_ID: z.coerce.number().int().default(105),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

let cached: z.infer<typeof schema> | null = null;

/** Validated server-side environment. Throws a readable error when misconfigured. */
export function env() {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      throw new Error(`Invalid environment: ${issues}. See .env.example`);
    }
    cached = parsed.data;
  }
  return cached;
}
