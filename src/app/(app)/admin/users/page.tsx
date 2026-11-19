import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { inputCls, Notice } from "@/components/admin/ui";
import { setActiveAction, setRoleAction } from "@/features/admin/actions";
import { requireRole } from "@/server/auth/session";
import { listUsers } from "@/server/services/admin";

export const metadata: Metadata = { title: "Admin · Users" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; error?: string; saved?: string }> }) {
  const sp = await searchParams;
  const me = await requireRole("admin");
  const page = Math.max(0, Number(sp.page) || 0);
  const { rows, hasMore } = await listUsers(me, sp.q ?? "", page);
  const qs = (p: number) => `/admin/users?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), page: String(p) })}`;
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-black">Users</h1>
      <Notice error={sp.error} saved={sp.saved} />
      <form className="flex gap-2" role="search">
        <label className="sr-only" htmlFor="q">Search</label>
        <input id="q" name="q" defaultValue={sp.q} placeholder="Search email, username or name" className={inputCls} />
        <Button type="submit">Search</Button>
      </form>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-muted"><tr><th className="p-3">User</th><th>XP</th><th>Role</th><th>Status</th><th /></tr></thead>
          <tbody className="divide-y-2 divide-line">
            {rows.map((u) => (
              <tr key={u.id}>
                <td className="p-3"><p className="font-bold">{u.displayName}</p><p className="text-xs text-muted">@{u.username} · {u.email}</p></td>
                <td>{u.xp ?? 0}</td>
                <td>
                  {u.id === me.id ? <span className="font-bold">{u.role} (you)</span> : (
                    <form action={setRoleAction} className="flex gap-1">
                      <input type="hidden" name="userId" value={u.id} />
                      <select name="role" defaultValue={u.role} aria-label={`Role of ${u.username}`} className="rounded-lg border-2 border-line bg-surface px-2 py-1">
                        <option value="user">user</option><option value="content_editor">content_editor</option><option value="admin">admin</option>
                      </select>
                      <Button type="submit" size="sm" variant="outline">Set</Button>
                    </form>
                  )}
                </td>
                <td>{u.deletedAt ? <span className="font-bold text-rose">Deactivated</span> : "Active"}</td>
                <td className="pr-3 text-right">
                  {u.id !== me.id && (
                    <form action={setActiveAction}>
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="active" value={u.deletedAt ? "1" : "0"} />
                      <Button type="submit" size="sm" variant="outline">{u.deletedAt ? "Reactivate" : "Deactivate"}</Button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div className="flex justify-between text-sm font-bold">
        {page > 0 ? <Link className="text-sky hover:underline" href={qs(page - 1)}>Previous</Link> : <span />}
        {hasMore && <Link className="text-sky hover:underline" href={qs(page + 1)}>Next</Link>}
      </div>
    </div>
  );
}
