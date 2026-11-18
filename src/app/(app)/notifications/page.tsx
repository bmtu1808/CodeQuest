import type { Metadata } from "next";
import { Bell, Medal, PartyPopper, Target } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { markAllReadAction } from "@/features/gamification/actions";
import { cn } from "@/lib/cn";
import { requireUser } from "@/server/auth/session";
import { listNotifications } from "@/server/services/notifications";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

const ICON = { achievement: Medal, quest: Target, level: PartyPopper } as const;

export default async function NotificationsPage() {
  const user = await requireUser();
  const items = await listNotifications(user.id);
  const unread = items.filter((n) => !n.readAt).length;
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-black">Notifications</h1>
        {unread > 0 && (
          <form action={markAllReadAction}>
            <Button size="sm" variant="outline">
              Mark all as read
            </Button>
          </form>
        )}
      </div>
      {items.length === 0 ? (
        <Card className="mt-6 border-dashed p-8 text-center text-muted">Nothing yet. Quests, achievements and level-ups show up here.</Card>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {items.map((n) => {
            const Icon = (ICON as Record<string, typeof Bell>)[n.type] ?? Bell;
            const body = (
              <div className={cn("flex items-center gap-3 rounded-2xl border-2 p-4", n.readAt ? "border-line bg-surface" : "border-sky/50 bg-sky/10")}>
                <Icon className="shrink-0 text-sky" size={22} />
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold">{n.title}</p>
                  {n.body && <p className="text-sm text-muted">{n.body}</p>}
                </div>
                <time dateTime={n.createdAt.toISOString()} className="whitespace-nowrap text-xs text-muted">
                  {n.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </time>
              </div>
            );
            return <li key={n.id}>{n.href ? <Link href={n.href}>{body}</Link> : body}</li>;
          })}
        </ul>
      )}
    </div>
  );
}
