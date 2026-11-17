import { describe, expect, it } from "vitest";
import { grade, normalizeText, publicData } from "@/features/learning/grader";

describe("grader", () => {
  const mc = { options: ["5", "8", "3", "Error"] };
  it("grades multiple choice by index", () => {
    expect(grade("multiple_choice", mc, { index: 1 }, { index: 1 })).toEqual({ correct: true, correctAnswer: "8" });
    expect(grade("multiple_choice", mc, { index: 1 }, { index: 0 }).correct).toBe(false);
  });
  it("grades fill in the blank ignoring whitespace", () => {
    const ans = { accepted: ["cout", "std::cout"] };
    expect(grade("fill_blank", {}, ans, { text: "  cout " }).correct).toBe(true);
    expect(grade("fill_blank", {}, ans, { text: "std::cout" }).correct).toBe(true);
    expect(grade("fill_blank", {}, ans, { text: "cin" }).correct).toBe(false);
  });
  it("normalises punctuation spacing", () => {
    expect(normalizeText("int x = 5 ;")).toBe("int x = 5;");
    expect(normalizeText("a  <<  b")).toBe("a<<b");
  });
  it("grades arrange_code by exact order", () => {
    const data = { lines: ["b", "a", "c"] };
    const ans = { order: [1, 0, 2] };
    expect(grade("arrange_code", data, ans, { order: [1, 0, 2] }).correct).toBe(true);
    expect(grade("arrange_code", data, ans, { order: [0, 1, 2] }).correct).toBe(false);
    expect(grade("arrange_code", data, ans, { order: [1, 0] }).correct).toBe(false);
  });
  it("grades match_concept", () => {
    const data = { left: ["a", "b"], right: ["x", "y"] };
    expect(grade("match_concept", data, { pairs: [1, 0] }, { pairs: [1, 0] }).correct).toBe(true);
    expect(grade("match_concept", data, { pairs: [1, 0] }, { pairs: [0, 1] }).correct).toBe(false);
  });
  it("rejects a response of the wrong shape", () => {
    expect(() => grade("multiple_choice", mc, { index: 1 }, { text: "x" })).toThrow();
  });
  it("never exposes the answer in public data", () => {
    const pub = publicData("multiple_choice", { options: ["a", "b"], index: 1, answer: 1 });
    expect(JSON.stringify(pub)).not.toContain("index");
    expect(Object.keys(pub)).toEqual(["options"]);
  });
});
