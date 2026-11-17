import { describe, expect, it } from "vitest";
import { dailyGoalXp, levelFromXp, levelTitle, xpToReachLevel } from "@/features/gamification/xp";
import { addDays, applyActivity, daysBetween, effectiveStreak, streakAtRisk, toLocalDay } from "@/features/gamification/streak";

describe("level curve", () => {
  it("starts at level 1 with 0 xp", () => {
    const l = levelFromXp(0);
    expect(l.level).toBe(1);
    expect(l.xpIntoLevel).toBe(0);
    expect(l.xpForNext).toBe(100);
  });
  it("levels up exactly at the threshold", () => {
    expect(levelFromXp(99).level).toBe(1);
    expect(levelFromXp(100).level).toBe(2);
    expect(levelFromXp(xpToReachLevel(5) - 1).level).toBe(4);
    expect(levelFromXp(xpToReachLevel(5)).level).toBe(5);
  });
  it("is monotonic and caps at 100", () => {
    let prev = 0;
    for (let l = 1; l <= 100; l++) {
      const need = xpToReachLevel(l);
      expect(need).toBeGreaterThanOrEqual(prev);
      prev = need;
    }
    const max = levelFromXp(10_000_000);
    expect(max.level).toBe(100);
    expect(max.isMax).toBe(true);
    expect(max.progress).toBe(1);
  });
  it("progress is within [0,1]", () => {
    for (const xp of [0, 1, 50, 99, 100, 250, 5000]) {
      const p = levelFromXp(xp).progress;
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });
  it("maps titles per spec", () => {
    expect(levelTitle(1)).toBe("Beginner");
    expect(levelTitle(5)).toBe("Apprentice");
    expect(levelTitle(10)).toBe("Programmer");
    expect(levelTitle(49)).toBe("Code Warrior");
    expect(levelTitle(50)).toBe("Competitive Programmer");
    expect(levelTitle(100)).toBe("Grandmaster");
  });
  it("derives a daily goal from minutes", () => {
    expect(dailyGoalXp(5)).toBe(20);
    expect(dailyGoalXp(10)).toBe(40);
    expect(dailyGoalXp(30)).toBe(80);
  });
});

describe("streak", () => {
  const empty = { current: 0, longest: 0, lastActiveDate: null };
  it("starts a streak on first activity", () => {
    const r = applyActivity(empty, "2026-03-01");
    expect(r.state).toEqual({ current: 1, longest: 1, lastActiveDate: "2026-03-01" });
    expect(r.extended).toBe(true);
  });
  it("is idempotent within a day", () => {
    const a = applyActivity(empty, "2026-03-01").state;
    const b = applyActivity(a, "2026-03-01");
    expect(b.extended).toBe(false);
    expect(b.state.current).toBe(1);
  });
  it("extends on consecutive days and tracks longest", () => {
    let s = applyActivity(empty, "2026-03-01").state;
    s = applyActivity(s, "2026-03-02").state;
    s = applyActivity(s, "2026-03-03").state;
    expect(s.current).toBe(3);
    expect(s.longest).toBe(3);
  });
  it("resets after a missed day but keeps longest", () => {
    let s = applyActivity(empty, "2026-03-01").state;
    s = applyActivity(s, "2026-03-02").state;
    s = applyActivity(s, "2026-03-05").state;
    expect(s.current).toBe(1);
    expect(s.longest).toBe(2);
  });
  it("handles month and year boundaries", () => {
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(daysBetween("2026-12-31", "2027-01-01")).toBe(1);
    const s = applyActivity({ current: 4, longest: 4, lastActiveDate: "2026-12-31" }, "2027-01-01").state;
    expect(s.current).toBe(5);
  });
  it("effective streak expires after a full missed day", () => {
    const s = { current: 6, longest: 6, lastActiveDate: "2026-03-01" };
    expect(effectiveStreak(s, "2026-03-01")).toBe(6);
    expect(effectiveStreak(s, "2026-03-02")).toBe(6);
    expect(effectiveStreak(s, "2026-03-03")).toBe(0);
    expect(streakAtRisk(s, "2026-03-02")).toBe(true);
    expect(streakAtRisk(s, "2026-03-01")).toBe(false);
  });
  it("computes the local day per timezone", () => {
    const d = new Date("2026-03-01T18:30:00Z");
    expect(toLocalDay(d, "UTC")).toBe("2026-03-01");
    expect(toLocalDay(d, "Asia/Ho_Chi_Minh")).toBe("2026-03-02");
    expect(toLocalDay(d, "America/Los_Angeles")).toBe("2026-03-01");
    expect(toLocalDay(d, "Not/AZone")).toBe("2026-03-01");
  });
});
