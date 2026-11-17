export const QUESTION_TYPES = [
  "multiple_choice",
  "true_false",
  "fill_blank",
  "predict_output",
  "find_bug",
  "arrange_code",
  "match_concept",
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

/** What the browser receives. Never contains the answer. */
export type PublicQuestion = {
  id: string;
  position: number;
  type: QuestionType;
  prompt: string;
  code: string | null;
  xp: number;
  data: Record<string, unknown>;
};

export type GradeResult = {
  correct: boolean;
  /** Human-readable correct answer, revealed only after the learner answered. */
  correctAnswer: string;
};
