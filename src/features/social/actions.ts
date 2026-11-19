"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth/session";
import { getDb, schema } from "@/server/db/client";
import { eq } from "drizzle-orm";
import { ServiceError } from "@/server/services/lesson-run";
import * as social from "@/server/services/social";

type Ctx = { id: string; role: string };

/** Runs a service call; ServiceErrors go back to the page as ?error=, everything else is rethrown. */
async function run(back: string, fn: (u: Ctx) => Promise<string | void>): Promise<never> {
  const user = await requireUser();
  let error: string | null = null;
  let to: string | void = undefined;
  try {
    to = await fn({ id: user.id, role: user.role });
  } catch (e) {
    if (e instanceof ServiceError) error = e.message;
    else throw e;
  }
  const target = error ? back : (to ?? back);
  revalidatePath(target.split("?")[0]!);
  if (error) redirect(`${back}${back.includes("?") ? "&" : "?"}error=${encodeURIComponent(error)}`);
  redirect(target);
}
const str = (f: FormData, k: string) => String(f.get(k) ?? "");

export async function addFriendAction(f: FormData): Promise<void> {
  await run("/friends", async (u) => {
    await social.sendFriendRequest(u.id, str(f, "username"));
  });
}
export async function respondFriendAction(f: FormData): Promise<void> {
  await run("/friends", (u) => social.respondFriendRequest(u.id, str(f, "id"), str(f, "accept") === "1"));
}
export async function removeFriendAction(f: FormData): Promise<void> {
  await run("/friends", (u) => social.removeFriendship(u.id, str(f, "userId")));
}

export async function createGroupAction(f: FormData): Promise<void> {
  await run("/groups", async (u) => `/groups/${await social.createGroup(u.id, str(f, "name"), str(f, "description"))}`);
}
export async function joinGroupAction(f: FormData): Promise<void> {
  await run("/groups", async (u) => `/groups/${await social.joinGroup(u.id, str(f, "code"))}`);
}
export async function leaveGroupAction(f: FormData): Promise<void> {
  await run(`/groups/${str(f, "groupId")}`, async (u) => {
    await social.leaveGroup(u.id, str(f, "groupId"));
    return "/groups";
  });
}
export async function deleteGroupAction(f: FormData): Promise<void> {
  await run(`/groups/${str(f, "groupId")}`, async (u) => {
    await social.deleteGroup(u.id, str(f, "groupId"));
    return "/groups";
  });
}
export async function removeMemberAction(f: FormData): Promise<void> {
  await run(`/groups/${str(f, "groupId")}`, (u) => social.removeMember(u.id, str(f, "groupId"), str(f, "userId")));
}

const scopeOf = (s: string): social.Scope => (s === "lesson" ? "lesson" : "problem");
export async function createThreadAction(f: FormData): Promise<void> {
  const scope = scopeOf(str(f, "scope"));
  const id = str(f, "scopeId");
  await run(`/discuss/${scope}/${id}`, async (u) => `/discuss/thread/${await social.createThread(u.id, scope, id, str(f, "title"), str(f, "body"))}`);
}
export async function replyAction(f: FormData): Promise<void> {
  const id = str(f, "threadId");
  await run(`/discuss/thread/${id}`, (u) => social.reply(u.id, id, str(f, "body")));
}
export async function deleteThreadAction(f: FormData): Promise<void> {
  const back = str(f, "back");
  await run(`/discuss/thread/${str(f, "threadId")}`, async (u) => {
    await social.deleteThread(u.id, u.role, str(f, "threadId"));
    return back.startsWith("/discuss/") ? back : "/dashboard";
  });
}
export async function deletePostAction(f: FormData): Promise<void> {
  await run(`/discuss/thread/${str(f, "threadId")}`, (u) => social.deletePost(u.id, u.role, str(f, "postId")));
}

export async function setLeaderboardVisibilityAction(f: FormData): Promise<void> {
  const user = await requireUser();
  await getDb().update(schema.users).set({ showOnLeaderboard: str(f, "show") === "1" }).where(eq(schema.users.id, user.id));
  revalidatePath("/profile");
  redirect("/profile");
}
