import { Notice } from "@/components/admin/ui";
import { ProblemForm } from "@/components/admin/problem-form";
import { requireRole } from "@/server/auth/session";

export default async function NewProblem({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  await requireRole("admin", "content_editor");
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-black">New problem</h1>
      <p className="text-sm text-muted">It is saved as a draft. Upload test cases next, then publish.</p>
      <Notice error={sp.error} />
      <ProblemForm />
    </div>
  );
}
