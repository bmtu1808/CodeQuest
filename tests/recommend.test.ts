import { describe, expect, it } from "vitest";
import { isValidOption, recommendWorld } from "@/features/learning/recommend";

describe("recommendWorld", () => {
  it("sends complete beginners to the foundations", () => {
    expect(recommendWorld({ knowsProgramming: "no", knowsCpp: "no", selfLevel: "beginner" })).toBe("cpp-foundations");
  });
  it("sends learners who know the basics to intermediate", () => {
    expect(recommendWorld({ knowsProgramming: "yes", knowsCpp: "basics", selfLevel: "intermediate" })).toBe("cpp-intermediate");
  });
  it("sends experienced competitive programmers to algorithms", () => {
    expect(recommendWorld({ knowsProgramming: "yes", knowsCpp: "yes", selfLevel: "advanced" })).toBe("algorithms");
  });
  it("does not trust an 'advanced' label without C++ knowledge", () => {
    expect(recommendWorld({ knowsProgramming: "yes", knowsCpp: "no", selfLevel: "advanced" })).toBe("cpp-foundations");
  });
  it("validates option values", () => {
    expect(isValidOption("goal", "contests")).toBe(true);
    expect(isValidOption("goal", "hack")).toBe(false);
  });
});
