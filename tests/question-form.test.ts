import { describe, expect, it } from "vitest";
import { buildQuestion, QuestionFormError, questionToForm } from "@/features/admin/question-form";
import { grade, publicData } from "@/features/learning/grader";

const base = { prompt: "What does this print?", explanation: "Because of how it works." };

describe("question form builder", () => {
  it("builds a multiple choice question with a 0-based answer", () => {
    const q = buildQuestion({ ...base, type: "multiple_choice", items: "1\n2\n3", correct: "2" });
    expect(q.data).toEqual({ options: ["1", "2", "3"] });
    expect(q.answer).toEqual({ index: 1 });
    expect(grade("multiple_choice", q.data, q.answer, { index: 1 }).correct).toBe(true);
    expect(grade("multiple_choice", q.data, q.answer, { index: 0 }).correct).toBe(false);
  });

  it("defaults true/false options", () => {
    const q = buildQuestion({ ...base, type: "true_false", correct: "1" });
    expect(q.data).toEqual({ options: ["True", "False"] });
  });

  it("never puts the answer in the public payload", () => {
    for (const q of [
      buildQuestion({ ...base, type: "multiple_choice", items: "a\nb", correct: "1" }),
      buildQuestion({ ...base, type: "arrange_code", items: "b\na\nc", order: "2,1,3" }),
      buildQuestion({ ...base, type: "match_concept", items: "x\ny", right: "1\n2", pairs: "2,1" }),
      buildQuestion({ ...base, prompt: "Fill ___", type: "fill_blank", accepted: "int" }),
    ]) {
      const pub = JSON.stringify(publicData(q.type, q.data));
      expect(pub).not.toMatch(/"(index|order|pairs|accepted)"/);
    }
  });

  it("validates each type", () => {
    const bad = (x: Record<string, string>) => expect(() => buildQuestion({ ...base, type: "multiple_choice", ...x })).toThrow(QuestionFormError);
    bad({ items: "only one", correct: "1" });
    bad({ items: "a\na", correct: "1" });
    bad({ items: "a\nb", correct: "3" });
    bad({ items: "a\nb", correct: "x" });
    expect(() => buildQuestion({ ...base, type: "nope" })).toThrow(/Unknown/);
    expect(() => buildQuestion({ ...base, type: "fill_blank", accepted: "int" })).toThrow(/blank/);
    expect(() => buildQuestion({ ...base, type: "arrange_code", items: "a\nb\nc", order: "1,2,3" })).toThrow(/Shuffle/);
    expect(() => buildQuestion({ ...base, type: "arrange_code", items: "a\nb\nc", order: "1,1,2" })).toThrow(/exactly once/);
    expect(() => buildQuestion({ ...base, type: "match_concept", items: "a\nb", right: "1", pairs: "1,2" })).toThrow(/same number/);
    expect(() => buildQuestion({ ...base, explanation: "", type: "true_false", correct: "1" })).toThrow(/Explanation/);
  });

  it("round-trips through questionToForm", () => {
    const q = buildQuestion({ ...base, type: "arrange_code", items: "b\na\nc", order: "2,1,3" });
    const again = buildQuestion(questionToForm(q));
    expect(again.answer).toEqual(q.answer);
    expect(again.data).toEqual(q.data);
  });
});
