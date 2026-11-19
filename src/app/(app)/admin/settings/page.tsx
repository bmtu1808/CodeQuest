import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, inputCls, Notice } from "@/components/admin/ui";
import { saveXpRulesAction, toggleAchievementAction, toggleQuestAction } from "@/features/admin/actions";
import { requireRole } from "@/server/auth/session";
import { listGamification } from "@/server/services/admin";
import { getXpRules } from "@/server/services/settings";

export const metadata: Metadata = { title: "Admin · Settings" };

function Toggle({ action, id, active, name }: { action: (f: FormData) => Promise<void>; id: string; active: boolean; name: string }) {
  return (
    <form action={action} className="flex items-center justify-between gap-2 py-2">
      <input type="hidden" name="id" value={id} />
      <span className={active ? "font-bold" : "text-muted line-through"}>{name}</span>
      <Button type="submit" size="sm" variant="outline" name="active" value={active ? "0" : "1"}>{active ? "Disable" : "Enable"}</Button>
    </form>
  );
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const sp = await searchParams;
  const me = await requireRole("admin");
  const [rules, g] = await Promise.all([getXpRules(), listGamification(me)]);
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-black">Settings</h1>
      <Notice error={sp.error} saved={sp.saved} />
      <Card>
        <h2 className="text-lg font-black">XP rules</h2>
        <p className="text-xs text-muted">Applies to rewards granted from now on. Past ledger entries never change. Per-lesson XP is set on each lesson.</p>
        <form action={saveXpRulesAction} className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label="Perfect lesson bonus"><input name="perfectBonus" type="number" min={0} max={500} defaultValue={rules.perfectBonus} className={inputCls} /></Field>
          {["newbie", "easy", "medium", "hard", "expert"].map((d) => (
            <Field key={d} label={`First solve: ${d}`}><input name={`p_${d}`} type="number" min={0} max={1000} defaultValue={rules.problem[d] ?? 0} className={inputCls} /></Field>
          ))}
          <div className="sm:col-span-3"><Field label="Streak milestones" hint="One per line as days:XP, for example 7:25"><textarea name="streaks" rows={6} defaultValue={Object.entries(rules.streakMilestones).map(([d, x]) => `${d}:${x}`).join("\n")} className={`${inputCls} font-mono`} /></Field></div>
          <Button type="submit">Save XP rules</Button>
        </form>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-lg font-black">Daily quests</h2>
          <p className="text-xs text-muted">Titles and rewards live in code (<code>src/content/gamification.ts</code>). Here you can switch quests on or off.</p>
          <div className="divide-y-2 divide-line">{g.quests.map((q) => <Toggle key={q.id} action={toggleQuestAction} id={q.id} active={q.active} name={q.title} />)}</div>
        </Card>
        <Card>
          <h2 className="text-lg font-black">Achievements</h2>
          <div className="divide-y-2 divide-line">{g.achievements.map((a) => <Toggle key={a.id} action={toggleAchievementAction} id={a.id} active={a.active} name={a.title} />)}</div>
        </Card>
      </div>
    </div>
  );
}
