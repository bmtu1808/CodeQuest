import { randomBytes } from "node:crypto";
import { and, asc, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/server/db/client";
import { levelFromXp } from "@/features/gamification/xp";
import { ServiceError } from "./lesson-run";
import { notify } from "./notifications";
import { isProblemOpen } from "./problems";

export const pairKey = (a: string, b: string) => (a < b ? `${a}:${b}` : `${b}:${a}`);

// ───────────────────────── friends ─────────────────────────

export type PersonRow = { userId: string; username: string; displayName: string; avatarColor: string; level: number; streak: number };

async function people(ids: string[]): Promise<Map<string, PersonRow>> {
  if (!ids.length) return new Map();
  const rows = await getDb()
    .select({ id: schema.users.id, username: schema.users.username, displayName: schema.users.displayName, avatarColor: schema.users.avatarColor, xp: schema.userStats.totalXp, streak: schema.userStats.currentStreak })
    .from(schema.users)
    .leftJoin(schema.userStats, eq(schema.userStats.userId, schema.users.id))
    .where(and(inArray(schema.users.id, ids), isNull(schema.users.deletedAt)));
  return new Map(rows.map((r) => [r.id, { userId: r.id, username: r.username, displayName: r.displayName, avatarColor: r.avatarColor, level: levelFromXp(r.xp ?? 0).level, streak: r.streak ?? 0 }]));
}

export type FriendsView = { friends: PersonRow[]; incoming: Array<PersonRow & { friendshipId: string }>; outgoing: Array<PersonRow & { friendshipId: string }> };

export async function getFriends(userId: string): Promise<FriendsView> {
  const F = schema.friendships;
  const rows = await getDb().select().from(F).where(or(eq(F.requesterId, userId), eq(F.addresseeId, userId)));
  const other = (r: (typeof rows)[number]) => (r.requesterId === userId ? r.addresseeId : r.requesterId);
  const map = await people(rows.map(other));
  const pick = <T extends object>(r: (typeof rows)[number], extra: T) => {
    const p = map.get(other(r));
    return p ? { ...p, ...extra } : null;
  };
  return {
    friends: rows.filter((r) => r.status === "accepted").flatMap((r) => pick(r, {}) ?? []).sort((a, b) => a.displayName.localeCompare(b.displayName)),
    incoming: rows.filter((r) => r.status === "pending" && r.addresseeId === userId).flatMap((r) => pick(r, { friendshipId: r.id }) ?? []),
    outgoing: rows.filter((r) => r.status === "pending" && r.requesterId === userId).flatMap((r) => pick(r, { friendshipId: r.id }) ?? []),
  };
}

export async function friendIds(userId: string): Promise<string[]> {
  const F = schema.friendships;
  const rows = await getDb().select().from(F).where(and(eq(F.status, "accepted"), or(eq(F.requesterId, userId), eq(F.addresseeId, userId))));
  return rows.map((r) => (r.requesterId === userId ? r.addresseeId : r.requesterId));
}

export async function sendFriendRequest(userId: string, usernameRaw: string): Promise<"sent" | "accepted"> {
  const username = usernameRaw.trim().toLowerCase().replace(/^@/, "");
  if (!/^[a-z0-9_]{3,20}$/.test(username)) throw new ServiceError("Enter a valid username", 400);
  return getDb().transaction(async (tx) => {
    const [target] = await tx.select().from(schema.users).where(and(eq(schema.users.username, username), isNull(schema.users.deletedAt)));
    if (!target) throw new ServiceError("No learner with that username", 404);
    if (target.id === userId) throw new ServiceError("You cannot add yourself", 400);
    const key = pairKey(userId, target.id);
    const [existing] = await tx.select().from(schema.friendships).where(eq(schema.friendships.pairKey, key)).for("update");
    const [me] = await tx.select({ name: schema.users.displayName }).from(schema.users).where(eq(schema.users.id, userId));
    if (existing) {
      if (existing.status === "accepted") throw new ServiceError("You are already friends", 409);
      if (existing.requesterId === userId) throw new ServiceError("Request already sent", 409);
      await tx.update(schema.friendships).set({ status: "accepted" }).where(eq(schema.friendships.id, existing.id));
      await notify(tx, { userId: target.id, type: "system", title: `${me?.name ?? "A learner"} accepted your friend request`, href: "/friends" });
      return "accepted";
    }
    await tx.insert(schema.friendships).values({ requesterId: userId, addresseeId: target.id, pairKey: key });
    await notify(tx, { userId: target.id, type: "system", title: `${me?.name ?? "A learner"} sent you a friend request`, href: "/friends" });
    return "sent";
  });
}

export async function respondFriendRequest(userId: string, friendshipId: string, accept: boolean): Promise<void> {
  await getDb().transaction(async (tx) => {
    const [f] = await tx.select().from(schema.friendships).where(eq(schema.friendships.id, friendshipId)).for("update");
    if (!f || f.addresseeId !== userId || f.status !== "pending") throw new ServiceError("Request not found", 404);
    if (!accept) {
      await tx.delete(schema.friendships).where(eq(schema.friendships.id, f.id));
      return;
    }
    await tx.update(schema.friendships).set({ status: "accepted" }).where(eq(schema.friendships.id, f.id));
    const [me] = await tx.select({ name: schema.users.displayName }).from(schema.users).where(eq(schema.users.id, userId));
    await notify(tx, { userId: f.requesterId, type: "system", title: `${me?.name ?? "A learner"} accepted your friend request`, href: "/friends" });
  });
}

/** Unfriend, or withdraw/decline a pending request involving this user. */
export async function removeFriendship(userId: string, otherUserId: string): Promise<void> {
  await getDb().delete(schema.friendships).where(eq(schema.friendships.pairKey, pairKey(userId, otherUserId)));
}

export async function friendshipState(userId: string, otherId: string): Promise<"self" | "none" | "friends" | "sent" | "received"> {
  if (userId === otherId) return "self";
  const [f] = await getDb().select().from(schema.friendships).where(eq(schema.friendships.pairKey, pairKey(userId, otherId)));
  if (!f) return "none";
  return f.status === "accepted" ? "friends" : f.requesterId === userId ? "sent" : "received";
}

// ───────────────────────── study groups ─────────────────────────

const MAX_GROUPS_OWNED = 5;
const MAX_MEMBERS = 50;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newCode = () => Array.from(randomBytes(8), (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");

export async function createGroup(userId: string, nameRaw: string, descriptionRaw: string): Promise<string> {
  const name = nameRaw.trim();
  if (name.length < 3 || name.length > 40) throw new ServiceError("Group name must be 3 to 40 characters", 400);
  const description = descriptionRaw.trim().slice(0, 300);
  return getDb().transaction(async (tx) => {
    const owned = await tx.select({ n: sql<number>`count(*)::int` }).from(schema.studyGroups).where(and(eq(schema.studyGroups.ownerId, userId), isNull(schema.studyGroups.deletedAt)));
    if ((owned[0]?.n ?? 0) >= MAX_GROUPS_OWNED) throw new ServiceError(`You can own at most ${MAX_GROUPS_OWNED} groups`, 409);
    const [g] = await tx.insert(schema.studyGroups).values({ name, description, ownerId: userId, inviteCode: newCode() }).returning({ id: schema.studyGroups.id });
    await tx.insert(schema.groupMembers).values({ groupId: g!.id, userId, role: "owner" });
    return g!.id;
  });
}

export async function joinGroup(userId: string, codeRaw: string): Promise<string> {
  const code = codeRaw.trim().toUpperCase();
  return getDb().transaction(async (tx) => {
    const [g] = await tx.select().from(schema.studyGroups).where(and(eq(schema.studyGroups.inviteCode, code), isNull(schema.studyGroups.deletedAt))).for("update");
    if (!g) throw new ServiceError("No group has that invite code", 404);
    const members = await tx.select({ n: sql<number>`count(*)::int` }).from(schema.groupMembers).where(eq(schema.groupMembers.groupId, g.id));
    const already = await tx.select().from(schema.groupMembers).where(and(eq(schema.groupMembers.groupId, g.id), eq(schema.groupMembers.userId, userId)));
    if (already.length) return g.id;
    if ((members[0]?.n ?? 0) >= MAX_MEMBERS) throw new ServiceError("This group is full", 409);
    await tx.insert(schema.groupMembers).values({ groupId: g.id, userId });
    return g.id;
  });
}

export async function listMyGroups(userId: string) {
  return getDb()
    .select({ id: schema.studyGroups.id, name: schema.studyGroups.name, description: schema.studyGroups.description, role: schema.groupMembers.role, members: sql<number>`(select count(*)::int from group_members m where m.group_id = ${schema.studyGroups.id})` })
    .from(schema.groupMembers)
    .innerJoin(schema.studyGroups, and(eq(schema.studyGroups.id, schema.groupMembers.groupId), isNull(schema.studyGroups.deletedAt)))
    .where(eq(schema.groupMembers.userId, userId))
    .orderBy(asc(schema.studyGroups.name));
}

export async function memberIds(groupId: string): Promise<string[]> {
  return (await getDb().select({ id: schema.groupMembers.userId }).from(schema.groupMembers).where(eq(schema.groupMembers.groupId, groupId))).map((r) => r.id);
}

/** A group is only visible to its members (the invite code is never shown to outsiders). */
export async function getGroup(userId: string, groupId: string) {
  const [g] = await getDb().select().from(schema.studyGroups).where(and(eq(schema.studyGroups.id, groupId), isNull(schema.studyGroups.deletedAt)));
  if (!g) throw new ServiceError("Group not found", 404);
  const mem = await getDb().select().from(schema.groupMembers).where(eq(schema.groupMembers.groupId, groupId));
  const me = mem.find((m) => m.userId === userId);
  if (!me) throw new ServiceError("Group not found", 404);
  const map = await people(mem.map((m) => m.userId));
  return {
    id: g.id,
    name: g.name,
    description: g.description,
    inviteCode: g.inviteCode,
    isOwner: me.role === "owner",
    members: mem.flatMap((m) => {
      const p = map.get(m.userId);
      return p ? [{ ...p, role: m.role }] : [];
    }),
  };
}

export async function leaveGroup(userId: string, groupId: string): Promise<void> {
  const [m] = await getDb().select().from(schema.groupMembers).where(and(eq(schema.groupMembers.groupId, groupId), eq(schema.groupMembers.userId, userId)));
  if (!m) throw new ServiceError("Group not found", 404);
  if (m.role === "owner") throw new ServiceError("Owners cannot leave. Delete the group instead.", 409);
  await getDb().delete(schema.groupMembers).where(eq(schema.groupMembers.id, m.id));
}

export async function removeMember(userId: string, groupId: string, memberUserId: string): Promise<void> {
  const g = await getGroup(userId, groupId);
  if (!g.isOwner) throw new ServiceError("Only the owner can remove members", 403);
  if (memberUserId === userId) throw new ServiceError("Delete the group instead", 409);
  await getDb().delete(schema.groupMembers).where(and(eq(schema.groupMembers.groupId, groupId), eq(schema.groupMembers.userId, memberUserId)));
}

export async function deleteGroup(userId: string, groupId: string): Promise<void> {
  const g = await getGroup(userId, groupId);
  if (!g.isOwner) throw new ServiceError("Only the owner can delete the group", 403);
  await getDb().update(schema.studyGroups).set({ deletedAt: new Date() }).where(eq(schema.studyGroups.id, groupId));
}

// ───────────────────────── discussions ─────────────────────────

export type Scope = "problem" | "lesson";
const BODY_MAX = 4000;
const isStaff = (role: string) => role === "admin" || role === "content_editor";

async function assertScopeReadable(scope: Scope, scopeId: string): Promise<{ title: string; backHref: string }> {
  const db = getDb();
  if (scope === "problem") {
    const [p] = await db.select().from(schema.problems).where(and(eq(schema.problems.id, scopeId), eq(schema.problems.published, true), isNull(schema.problems.deletedAt)));
    if (!p) throw new ServiceError("Not found", 404);
    // Discussions of a contest problem would spoil the contest, so they stay closed until it ends.
    if (!(await isProblemOpen(p.id))) throw new ServiceError("Discussion opens when the contest ends.", 423);
    return { title: p.title, backHref: `/practice/${p.slug}` };
  }
  const [l] = await db.select().from(schema.lessons).where(and(eq(schema.lessons.id, scopeId), eq(schema.lessons.published, true), isNull(schema.lessons.deletedAt)));
  if (!l) throw new ServiceError("Not found", 404);
  return { title: l.title, backHref: "/learn" };
}

export async function listThreads(scope: Scope, scopeId: string) {
  const meta = await assertScopeReadable(scope, scopeId);
  const T = schema.discussionThreads;
  const rows = await getDb()
    .select({ id: T.id, title: T.title, createdAt: T.createdAt, author: schema.users.displayName, username: schema.users.username, replies: sql<number>`(select count(*)::int from discussion_posts p where p.thread_id = ${T.id} and p.deleted_at is null)` })
    .from(T)
    .innerJoin(schema.users, eq(schema.users.id, T.authorId))
    .where(and(eq(T.scopeType, scope), eq(T.scopeId, scopeId), isNull(T.deletedAt)))
    .orderBy(desc(T.createdAt))
    .limit(100);
  return { ...meta, threads: rows };
}

export async function createThread(userId: string, scope: Scope, scopeId: string, titleRaw: string, bodyRaw: string): Promise<string> {
  await assertScopeReadable(scope, scopeId);
  const title = titleRaw.trim();
  const body = bodyRaw.trim();
  if (title.length < 3 || title.length > 120) throw new ServiceError("Title must be 3 to 120 characters", 400);
  if (body.length < 1 || body.length > BODY_MAX) throw new ServiceError(`Message must be 1 to ${BODY_MAX} characters`, 400);
  await assertNotFlooding(userId);
  const [t] = await getDb().insert(schema.discussionThreads).values({ scopeType: scope, scopeId, authorId: userId, title, body }).returning({ id: schema.discussionThreads.id });
  return t!.id;
}

/** At most 8 posts or threads per user per minute, counted from the database so it works on every instance. */
async function assertNotFlooding(userId: string): Promise<void> {
  const r = await getDb().execute(sql`select ((select count(*) from discussion_threads where author_id = ${userId} and created_at > now() - interval '1 minute') + (select count(*) from discussion_posts where author_id = ${userId} and created_at > now() - interval '1 minute'))::int as n`);
  if (Number((r.rows[0] as { n: number }).n) >= 8) throw new ServiceError("You are posting too fast. Try again in a minute.", 429);
}

export async function getThread(threadId: string) {
  const T = schema.discussionThreads;
  const [t] = await getDb()
    .select({ id: T.id, scopeType: T.scopeType, scopeId: T.scopeId, title: T.title, body: T.body, createdAt: T.createdAt, authorId: T.authorId, author: schema.users.displayName, username: schema.users.username })
    .from(T)
    .innerJoin(schema.users, eq(schema.users.id, T.authorId))
    .where(and(eq(T.id, threadId), isNull(T.deletedAt)));
  if (!t) throw new ServiceError("Thread not found", 404);
  const meta = await assertScopeReadable(t.scopeType as Scope, t.scopeId);
  const P = schema.discussionPosts;
  const posts = await getDb()
    .select({ id: P.id, body: P.body, createdAt: P.createdAt, authorId: P.authorId, author: schema.users.displayName, username: schema.users.username })
    .from(P)
    .innerJoin(schema.users, eq(schema.users.id, P.authorId))
    .where(and(eq(P.threadId, threadId), isNull(P.deletedAt)))
    .orderBy(asc(P.createdAt))
    .limit(300);
  return { thread: t, posts, ...meta };
}

export async function reply(userId: string, threadId: string, bodyRaw: string): Promise<void> {
  await getThread(threadId); // also enforces scope visibility
  const body = bodyRaw.trim();
  if (body.length < 1 || body.length > BODY_MAX) throw new ServiceError(`Message must be 1 to ${BODY_MAX} characters`, 400);
  await assertNotFlooding(userId);
  await getDb().insert(schema.discussionPosts).values({ threadId, authorId: userId, body });
}

/** Authors can delete their own messages; admins and content editors can delete any (moderation). */
export async function deleteThread(userId: string, role: string, threadId: string): Promise<void> {
  const [t] = await getDb().select().from(schema.discussionThreads).where(and(eq(schema.discussionThreads.id, threadId), isNull(schema.discussionThreads.deletedAt)));
  if (!t) throw new ServiceError("Thread not found", 404);
  if (t.authorId !== userId && !isStaff(role)) throw new ServiceError("You cannot delete this", 403);
  await getDb().update(schema.discussionThreads).set({ deletedAt: new Date() }).where(eq(schema.discussionThreads.id, threadId));
}

export async function deletePost(userId: string, role: string, postId: string): Promise<void> {
  const [p] = await getDb().select().from(schema.discussionPosts).where(and(eq(schema.discussionPosts.id, postId), isNull(schema.discussionPosts.deletedAt)));
  if (!p) throw new ServiceError("Message not found", 404);
  if (p.authorId !== userId && !isStaff(role)) throw new ServiceError("You cannot delete this", 403);
  await getDb().update(schema.discussionPosts).set({ deletedAt: new Date() }).where(eq(schema.discussionPosts.id, postId));
}

/** Public profile data for /u/[username]. Only what a learner would put on a public page. */
export async function getPublicProfile(username: string) {
  const [u] = await getDb().select().from(schema.users).where(and(eq(schema.users.username, username.toLowerCase()), isNull(schema.users.deletedAt)));
  if (!u) throw new ServiceError("Learner not found", 404);
  const [st] = await getDb().select().from(schema.userStats).where(eq(schema.userStats.userId, u.id));
  const solved = await getDb().execute(sql`select count(*)::int n from user_problem_progress where user_id = ${u.id} and solved`);
  const ach = await getDb()
    .select({ title: schema.achievements.title })
    .from(schema.userAchievements)
    .innerJoin(schema.achievements, eq(schema.achievements.id, schema.userAchievements.achievementId))
    .where(eq(schema.userAchievements.userId, u.id))
    .orderBy(asc(schema.achievements.position));
  const rating = await getDb().select().from(schema.userRatings).where(eq(schema.userRatings.userId, u.id));
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    bio: u.bio,
    avatarColor: u.avatarColor,
    joined: u.createdAt,
    level: levelFromXp(st?.totalXp ?? 0),
    totalXp: st?.totalXp ?? 0,
    streak: st?.currentStreak ?? 0,
    lessons: st?.lessonsCompleted ?? 0,
    solved: Number((solved.rows[0] as { n: number }).n),
    achievements: ach.map((a) => a.title),
    rating: rating[0] && rating[0].contestsRated > 0 ? rating[0].rating : null,
  };
}
