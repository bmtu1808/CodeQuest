import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({ className, href = "/", textClassName }: { className?: string; href?: string; textClassName?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2 text-2xl font-black tracking-tight text-brand", className)}>
      <span aria-hidden className="grid size-9 place-items-center rounded-xl border-b-4 border-brand-dark bg-brand font-mono text-lg font-black text-white">
        {"{}"}
      </span>
      <span className={textClassName}>CodeQuest</span>
    </Link>
  );
}
