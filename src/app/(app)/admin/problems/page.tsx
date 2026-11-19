import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/server/auth/session";
import { listProblemsAdmin } from "@/server/services/admin";

export const metadata: Metadata = { title: "Admin · Problems" };

export default async function ProblemsAdmin() {
  const me = await requireRole("admin", "content_editor");
  const rows = await listProblemsAdmin(me);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">Problems</h1>
        <Link href="/admin/problems/new" className="rounded-xl bg-brand px-4 py-2 text-sm font-extrabold text-white">New problem</Link>
      </div>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-muted"><tr><th className="p-3">Title</th><th>Difficulty</th><th>Rating</th><th>Tests</th><th>Status</th></tr></thead>
          <tbody className="divide-y-2 divide-line">
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="p-3"><Link href={`/admin/problems/${p.id}`} className="font-bold hover:underline">{p.title}</Link></td>
                <td>{p.difficulty}</td><td>{p.rating}</td><td>{p.tests}</td><td>{p.published ? "Published" : "Draft"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
