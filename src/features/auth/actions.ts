"use server";

import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/server/db/client";
import { clientKey, createSession, destroySession } from "@/server/auth/session";
import { rateLimit } from "@/server/rate-limit";
import { isValidTimezone } from "@/features/gamification/streak";
import { loginSchema, signupSchema, type FormState } from "./schemas";

const AVATAR_COLORS = ["#58CC02", "#1CB0F6", "#CE82FF", "#FF9600", "#FF4B4B", "#FFC800"];

function echo(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (typeof v === "string" && k !== "password") out[k] = v;
  return out;
}

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const k = String(i.path[0] ?? "form");
    if (!out[k]) out[k] = i.message;
  }
  return out;
}

export async function signupAction(_prev: FormState, form: FormData): Promise<FormState> {
  const values = echo(form);
  const limit = rateLimit(`signup:${await clientKey()}`, 10, 60 * 60_000);
  if (!limit.ok) return { error: `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSec / 60)} min.`, values };

  const parsed = signupSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues), values };
  const { displayName, username, email, password, timezone } = parsed.data;

  const db = getDb();
  const dup = await db
    .select({ email: schema.users.email, username: schema.users.username })
    .from(schema.users)
    .where(or(eq(schema.users.email, email), eq(schema.users.username, username)))
    .limit(2);
  if (dup.some((d) => d.email === email)) return { fieldErrors: { email: "An account with this email already exists" }, values };
  if (dup.some((d) => d.username === username)) return { fieldErrors: { username: "This username is taken" }, values };

  const passwordHash = await bcrypt.hash(password, 12);
  const tz = timezone && isValidTimezone(timezone) ? timezone : "UTC";
  let userId: string;
  try {
    userId = await db.transaction(async (tx) => {
      const [u] = await tx
        .insert(schema.users)
        .values({
          email,
          username,
          passwordHash,
          displayName,
          timezone: tz,
          avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]!,
        })
        .returning({ id: schema.users.id });
      await tx.insert(schema.userStats).values({ userId: u!.id });
      return u!.id;
    });
  } catch {
    // Unique violation from a concurrent signup
    return { error: "Could not create the account. The email or username may already be in use.", values };
  }
  await createSession(userId);
  redirect("/onboarding");
}

export async function loginAction(_prev: FormState, form: FormData): Promise<FormState> {
  const values = echo(form);
  const ip = await clientKey();
  const parsed = loginSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues), values };
  const { email, password } = parsed.data;

  const limit = rateLimit(`login:${ip}:${email}`, 8, 15 * 60_000);
  if (!limit.ok) return { error: `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSec / 60)} min.`, values };

  const [user] = await getDb().select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  // Compare against a dummy hash when the user does not exist so response time does not reveal accounts.
  const hash = user?.passwordHash ?? "$2b$12$C6UzMDM.H6dfI/f/IKcEeO5n5l1F8p1kQ5m2sQ1m0QzWf0b3Wm0fS";
  const ok = await bcrypt.compare(password, hash);
  if (!user || user.deletedAt || !ok) return { error: "Incorrect email or password", values };

  await createSession(user.id);
  redirect(user.onboardingCompleted ? "/dashboard" : "/onboarding");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
