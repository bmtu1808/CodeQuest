/**
 * Daily quest and achievement definitions. Loaded into the database by `npm run db:seed`.
 * Every metric below is something the server can really measure from stored events: nothing here is estimated.
 */

export const QUEST_METRICS = {
  lessons: "Lessons completed today",
  perfect_lessons: "Lessons completed without a mistake today",
  xp: "XP earned today from learning (quest and achievement rewards do not count)",
  review_questions: "Questions answered correctly while replaying a completed lesson",
  problems_solved: "Problems solved for the first time today",
  easy_problems: "Newbie/Easy problems solved for the first time today",
  medium_problems: "Medium or harder problems solved for the first time today",
  submissions: "Code submissions judged today",
  accepted: "Accepted submissions today",
} as const;
export type QuestMetric = keyof typeof QUEST_METRICS;

export type QuestSeed = { slug: string; title: string; description: string; metric: QuestMetric; target: number; rewardXp: number; icon: string };

export const QUESTS: QuestSeed[] = [
  { slug: "warm-up", title: "Warm-up", description: "Complete 1 lesson.", metric: "lessons", target: 1, rewardXp: 25, icon: "Flame" },
  { slug: "triple-lesson", title: "Triple Threat", description: "Complete 3 lessons.", metric: "lessons", target: 3, rewardXp: 25, icon: "Layers" },
  { slug: "flawless", title: "Flawless", description: "Finish a lesson without a single mistake.", metric: "perfect_lessons", target: 1, rewardXp: 25, icon: "Sparkles" },
  { slug: "xp-hunter", title: "XP Hunter", description: "Earn 100 XP.", metric: "xp", target: 100, rewardXp: 25, icon: "Zap" },
  { slug: "xp-sprinter", title: "XP Sprinter", description: "Earn 50 XP.", metric: "xp", target: 50, rewardXp: 25, icon: "Zap" },
  { slug: "review-five", title: "Memory Check", description: "Review 5 old questions by replaying a finished lesson.", metric: "review_questions", target: 5, rewardXp: 25, icon: "RotateCcw" },
  { slug: "review-fifteen", title: "Deep Review", description: "Answer 15 review questions correctly.", metric: "review_questions", target: 15, rewardXp: 25, icon: "BookOpen" },
  { slug: "first-solve", title: "Problem Time", description: "Solve 1 problem you have not solved before.", metric: "problems_solved", target: 1, rewardXp: 25, icon: "Code2" },
  { slug: "easy-pair", title: "Easy Pair", description: "Solve 2 Newbie or Easy problems.", metric: "easy_problems", target: 2, rewardXp: 25, icon: "Target" },
  { slug: "step-up", title: "Step Up", description: "Solve 1 Medium or harder problem.", metric: "medium_problems", target: 1, rewardXp: 25, icon: "TrendingUp" },
  { slug: "keep-trying", title: "Keep Trying", description: "Submit code 3 times. Failing is part of learning.", metric: "submissions", target: 3, rewardXp: 25, icon: "Send" },
  { slug: "green-light", title: "Green Light", description: "Get 2 Accepted submissions.", metric: "accepted", target: 2, rewardXp: 25, icon: "CheckCircle2" },
];

/** How many quests each learner gets per day. */
export const QUESTS_PER_DAY = 3;

export const ACHIEVEMENT_METRICS = {
  lessons_completed: "Distinct lessons completed",
  perfect_lessons: "Lessons completed with no mistakes",
  problems_solved: "Problems solved",
  hard_problems: "Hard problems solved",
  solved_no_hint: "Problems solved without any hint",
  solved_in_day: "Most problems first-solved in one local day",
  bugs_fixed: "Different 'find the bug' questions answered correctly",
  longest_streak: "Longest streak in days",
  total_xp: "Total XP",
  level: "Level",
  quests_completed: "Daily quests completed",
  hello_world: "Solved the Hello World problem (1 when true)",
} as const;
export type AchievementMetric = keyof typeof ACHIEVEMENT_METRICS;

