"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth/session";
import { register, startPractice, startVirtual } from "@/server/services/contests";
import { ServiceError } from "@/server/services/lesson-run";

async function run(slug: string, fn: (userId: string) => Promise<void>): Promise<never> {
  const user = await requireUser();
  let error: string | null = null;
  try {
    await fn(user.id);
  } catch (e) {
    if (e instanceof ServiceError) error = e.message;
    else throw e;
  }
  revalidatePath(`/contests/${slug}`);
  redirect(error ? `/contests/${slug}?error=${encodeURIComponent(error)}` : `/contests/${slug}`);
}

export async function registerAction(slug: string): Promise<void> {
  await run(slug, (id) => register(id, slug));
}
export async function virtualAction(slug: string): Promise<void> {
  await run(slug, (id) => startVirtual(id, slug));
}
export async function practiceAction(slug: string): Promise<void> {
  await run(slug, (id) => startPractice(id, slug));
}
