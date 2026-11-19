import { eq } from "drizzle-orm";
import { z } from "zod";
import { XP_RULES } from "@/features/gamification/xp";
import { getDb, schema } from "@/server/db/client";

/** XP rules an admin may change (the per-lesson reward is edited on the lesson itself). Anything not overridden falls back to the code defaults in XP_RULES. */
export const xpRulesSchema = z.object({
  perfectBonus: z.number().int().min(0).max(500),
  problem: z.record(z.string(), z.number().int().min(0).max(1000)),
  streakMilestones: z.record(z.string().regex(/^\d+$/), z.number().int().min(0).max(5000)),
});
export type XpRules = { perfectBonus: number; problem: Record<string, number>; streakMilestones: Record<number, number> };

export const defaultXpRules = (): XpRules => ({
  perfectBonus: XP_RULES.perfectBonus,
  problem: { ...XP_RULES.problem },
  streakMilestones: { ...XP_RULES.streakMilestones },
});

const KEY = "xp_rules";
let cache: { at: number; rules: XpRules } | null = null;
const TTL_MS = 15_000;

export function clearSettingsCache(): void {
  cache = null;
}

/** Effective XP rules (defaults merged with admin overrides). Cached for a few seconds per instance. */
export async function getXpRules(): Promise<XpRules> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rules;
  const rules = defaultXpRules();
  const [row] = await getDb().select().from(schema.appSettings).where(eq(schema.appSettings.key, KEY));
  const parsed = xpRulesSchema.partial().safeParse(row?.value);
  if (parsed.success) {
    const v = parsed.data;
    if (v.perfectBonus !== undefined) rules.perfectBonus = v.perfectBonus;
    if (v.problem) rules.problem = { ...rules.problem, ...v.problem };
    if (v.streakMilestones) rules.streakMilestones = Object.fromEntries(Object.entries(v.streakMilestones).map(([k, x]) => [Number(k), x]));
  }
  cache = { at: Date.now(), rules };
  return rules;
}

export async function saveXpRules(value: z.infer<typeof xpRulesSchema>): Promise<void> {
  const v = xpRulesSchema.parse(value);
  await getDb()
    .insert(schema.appSettings)
    .values({ key: KEY, value: v })
    .onConflictDoUpdate({ target: schema.appSettings.key, set: { value: v, updatedAt: new Date() } });
  clearSettingsCache();
}
