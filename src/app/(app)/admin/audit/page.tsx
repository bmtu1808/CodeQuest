import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/server/auth/session";
import { listAudit } from "@/server/services/admin";

export const metadata: Metadata = { title: "Admin · Audit log" };

export default async function AuditPage() {
  const me = await requireRole("admin");
  const rows = await listAudit(me, 100);
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-black">Audit log</h1>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-muted"><tr><th className="p-3">When</th><th>Who</th><th>Action</th><th>Target</th></tr></thead>
          <tbody className="divide-y-2 divide-line">
            {rows.length === 0 && <tr><td className="p-3 text-muted" colSpan={4}>No admin changes yet.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="whitespace-nowrap p-3">{r.createdAt.toLocaleString("en-US")}</td>
                <td>@{r.actor ?? "deleted"}</td>
                <td className="font-bold">{r.action}</td>
                <td className="text-xs text-muted">{r.targetType} {r.targetId?.slice(0, 8)} {Object.keys(r.meta).length ? JSON.stringify(r.meta).slice(0, 80) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
