import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-black">Page not found</h1>
      <p className="text-muted">That page does not exist, or you do not have access to it.</p>
      <Link href="/dashboard" className={buttonClasses("primary", "md")}>Back to home</Link>
    </main>
  );
}
