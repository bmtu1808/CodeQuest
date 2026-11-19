import { BottomNav, SidebarNav } from "@/components/layout/app-nav";
import { TopBar } from "@/components/layout/top-bar";
import { Logo } from "@/components/ui/logo";
import { requireUser } from "@/server/auth/session";
import { getSnapshot } from "@/server/services/snapshot";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const snap = await getSnapshot(user);
  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col gap-6 overflow-y-auto border-r-2 border-line bg-surface p-4 lg:flex">
        <Logo href="/dashboard" className="px-2 pt-2" />
        <SidebarNav isStaff={user.role === "admin" || user.role === "content_editor"} />
      </aside>
      <div className="lg:pl-64">
        <TopBar user={user} snap={snap} />
        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 lg:pb-10">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
