/**
 * Verifies the authored curriculum:
 *  - structure (answer indices, permutations, unique options)
 *  - every lesson example compiles with g++ -std=c++17
 *  - every predict_output program is compiled AND RUN, and its real stdout must equal the marked answer
 *  - fill_blank programs compile when the blank is replaced by the accepted answer
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { WORLDS } from "../src/content";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cq-verify-"));
let errors = 0;
let checkedPrograms = 0;
const fail = (where: string, msg: string) => {
  errors++;
  console.error(`✘ ${where}: ${msg}`);
};
const norm = (s: string) => s.trim().replace(/\s+/g, " ");

function compileAndRun(src: string, name: string): { ok: boolean; stdout: string; err: string } {
  const file = path.join(tmp, `${name}.cpp`);
  const bin = path.join(tmp, name);
  fs.writeFileSync(file, src);
  const c = spawnSync("g++", ["-std=c++17", "-O0", "-Wall", "-o", bin, file], { encoding: "utf8" });
  if (c.status !== 0) return { ok: false, stdout: "", err: c.stderr };
  const r = spawnSync(bin, [], { encoding: "utf8", timeout: 3000, input: "" });
  checkedPrograms++;
  return { ok: r.status === 0, stdout: r.stdout ?? "", err: r.stderr ?? "" };
}
function compileOnly(src: string, name: string): { ok: boolean; err: string } {
  const file = path.join(tmp, `${name}.cpp`);
  fs.writeFileSync(file, src);
  const c = spawnSync("g++", ["-std=c++17", "-fsyntax-only", "-Wall", file], { encoding: "utf8" });
  checkedPrograms++;
  return { ok: c.status === 0, err: c.stderr };
}

let lessons = 0;
let questions = 0;
for (const w of WORLDS) {
  for (const u of w.units) {
    for (const l of u.lessons) {
      lessons++;
      const base = `${w.slug}/${u.slug}/${l.slug}`;
      if (l.questions.length < 5) fail(base, `only ${l.questions.length} questions (need >= 5)`);
      if (l.content.example) {
        const r = compileOnly(l.content.example.code, `ex_${lessons}`);
        if (!r.ok) fail(`${base} example`, r.err.split("\n").slice(0, 4).join(" | "));
      }
      l.questions.forEach((q, i) => {
        questions++;
        const where = `${base} Q${i + 1} (${q.type})`;
        const opts = (q.data as { options?: string[] }).options;
        if (["multiple_choice", "true_false", "predict_output", "find_bug"].includes(q.type)) {
          const idx = (q.answer as { index: number }).index;
          if (!opts || idx < 0 || idx >= opts.length) return fail(where, "answer index out of range");
          if (new Set(opts.map(norm)).size !== opts.length) fail(where, "duplicate options after normalisation");
        }
        if (q.type === "predict_output") {
          const idx = (q.answer as { index: number }).index;
          const r = compileAndRun(q.code ?? "", `q${questions}`);
          if (!r.ok) return fail(where, `does not compile/run: ${r.err.split("\n").slice(0, 3).join(" | ")}`);
          const expected = norm(opts![idx]!);
          if (norm(r.stdout) !== expected) fail(where, `real output "${norm(r.stdout)}" != marked answer "${expected}"`);
        }
        if (q.type === "find_bug" && q.code) {
          // informational: bugs may be compile errors or logic errors; just make sure the snippet is intentional
          compileOnly(q.code, `bug${questions}`);
        }
        if (q.type === "fill_blank") {
          const acc = (q.answer as { accepted: string[] }).accepted;
          if (!q.code?.includes("___")) return fail(where, "fill_blank code has no ___ placeholder");
          for (const a of acc) {
            const r = compileOnly(q.code.replace("___", a), `fill${questions}`);
            if (!r.ok) fail(where, `accepted answer "${a}" does not compile: ${r.err.split("\n").slice(0, 3).join(" | ")}`);
          }
        }
        if (q.type === "arrange_code") {
          const { lines } = q.data as { lines: string[] };
          const { order } = q.answer as { order: number[] };
          if ([...order].sort((a, b) => a - b).join() !== lines.map((_, k) => k).join()) fail(where, "order is not a permutation");
          if (order.every((v, k) => v === k)) fail(where, "lines are not shuffled");
        }
        if (q.type === "match_concept") {
          const { left, right } = q.data as { left: string[]; right: string[] };
          const { pairs } = q.answer as { pairs: number[] };
          if (left.length !== right.length || new Set(pairs).size !== pairs.length) fail(where, "bad match pairs");
        }
      });
    }
  }
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`Checked ${lessons} lessons, ${questions} questions, ${checkedPrograms} C++ programs (g++ ${execFileSync("g++", ["-dumpversion"]).toString().trim()}).`);
if (errors) {
  console.error(`\n${errors} problem(s) found.`);
  process.exit(1);
}
console.log("✔ all content verified");
