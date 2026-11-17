import type { ProblemSample } from "@/server/db/schema";

export type ProblemSeed = {
  slug: string;
  title: string;
  difficulty: "newbie" | "easy" | "medium" | "hard" | "expert";
  /** Reference Codeforces-style rating. Informational. */
  rating: number;
  tags: string[];
  timeLimitMs: number;
  memoryLimitMb: number;
  estimatedMinutes: number;
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  samples: ProblemSample[];
  /** Exactly three hints: thinking direction, algorithm, implementation structure. */
  hints: [string, string, string];
  editorial: string;
  /** Reference C++17 solution. Expected outputs are produced by running it (npm run problems:build). */
  reference: string;
  /** Deterministic hidden test inputs (edge cases, random, and max-size cases that defeat slow solutions). */
  hidden: () => string[];
};
