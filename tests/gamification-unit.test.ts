import { describe, expect, it } from "vitest";
import { applyHeartChange, currentHearts, HEART_REGEN_MS, MAX_HEARTS } from "@/features/gamification/hearts";
import { assignRanks, isPeriod, periodStart } from "@/features/gamification/periods";
import { pickQuests } from "@/features/gamification/quests";
import { ACHIEVEMENTS, QUESTS } from "@/content/gamification";

const T0 = new Date("2026-03-04T10:00:00Z");
const at = (ms: number) => new Date(T0.getTime() + ms);

describe("hearts", () => {
  it("is full by default and never exceeds the maximum", () => {
    expect(currentHearts(5, T0, at(99 * HEART_REGEN_MS))).toEqual({ hearts: 5, nextAt: null });
  });
  it("regenerates one heart per interval and reports when the next arrives", () => {
    expect(currentHearts(2, T0, at(HEART_REGEN_MS - 1))).toEqual({ hearts: 2, nextAt: T0.getTime() + HEART_REGEN_MS });
    expect(currentHearts(2, T0, at(HEART_REGEN_MS))).toEqual({ hearts: 3, nextAt: T0.getTime() + 2 * HEART_REGEN_MS });
    expect(currentHearts(0, T0, at(10 * HEART_REGEN_MS)).hearts).toBe(MAX_HEARTS);
  });
  it("spending from full starts the clock; spending while missing keeps the running clock", () => {
    const a = applyHeartChange(5, T0, at(0), -1);
    expect(a).toEqual({ hearts: 4, updatedAt: at(0) });
    // 3 hearts missing two; 40 minutes later one is back (4). Spending one must keep the clock running, so the
    // next heart still arrives at the 60-minute mark and the 10 minutes already elapsed are not lost.
    const now = at(40 * 60_000);
    const b = applyHeartChange(3, T0, now, -1);
    expect(b.hearts).toBe(3);
    expect(currentHearts(b.hearts, b.updatedAt, now).nextAt).toBe(at(60 * 60_000).getTime());
    // regenerating all the way back to full then spending restarts the clock from "now"
    const c = applyHeartChange(4, T0, now, -1);
    expect(c.hearts).toBe(4);
    expect(currentHearts(c.hearts, c.updatedAt, now).nextAt).toBe(now.getTime() + HEART_REGEN_MS);
  });
  it("cannot go below zero or above max", () => {
    expect(applyHeartChange(0, T0, T0, -1).hearts).toBe(0);
    expect(applyHeartChange(5, T0, T0, 1).hearts).toBe(5);
  });
});

describe("leaderboard periods", () => {
  const now = new Date("2026-11-18T05:00:00Z"); // a Wednesday
  it("computes UTC boundaries", () => {
    expect(periodStart("daily", now)?.toISOString()).toBe("2026-11-18T00:00:00.000Z");
    expect(periodStart("weekly", now)?.toISOString()).toBe("2026-11-16T00:00:00.000Z");
    expect(periodStart("monthly", now)?.toISOString()).toBe("2026-11-01T00:00:00.000Z");
    expect(periodStart("all", now)).toBeNull();
  });
  it("weekly start on a Sunday goes back to Monday", () => {
    expect(periodStart("weekly", new Date("2026-11-22T23:59:00Z"))?.toISOString()).toBe("2026-11-16T00:00:00.000Z");
  });
  it("validates period names", () => {
    expect(isPeriod("weekly")).toBe(true);
    expect(isPeriod("friends")).toBe(false);
  });
  it("ranks ties equally (1,2,2,4)", () => {
    expect(assignRanks([{ xp: 50 }, { xp: 40 }, { xp: 40 }, { xp: 10 }]).map((r) => r.rank)).toEqual([1, 2, 2, 4]);
  });
});

describe("daily quests", () => {
  it("is deterministic per (user, day) and varies across days", () => {
    const a = pickQuests(QUESTS, "u1:2026-01-01", 3).map((q) => q.slug);
    expect(pickQuests(QUESTS, "u1:2026-01-01", 3).map((q) => q.slug)).toEqual(a);
    const days = new Set(Array.from({ length: 20 }, (_, i) => pickQuests(QUESTS, `u1:2026-01-${i + 1}`, 3).map((q) => q.slug).join()));
    expect(days.size).toBeGreaterThan(5);
  });
  it("gives distinct quests with distinct metrics", () => {
    for (let i = 0; i < 50; i++) {
      const p = pickQuests(QUESTS, `u${i}:d`, 3);
      expect(new Set(p.map((q) => q.slug)).size).toBe(3);
      expect(new Set(p.map((q) => q.metric)).size).toBe(3);
    }
  });
});

describe("content definitions meet the spec", () => {
  it("has at least 10 quests and 15 achievements with unique slugs", () => {
    expect(QUESTS.length).toBeGreaterThanOrEqual(10);
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(15);
    expect(new Set(QUESTS.map((q) => q.slug)).size).toBe(QUESTS.length);
    expect(new Set(ACHIEVEMENTS.map((a) => a.slug)).size).toBe(ACHIEVEMENTS.length);
  });
});
