import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUser } from "@/server/auth/session";
import { ServiceError } from "@/server/services/lesson-run";
import { rateLimit } from "@/server/rate-limit";
import type { User } from "@/server/db/schema";

/** Wraps a route handler: authentication, rate limiting and uniform error responses. */
export async function handle(fn: (user: User) => Promise<unknown>, opts: { limit?: number; bucket?: string } = {}): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    const rl = rateLimit(`api:${opts.bucket ?? "default"}:${user.id}`, opts.limit ?? 120, 60_000);
    if (!rl.ok) return NextResponse.json({ error: "Slow down a little" }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } });
    return NextResponse.json(await fn(user));
  } catch (e) {
    if (e instanceof ServiceError) return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
    if (e instanceof ZodError || e instanceof SyntaxError) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    console.error("[api] unexpected error", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
