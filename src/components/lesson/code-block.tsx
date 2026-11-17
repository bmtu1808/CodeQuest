import { cn } from "@/lib/cn";

export function CodeBlock({ code, className, label = "C++ code" }: { code: string; className?: string; label?: string }) {
  return (
    <pre
      aria-label={label}
      tabIndex={0}
      className={cn("overflow-x-auto rounded-2xl border-2 border-line bg-code p-4 font-mono text-[13px] leading-relaxed sm:text-sm", className)}
    >
      <code>{code}</code>
    </pre>
  );
}
