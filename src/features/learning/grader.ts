import { z } from "zod";
import type { GradeResult, QuestionType } from "./types";

/**
 * Server-side grading. Answer payloads (`answer`) are stored per question type:
 *  - multiple_choice | true_false | predict_output | find_bug: { index: number }   (options in data.options)
 *  - fill_blank:   { accepted: string[] }                                         (compared after whitespace normalisation)
 *  - arrange_code: { order: number[] }  indices into data.lines, in correct order
 *  - match_concept:{ pairs: number[] }  pairs[i] = index into data.right for data.left[i]
 */

export const responseSchema = z.union([
  z.object({ index: z.number().int().min(0).max(20) }),
  z.object({ text: z.string().max(200) }),
  z.object({ order: z.array(z.number().int().min(0).max(50)).max(50) }),
  z.object({ pairs: z.array(z.number().int().min(0).max(50)).max(50) }),
]);
export type QuestionResponse = z.infer<typeof responseSchema>;

const indexAnswer = z.object({ index: z.number().int() });
const fillAnswer = z.object({ accepted: z.array(z.string()).min(1) });
const orderAnswer = z.object({ order: z.array(z.number().int()).min(1) });
const pairsAnswer = z.object({ pairs: z.array(z.number().int()).min(1) });
const optionsData = z.object({ options: z.array(z.string()).min(2) });
const linesData = z.object({ lines: z.array(z.string()).min(2) });
const matchData = z.object({ left: z.array(z.string()), right: z.array(z.string()) });

export function normalizeText(s: string): string {
  return s.trim().replace(/\s+/g, " ").replace(/\s*([;(){}<>,])\s*/g, "$1");
}

export class GradingError extends Error {}

export function grade(
  type: QuestionType,
  data: Record<string, unknown>,
  answer: Record<string, unknown>,
  response: QuestionResponse,
): GradeResult {
  switch (type) {
    case "multiple_choice":
    case "true_false":
    case "predict_output":
    case "find_bug": {
      const a = indexAnswer.parse(answer);
      const opts = optionsData.parse(data).options;
      if (!("index" in response)) throw new GradingError("Expected an option index");
      return { correct: response.index === a.index, correctAnswer: opts[a.index] ?? "" };
    }
    case "fill_blank": {
      const a = fillAnswer.parse(answer);
      if (!("text" in response)) throw new GradingError("Expected text");
      const given = normalizeText(response.text);
      const ok = a.accepted.some((x) => normalizeText(x) === given);
      return { correct: ok, correctAnswer: a.accepted[0] ?? "" };
    }
    case "arrange_code": {
      const a = orderAnswer.parse(answer);
      const lines = linesData.parse(data).lines;
      if (!("order" in response)) throw new GradingError("Expected an order");
      const ok = response.order.length === a.order.length && response.order.every((v, i) => v === a.order[i]);
      return { correct: ok, correctAnswer: a.order.map((i) => lines[i] ?? "").join("\n") };
    }
    case "match_concept": {
      const a = pairsAnswer.parse(answer);
      const d = matchData.parse(data);
      if (!("pairs" in response)) throw new GradingError("Expected pairs");
      const ok = response.pairs.length === a.pairs.length && response.pairs.every((v, i) => v === a.pairs[i]);
      return { correct: ok, correctAnswer: d.left.map((l, i) => `${l} → ${d.right[a.pairs[i] ?? 0] ?? ""}`).join("\n") };
    }
  }
}

/** Remove server-only fields before sending a question to the browser. */
export function publicData(type: QuestionType, data: Record<string, unknown>): Record<string, unknown> {
  // `data` never holds answers by contract; this re-validates the shape so a bad CMS entry can't leak one.
  switch (type) {
    case "multiple_choice":
    case "true_false":
    case "predict_output":
    case "find_bug":
      return { options: optionsData.parse(data).options };
    case "fill_blank": {
      const bank = z.object({ bank: z.array(z.string()).optional() }).parse(data);
      return bank.bank ? { bank: bank.bank } : {};
    }
    case "arrange_code":
      return { lines: linesData.parse(data).lines };
    case "match_concept": {
      const d = matchData.parse(data);
      return { left: d.left, right: d.right };
    }
  }
}
