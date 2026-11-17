"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, schema } from "@/server/db/client";
import { requireUser } from "@/server/auth/session";
import { isValidOption, recommendWorld } from "@/features/learning/recommend";

const answers = z.object({
  knowsProgramming: z.string().refine((v) => isValidOption("knowsProgramming", v)),
  knowsCpp: z.string().refine((v) => isValidOption("knowsCpp", v)),
  goal: z.string().refine((v) => isValidOption("goal", v)),
  dailyMinutes: z.coerce.number().refine((v) => isValidOption("dailyMinutes", String(v))),
  selfLevel: z.string().refine((v) => isValidOption("selfLevel", v)),
});

export async function completeOnboardingAction(input: unknown): Promise<{ error?: string }> {
  const user = await requireUser();
  const parsed = answers.safeParse(input);
  if (!parsed.success) return { error: "Please answer every question." };
  const a = parsed.data;
  await getDb()
    .update(schema.users)
    .set({ ...a, onboardingCompleted: true, recommendedWorldSlug: recommendWorld(a) })
    .where(eq(schema.users.id, user.id));
  redirect("/dashboard");
}

/** Onboarding can be skipped; defaults to the beginner path. */
export async function skipOnboardingAction(): Promise<void> {
  const user = await requireUser();
  await getDb()
    .update(schema.users)
    .set({ onboardingCompleted: true, recommendedWorldSlug: "cpp-foundations" })
    .where(eq(schema.users.id, user.id));
  redirect("/dashboard");
}
