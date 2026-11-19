import { QUESTION_TYPES, type QuestionType } from "@/features/learning/types";
import { grade, publicData } from "@/features/learning/grader";

/** Plain-text form fields (one item per line) turned into the stored question shape. */
export type QuestionFormInput = {
  type: string;
  prompt: string;
  code?: string;
  explanation: string;
  /** options / lines / left column: one per line */
  items?: string;
  /** match_concept right column: one per line */
  right?: string;
  /** correct option number (1-based) for choice questions */
  correct?: string;
  /** fill_blank: accepted answers, one per line */
  accepted?: string;
  /** arrange_code: correct order of the lines as 1-based numbers, e.g. "2,1,3" */
  order?: string;
  /** match_concept: for each left row, the 1-based number of its right item, e.g. "2,1,3" */
  pairs?: string;
  /** fill_blank: optional word bank, one per line */
  bank?: string;
  xp?: string;
};

export type BuiltQuestion = { type: QuestionType; prompt: string; code: string | null; data: Record<string, unknown>; answer: Record<string, unknown>; explanation: string; xp: number };

export class QuestionFormError extends Error {}

const lines = (s?: string) => (s ?? "").split(/\r?\n/).map((x) => x.replace(/\s+$/, "")).filter((x) => x.trim() !== "");
const nums = (s: string | undefined, what: string) => {
  const parts = (s ?? "").split(/[,\s]+/).filter(Boolean);
  if (!parts.length) throw new QuestionFormError(`${what} is required`);
  return parts.map((p) => {
    if (!/^\d+$/.test(p)) throw new QuestionFormError(`${what} must be whole numbers separated by commas`);
    return Number(p) - 1;
  });
};

export function buildQuestion(f: QuestionFormInput): BuiltQuestion {
  const type = f.type as QuestionType;
  if (!QUESTION_TYPES.includes(type)) throw new QuestionFormError("Unknown question type");
  const prompt = f.prompt.trim();
  const explanation = f.explanation.trim();
  if (prompt.length < 3 || prompt.length > 2000) throw new QuestionFormError("Prompt must be 3 to 2000 characters");
  if (explanation.length < 3 || explanation.length > 4000) throw new QuestionFormError("Explanation is required (shown after answering)");
  const code = f.code && f.code.trim() ? f.code.replace(/\s+$/, "") : null;
  if (code && code.length > 8000) throw new QuestionFormError("Code is too long");
  const xp = f.xp ? Number(f.xp) : 2;
  if (!Number.isInteger(xp) || xp < 0 || xp > 20) throw new QuestionFormError("Question XP must be 0 to 20");

  let data: Record<string, unknown> = {};
  let answer: Record<string, unknown> = {};
  switch (type) {
    case "multiple_choice":
    case "true_false":
    case "predict_output":
    case "find_bug": {
      const options = type === "true_false" && lines(f.items).length === 0 ? ["True", "False"] : lines(f.items);
      if (options.length < 2 || options.length > 8) throw new QuestionFormError("Give 2 to 8 options, one per line");
      if (new Set(options.map((o) => o.trim())).size !== options.length) throw new QuestionFormError("Options must be different from each other");
      if (type === "true_false" && options.length !== 2) throw new QuestionFormError("True/false needs exactly 2 options");
      const [idx] = nums(f.correct, "Correct option");
      if (idx === undefined || idx < 0 || idx >= options.length) throw new QuestionFormError("Correct option number is out of range");
      data = { options };
      answer = { index: idx };
      break;
    }
    case "fill_blank": {
      const accepted = lines(f.accepted);
      if (!accepted.length) throw new QuestionFormError("Give at least one accepted answer");
      if (!/_{2,}|\?\?\?/.test(`${prompt}\n${code ?? ""}`)) throw new QuestionFormError("Show the blank as ___ in the prompt or code");
      const bank = lines(f.bank);
      data = bank.length ? { bank } : {};
      answer = { accepted };
      break;
    }
    case "arrange_code": {
      const items = lines(f.items);
      if (items.length < 2 || items.length > 12) throw new QuestionFormError("Give 2 to 12 lines of code, in shuffled order");
      const order = nums(f.order, "Correct order");
      const sorted = [...order].sort((a, b) => a - b);
      if (order.length !== items.length || sorted.some((v, i) => v !== i)) throw new QuestionFormError("Correct order must use every line number exactly once");
      if (order.every((v, i) => v === i)) throw new QuestionFormError("The lines are already in the right order. Shuffle them.");
      data = { lines: items };
      answer = { order };
      break;
    }
    case "match_concept": {
      const left = lines(f.items);
      const right = lines(f.right);
      if (left.length < 2 || left.length > 8 || right.length !== left.length) throw new QuestionFormError("Give 2 to 8 rows on each side, the same number on both");
      const pairs = nums(f.pairs, "Pairs");
      if (pairs.length !== left.length || [...pairs].sort((a, b) => a - b).some((v, i) => v !== i)) throw new QuestionFormError("Pairs must use every right-hand item exactly once");
      data = { left, right };
      answer = { pairs };
      break;
    }
  }

  // Dry run: the stored answer must grade the canonical response as correct and must not appear in the public payload.
  const response = canonicalResponse(type, answer);
  let result;
  try {
    result = grade(type, data, answer, response);
  } catch {
    throw new QuestionFormError("This question could not be graded. Check the fields.");
  }
  if (!result.correct) throw new QuestionFormError("The stored answer does not grade as correct. Check the fields.");
  const pub = publicData(type, data);
  if ("answer" in pub || "index" in pub || "accepted" in pub || "order" in pub || "pairs" in pub) throw new QuestionFormError("Public data would leak the answer");
  return { type, prompt, code, data, answer, explanation, xp };
}

export function canonicalResponse(type: QuestionType, answer: Record<string, unknown>) {
  switch (type) {
    case "fill_blank":
      return { text: (answer.accepted as string[])[0] ?? "" };
    case "arrange_code":
      return { order: answer.order as number[] };
    case "match_concept":
      return { pairs: answer.pairs as number[] };
    default:
      return { index: answer.index as number };
  }
}

/** Reverse of buildQuestion, to pre-fill the edit form. */
export function questionToForm(q: { type: string; prompt: string; code: string | null; data: Record<string, unknown>; answer: Record<string, unknown>; explanation: string; xp: number }): QuestionFormInput {
  const d = q.data as { options?: string[]; lines?: string[]; left?: string[]; right?: string[]; bank?: string[] };
  const a = q.answer as { index?: number; accepted?: string[]; order?: number[]; pairs?: number[] };
  return {
    type: q.type,
    prompt: q.prompt,
    code: q.code ?? "",
    explanation: q.explanation,
    xp: String(q.xp),
    items: (d.options ?? d.lines ?? d.left ?? []).join("\n"),
    right: (d.right ?? []).join("\n"),
    bank: (d.bank ?? []).join("\n"),
    correct: a.index !== undefined ? String(a.index + 1) : "",
    accepted: (a.accepted ?? []).join("\n"),
    order: (a.order ?? []).map((n) => n + 1).join(","),
    pairs: (a.pairs ?? []).map((n) => n + 1).join(","),
  };
}
