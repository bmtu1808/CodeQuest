import { describe, expect, it } from "vitest";
import { WORLDS } from "@/content";
import { EXTERNAL_BY_UNIT } from "@/content/external-problems";

describe("curriculum content", () => {
  const units = WORLDS.flatMap((w) => w.units);
  it("has unique slugs and enough questions per lesson", () => {
    expect(new Set(WORLDS.map((w) => w.slug)).size).toBe(WORLDS.length);
    for (const w of WORLDS) {
      expect(new Set(w.units.map((u) => u.slug)).size).toBe(w.units.length);
      for (const u of w.units) {
        expect(new Set(u.lessons.map((l) => l.slug)).size).toBe(u.lessons.length);
        for (const l of u.lessons) expect(l.questions.length).toBeGreaterThanOrEqual(5);
      }
    }
  });
  it("every unit has a pool large enough for a skip test", () => {
    for (const u of units) expect(u.lessons.reduce((s, l) => s + l.questions.length, 0)).toBeGreaterThanOrEqual(6);
  });
  it("external problem links point at known judges and reference real unit slugs", () => {
    const slugs = new Set(units.map((u) => u.slug));
    const hosts = ["cses.fi", "codeforces.com", "atcoder.jp", "oj.vnoi.info"];
    for (const [slug, list] of Object.entries(EXTERNAL_BY_UNIT)) {
      expect(slugs.has(slug), slug).toBe(true);
      expect(new Set(list.map((p) => p.url)).size).toBe(list.length);
      for (const p of list) expect(hosts).toContain(new URL(p.url).hostname);
    }
  });
});
