"use client";

import { motion } from "framer-motion";
import { Flame, PartyPopper, Trophy, Zap } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type CompleteSummary = {
  xpGained: number;
  breakdown: Array<{ label: string; xp: number }>;
  perfect: boolean;
  repeat: boolean;
  totalXp: number;
  level: { before: number; after: number; title: string; leveledUp: boolean };
  streak: { current: number; extended: boolean };
  nextLessonId: string | null;
};

export function CompleteScreen({ s, mistakes }: { s: CompleteSummary; mistakes: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 160, damping: 16 }} className="mx-auto flex w-full max-w-md flex-col items-center gap-6 text-center">
      <motion.div initial={{ scale: 0.4, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 220, damping: 10, delay: 0.1 }} className="grid size-28 place-items-center rounded-full bg-gold text-white">
        <Trophy size={56} />
      </motion.div>
      <div>
        <h1 className="text-3xl font-black">{s.perfect ? "Perfect lesson!" : "Lesson complete!"}</h1>
        <p className="mt-1 text-muted">{mistakes === 0 ? "No mistakes. Excellent focus." : `You fixed ${mistakes} mistake${mistakes > 1 ? "s" : ""} along the way. That is how learning works.`}</p>
      </div>

      <div className="grid w-full grid-cols-2 gap-3">
        <Card className="border-gold/60 p-4">
          <p className="text-xs font-extrabold uppercase text-gold-dark dark:text-gold">XP earned</p>
          <p className="mt-1 flex items-center justify-center gap-1 text-3xl font-black text-gold-dark dark:text-gold">
            <Zap fill="currentColor" /> {s.xpGained}
          </p>
        </Card>
        <Card className="border-tangerine/60 p-4">
          <p className="text-xs font-extrabold uppercase text-tangerine">Streak</p>
          <p className="mt-1 flex items-center justify-center gap-1 text-3xl font-black text-tangerine">
            <Flame fill="currentColor" /> {s.streak.current}
          </p>
        </Card>
      </div>

      {s.breakdown.length > 0 ? (
        <ul className="w-full divide-y-2 divide-line rounded-2xl border-2 border-line bg-surface text-left">
          {s.breakdown.map((b) => (
            <li key={b.label} className="flex justify-between px-4 py-2.5 font-bold">
              <span>{b.label}</span>
              <span className="text-gold-dark dark:text-gold">+{b.xp} XP</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Replays are practice: no extra XP, but they still count for your daily streak.</p>
      )}

      {s.level.leveledUp && (
        <Card className="w-full border-grape/60 bg-grape/10">
          <p className="flex items-center justify-center gap-2 text-lg font-black text-grape-dark dark:text-grape">
            <PartyPopper /> Level {s.level.after}: {s.level.title}
          </p>
        </Card>
      )}

      <div className="flex w-full flex-col gap-3">
        {s.nextLessonId ? (
          <ButtonLink href={`/lesson/${s.nextLessonId}`} prefetch={false} size="lg" className="w-full">
            Next lesson
          </ButtonLink>
        ) : (
          <p className="font-bold text-muted">You finished every available lesson. More worlds are coming.</p>
        )}
        <ButtonLink href="/learn" variant="outline" size="lg" className="w-full">
          Back to path
        </ButtonLink>
      </div>
    </motion.div>
  );
}
