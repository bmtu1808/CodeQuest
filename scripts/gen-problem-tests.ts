/** Needs g++. Writes the small test cases (<= 3000 chars) of every problem to src/content/problems/small-tests.json. */
import fs from "node:fs";
import { PROBLEMS } from "../src/content/problems";
import { buildProblem } from "./lib/problem-build";

const out: Record<string, Array<{ input: string; expected: string; isSample: boolean }>> = {};
for (const p of PROBLEMS) {
  out[p.slug] = buildProblem(p)
    .tests.filter((t) => t.isSample || t.input.length + t.expected.length <= 3000)
    .map((t) => ({ input: t.input, expected: t.expected, isSample: t.isSample }));
}
fs.writeFileSync("src/content/problems/small-tests.json", JSON.stringify(out));
console.log(`wrote ${Object.values(out).reduce((s, a) => s + a.length, 0)} tests for ${PROBLEMS.length} problems`);
