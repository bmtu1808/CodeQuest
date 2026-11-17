import { cn } from "@/lib/cn";

export function Avatar({ name, color, size = 40, className }: { name: string; color: string; size?: number; className?: string }) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-extrabold text-white", className)}
      style={{ width: size, height: size, background: color, fontSize: size * 0.4 }}
    >
      {initials || "?"}
    </span>
  );
}