export type AchievementSeed = { slug: string; title: string; description: string; metric: AchievementMetric; threshold: number; rewardXp: number; icon: string };

export const ACHIEVEMENTS: AchievementSeed[] = [
  { slug: "first-steps", title: "First Steps", description: "Complete your first lesson.", metric: "lessons_completed", threshold: 1, rewardXp: 10, icon: "Footprints" },
  { slug: "hello-world", title: "Hello World", description: "Get your first program accepted: solve the Hello Coder problem.", metric: "hello_world", threshold: 1, rewardXp: 20, icon: "Hand" },
  { slug: "bug-hunter", title: "Bug Hunter", description: "Find the bug correctly in 5 different questions.", metric: "bugs_fixed", threshold: 5, rewardXp: 30, icon: "Bug" },
  { slug: "speed-coder", title: "Speed Coder", description: "Solve 5 problems in a single day.", metric: "solved_in_day", threshold: 5, rewardXp: 50, icon: "Gauge" },
  { slug: "algorithm-apprentice", title: "Algorithm Apprentice", description: "Solve 10 problems.", metric: "problems_solved", threshold: 10, rewardXp: 60, icon: "GraduationCap" },
  { slug: "perfect-week", title: "Perfect Week", description: "Learn 7 days in a row.", metric: "longest_streak", threshold: 7, rewardXp: 50, icon: "CalendarCheck" },
  { slug: "century", title: "Century", description: "Solve 100 problems. (The library has fewer problems than this today, so this one has to wait for more content.)", metric: "problems_solved", threshold: 100, rewardXp: 300, icon: "Crown" },
  { slug: "no-hint-needed", title: "No Hint Needed", description: "Solve 10 problems without using a hint.", metric: "solved_no_hint", threshold: 10, rewardXp: 60, icon: "Brain" },
  { slug: "lesson-streak-3", title: "On a Roll", description: "Reach a 3-day streak.", metric: "longest_streak", threshold: 3, rewardXp: 15, icon: "Flame" },
  { slug: "month-of-code", title: "Month of Code", description: "Reach a 30-day streak.", metric: "longest_streak", threshold: 30, rewardXp: 150, icon: "Calendar" },
  { slug: "ten-lessons", title: "Getting Serious", description: "Complete 10 lessons.", metric: "lessons_completed", threshold: 10, rewardXp: 40, icon: "BookOpen" },
  { slug: "perfectionist", title: "Perfectionist", description: "Complete 5 lessons with no mistakes.", metric: "perfect_lessons", threshold: 5, rewardXp: 40, icon: "Sparkles" },
  { slug: "problem-solver", title: "Problem Solver", description: "Solve 5 problems.", metric: "problems_solved", threshold: 5, rewardXp: 30, icon: "Puzzle" },
  { slug: "hard-hitter", title: "Hard Hitter", description: "Solve a Hard problem.", metric: "hard_problems", threshold: 1, rewardXp: 60, icon: "Mountain" },
  { slug: "xp-500", title: "Rising Star", description: "Earn 500 XP in total.", metric: "total_xp", threshold: 500, rewardXp: 25, icon: "Star" },
  { slug: "xp-2500", title: "XP Machine", description: "Earn 2,500 XP in total.", metric: "total_xp", threshold: 2500, rewardXp: 100, icon: "Zap" },
  { slug: "level-5", title: "Apprentice", description: "Reach level 5.", metric: "level", threshold: 5, rewardXp: 25, icon: "Shield" },
  { slug: "level-10", title: "Programmer", description: "Reach level 10.", metric: "level", threshold: 10, rewardXp: 75, icon: "Swords" },
  { slug: "quest-master", title: "Quest Master", description: "Complete 10 daily quests.", metric: "quests_completed", threshold: 10, rewardXp: 50, icon: "Target" },
];
