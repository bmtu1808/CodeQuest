/**
 * Output checker (Codeforces-style "token" comparison): outputs are equal when they have the same
 * whitespace-separated tokens. Differences in trailing spaces, blank lines or line endings are ignored,
 * but every token must match exactly.
 */
export function tokens(s: string): string[] {
  return s.split(/\s+/).filter(Boolean);
}

export function outputsMatch(expected: string, actual: string): boolean {
  const a = tokens(expected);
  const b = tokens(actual);
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export type TestVerdict = "accepted" | "wrong_answer" | "time_limit_exceeded" | "memory_limit_exceeded" | "runtime_error" | "compilation_error" | "internal_error";

export function judgeOne(expected: string, run: { status: string; stdout: string }): TestVerdict {
  switch (run.status) {
    case "compilation_error":
      return "compilation_error";
    case "time_limit":
      return "time_limit_exceeded";
    case "memory_limit":
      return "memory_limit_exceeded";
    case "runtime_error":
      return "runtime_error";
    case "internal_error":
      return "internal_error";
    default:
      return outputsMatch(expected, run.stdout) ? "accepted" : "wrong_answer";
  }
}

export type Aggregate = {
  verdict: TestVerdict;
  /** 1-based index of the first test that did not pass. */
  failedTest: number | null;
  passed: number;
  total: number;
  timeMs: number;
  memoryKb: number;
};

/** Combine per-test results (in test order) into the submission verdict. */
export function aggregate(
  expected: string[],
  runs: Array<{ status: string; stdout: string; timeMs: number | null; memoryKb: number | null }>,
): Aggregate {
  let passed = 0;
  let verdict: TestVerdict = "accepted";
  let failedTest: number | null = null;
  let timeMs = 0;
  let memoryKb = 0;
  runs.forEach((r, i) => {
    timeMs = Math.max(timeMs, r.timeMs ?? 0);
    memoryKb = Math.max(memoryKb, r.memoryKb ?? 0);
    const v = judgeOne(expected[i] ?? "", r);
    if (v === "accepted") passed++;
    else if (failedTest === null) {
      failedTest = i + 1;
      verdict = v;
    }
  });
  // A compilation error applies to the whole submission whichever test reported it.
  if (runs.some((r) => r.status === "compilation_error")) {
    verdict = "compilation_error";
    failedTest = null;
    passed = 0;
  }
  return { verdict, failedTest, passed, total: runs.length, timeMs, memoryKb };
}
