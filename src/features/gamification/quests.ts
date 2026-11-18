/** Deterministic daily quest selection. Pure. */

function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * Pick `n` distinct quests for a user on a given day. The same (user, day) always gives the same quests,
 * different users and days get different mixes. Never picks two quests with the same metric when avoidable.
 */
export function pickQuests<T extends { slug: string; metric: string }>(pool: T[], seed: string, n: number): T[] {
  const ranked = [...pool].sort((a, b) => fnv1a(`${seed}:${a.slug}`) - fnv1a(`${seed}:${b.slug}`) || a.slug.localeCompare(b.slug));
  const out: T[] = [];
  const metrics = new Set<string>();
  for (const q of ranked) {
    if (out.length >= n) break;
    if (metrics.has(q.metric)) continue;
    out.push(q);
    metrics.add(q.metric);
  }
  for (const q of ranked) {
    if (out.length >= n) break;
    if (!out.includes(q)) out.push(q);
  }
  return out;
}
