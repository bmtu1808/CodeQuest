import { CheckCircle2, Zap } from "lucide-react";
import { DynamicIcon } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/cn";

export type QuestItem = { slug: string; title: string; description: string; icon: string; target: number; rewardXp: number; progress: number; completedAt: Date | null };

export function QuestList({ quests }: { quests: QuestItem[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {quests.map((q) => {
        const done = !!q.completedAt;
        return (
          <li key={q.slug} className={cn("flex items-center gap-4 rounded-2xl border-2 p-4", done ? "border-brand/40 bg-brand/10" : "border-line bg-surface")}>
            <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl text-white", done ? "bg-brand" : "bg-sky")}>
              {done ? <CheckCircle2 size={26} /> : <DynamicIcon name={q.icon} size={26} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold">{q.title}</p>
              <p className="text-sm text-muted">{q.description}</p>
              <div className="mt-2 flex items-center gap-3">
                <ProgressBar value={q.progress / q.target} label={`${q.title} progress`} className="h-3 flex-1" color={done ? "bg-brand" : "bg-sky"} />
                <span className="whitespace-nowrap text-xs font-extrabold text-muted">
                  {q.progress}/{q.target}
                </span>
              </div>
            </div>
            <span className="flex items-center gap-1 whitespace-nowrap text-sm font-extrabold text-gold-dark dark:text-gold">
              <Zap size={16} fill="currentColor" /> {q.rewardXp}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
