import { notFound } from "next/navigation";
import { LessonForm } from "@/components/admin/lesson-form";
import { Notice } from "@/components/admin/ui";
import { requireRole } from "@/server/auth/session";

export default async function NewLesson({ searchParams }: { searchParams: Promise<{ unit?: string; error?: string }> }) {
  const sp = await searchParams;
  await requireRole("admin", "content_editor");
  if (!sp.unit || !/^[0-9a-f-]{36}$/.test(sp.unit)) notFound();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-black">New lesson</h1>
      <Notice error={sp.error} />
      <LessonForm unitId={sp.unit} />
    </div>
  );
}
