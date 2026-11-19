import Link from "next/link";
import { requireRole } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("admin", "content_editor");
  const links = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/content", label: "Curriculum" },
    { href: "/admin/problems", label: "Problems" },
    { href: "/admin/contests", label: "Contests" },
    ...(user.role === "admin" ? [{ href: "/admin/users", label: "Users" }, { href: "/admin/settings", label: "Settings" }, { href: "/admin/audit", label: "Audit log" }] : []),
  ];
  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-xs font-extrabold uppercase text-muted">Admin · {user.role === "admin" ? "Administrator" : "Content editor"}</p>
      <nav aria-label="Admin" className="my-3 flex flex-wrap gap-1.5">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="rounded-full border-2 border-line px-4 py-1.5 text-xs font-extrabold uppercase text-muted hover:bg-surface-2">{l.label}</Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
