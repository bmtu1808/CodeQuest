/**
 * Builds the judge data for a problem: compiles the reference solution with the local g++ and runs it on every
 * test input to produce the expected outputs. Used by `problems:verify` and `db:seed:problems`.
 * Runs on a developer/CI machine only (never inside the web app).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { ProblemSeed } from "../../src/content/problems/types";

export type BuiltTest = { input: string; expected: string; isSample: boolean };
export type BuiltProblem = { tests: BuiltTest[]; maxRefMs: number };

export function hasGpp(): boolean {
  return spawnSync("g++", ["--version"], { encoding: "utf8" }).status === 0;
}

export function buildProblem(p: ProblemSeed): BuiltProblem {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `cq-prob-${p.slug}-`));
  try {
    const src = path.join(dir, "ref.cpp");
    const bin = path.join(dir, "ref");
    fs.writeFileSync(src, p.reference);
    const c = spawnSync("g++", ["-std=c++17", "-O2", "-Wall", "-o", bin, src], { encoding: "utf8" });
    if (c.status !== 0) throw new Error(`[${p.slug}] reference does not compile:\n${c.stderr}`);

    const seen = new Set<string>();
    const inputs = [...p.samples.map((s) => ({ input: s.input, isSample: true })), ...p.hidden().map((input) => ({ input, isSample: false }))].filter((t) => {
      // Hidden tests that repeat a sample (or each other) add nothing: drop them.
      if (seen.has(t.input)) return false;
      seen.add(t.input);
      return true;
    });
    let maxRefMs = 0;
    const tests = inputs.map(({ input, isSample }, i) => {
      const t0 = Date.now();
      const r = spawnSync(bin, [], { input, encoding: "utf8", timeout: 20_000, maxBuffer: 256 * 1024 * 1024 });
      maxRefMs = Math.max(maxRefMs, Date.now() - t0);
      if (r.status !== 0) throw new Error(`[${p.slug}] reference failed on test ${i + 1} (status ${r.status}, signal ${r.signal}): ${r.stderr}`);
      return { input, expected: r.stdout, isSample };
    });
    return { tests, maxRefMs };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
