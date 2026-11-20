import type { QuestionSeed } from "./types";

/** Multiple choice: `correct` is the index into `options`. */
export function mc(prompt: string, options: string[], correct: number, explanation: string, code?: string): QuestionSeed {
  return { type: "multiple_choice", prompt, code, data: { options }, answer: { index: correct }, explanation };
}

export function tf(statement: string, isTrue: boolean, explanation: string, code?: string): QuestionSeed {
  return { type: "true_false", prompt: statement, code, data: { options: ["True", "False"] }, answer: { index: isTrue ? 0 : 1 }, explanation };
}

/** `code` contains `___` where the learner types. */
export function fill(prompt: string, code: string, accepted: string[], explanation: string, bank?: string[]): QuestionSeed {
  return { type: "fill_blank", prompt, code, data: bank ? { bank } : {}, answer: { accepted }, explanation };
}

/**
 * Predict the output. The `code` is verified by scripts/verify-content.ts: it is compiled with g++ and
 * the real stdout must equal options[correct] (whitespace-normalised).
 */
export function predict(code: string, options: string[], correct: number, explanation: string, prompt = "What does this program print?"): QuestionSeed {
  return { type: "predict_output", prompt, code, data: { options }, answer: { index: correct }, explanation };
}

export function bug(prompt: string, code: string, options: string[], correct: number, explanation: string): QuestionSeed {
  return { type: "find_bug", prompt, code, data: { options }, answer: { index: correct }, explanation };
}

/** `lines` are given in the CORRECT order; the builder shuffles deterministically and stores the answer indices. */
export function arrange(prompt: string, lines: string[], explanation: string): QuestionSeed {
  const n = lines.length;
  // Deterministic permutation: stride coprime with n (avoids identity for n >= 3).
  let stride = 2;
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  while (gcd(stride, n) !== 1 || stride % n === 1) stride++;
  const perm = Array.from({ length: n }, (_, i) => (i * stride + 1) % n); // shuffled position -> original index
  const shuffled = perm.map((orig) => lines[orig]!);
  // answer.order[k] = index in `shuffled` of the k-th correct line
  const order = lines.map((_, k) => perm.indexOf(k));
  return { type: "arrange_code", prompt, data: { lines: shuffled }, answer: { order }, explanation };
}

/** `pairs`: [left, right] couples in correct matching; right column is rotated for display. */
export function match(prompt: string, pairs: Array<[string, string]>, explanation: string): QuestionSeed {
  const n = pairs.length;
  const left = pairs.map((p) => p[0]);
  const shift = n > 2 ? 2 : 1;
  const right = pairs.map((_, i) => pairs[(i + shift) % n]![1]);
  // left[i] pairs with right index j where right[j] === pairs[i][1]
  const idx = pairs.map((p) => right.indexOf(p[1]));
  return { type: "match_concept", prompt, data: { left, right }, answer: { pairs: idx }, explanation };
}

/** Tagged template that keeps backslashes (so C++ "\n" stays "\n") and trims outer blank lines. */
export function cpp(strings: TemplateStringsArray, ...values: unknown[]): string {
  return String.raw({ raw: strings.raw }, ...values).replace(/^\n+|\s+$/g, "");
}

/** Wrap statements into a complete, compilable C++ program. `pre` goes before main (functions, globals). */
export function prog(body: string, pre = ""): string {
  const indented = body
    .split("\n")
    .map((l) => (l.trim() ? `    ${l}` : l))
    .join("\n");
  const head = "#include <iostream>\nusing namespace std;\n\n";
  return `${head}${pre ? `${pre}\n\n` : ""}int main() {\n${indented}\n    return 0;\n}`;
}

/** Like prog() but with extra #include lines (e.g. ["vector", "algorithm"]). */
export function progh(headers: string[], body: string, pre = ""): string {
  const p = prog(body, pre);
  const extra = headers.map((h) => `#include <${h}>\n`).join("");
  return p.replace("#include <iostream>\n", `#include <iostream>\n${extra}`);
}
