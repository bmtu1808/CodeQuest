export const VERDICT_LABEL: Record<string, string> = {
  accepted: "Accepted",
  wrong_answer: "Wrong Answer",
  time_limit_exceeded: "Time Limit Exceeded",
  memory_limit_exceeded: "Memory Limit Exceeded",
  compilation_error: "Compilation Error",
  runtime_error: "Runtime Error",
  pending: "Pending",
  judging: "Judging",
  internal_error: "Judge Error",
  ran: "Ran",
};

export const VERDICT_TEXT: Record<string, string> = {
  accepted: "text-brand-dark dark:text-brand",
  pending: "text-muted",
  judging: "text-sky",
  internal_error: "text-muted",
};
export const verdictColor = (v: string) => VERDICT_TEXT[v] ?? "text-danger";

export const DIFFICULTY_LABEL: Record<string, string> = { newbie: "Newbie", easy: "Easy", medium: "Medium", hard: "Hard", expert: "Expert" };
export const DIFFICULTY_STYLE: Record<string, string> = {
  newbie: "bg-brand/15 text-brand-dark dark:text-brand",
  easy: "bg-sky/15 text-sky-dark dark:text-sky",
  medium: "bg-tangerine/15 text-tangerine-dark dark:text-tangerine",
  hard: "bg-danger/15 text-danger",
  expert: "bg-grape/20 text-grape-dark dark:text-grape",
};
