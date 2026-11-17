export const ONBOARDING_OPTIONS = {
  knowsProgramming: [
    { value: "no", label: "Not at all", hint: "I have never written code" },
    { value: "some", label: "A little", hint: "I tried another language or Scratch" },
    { value: "yes", label: "Yes", hint: "I can write programs comfortably" },
  ],
  knowsCpp: [
    { value: "no", label: "No C++ yet", hint: "I do not know C++" },
    { value: "basics", label: "The basics", hint: "Variables, loops, functions" },
    { value: "yes", label: "Pretty well", hint: "I use C++ and the STL" },
  ],
  goal: [
    { value: "learn", label: "Learn to code", hint: "School or personal interest" },
    { value: "contests", label: "Olympiads and contests", hint: "ICPC, Olympic Tin hoc, HSG" },
    { value: "rating", label: "Codeforces rating", hint: "Solve problems rated 800 to 2000+" },
    { value: "career", label: "Career growth", hint: "Interviews and software jobs" },
  ],
  dailyMinutes: [
    { value: "5", label: "5 min", hint: "Casual" },
    { value: "10", label: "10 min", hint: "Regular" },
    { value: "15", label: "15 min", hint: "Serious" },
    { value: "20", label: "20 min", hint: "Intense" },
  ],
  selfLevel: [
    { value: "beginner", label: "Beginner", hint: "Start from the very beginning" },
    { value: "intermediate", label: "Intermediate", hint: "I know the basics, want STL and algorithms" },
    { value: "advanced", label: "Advanced", hint: "I already do competitive programming" },
  ],
} as const;

export type OnboardingAnswers = {
  knowsProgramming: string;
  knowsCpp: string;
  goal: string;
  dailyMinutes: number;
  selfLevel: string;
};

/** Which world to recommend. Slugs match the curriculum; the UI falls back when a world is not playable yet. */
export function recommendWorld(a: Pick<OnboardingAnswers, "knowsProgramming" | "knowsCpp" | "selfLevel">): string {
  if (a.selfLevel === "advanced" && a.knowsCpp === "yes") return "algorithms";
  if (a.selfLevel === "intermediate" && a.knowsCpp !== "no") return "cpp-intermediate";
  if (a.knowsCpp === "yes" && a.knowsProgramming === "yes") return "cpp-intermediate";
  return "cpp-foundations";
}

export function isValidOption(field: keyof typeof ONBOARDING_OPTIONS, value: string): boolean {
  return ONBOARDING_OPTIONS[field].some((o) => o.value === value);
}
