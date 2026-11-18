import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";
import type { HeartsView } from "@/server/services/hearts";

export function HeartsCounter({ hearts, className }: { hearts: HeartsView; className?: string }) {
  const full = hearts.hearts >= hearts.max;
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 font-extrabold text-danger", className)}
      title={full ? "Hearts are full" : "A heart comes back every 30 minutes. Replaying a finished lesson earns one too."}
      aria-label={`${hearts.hearts} of ${hearts.max} hearts`}
    >
      <Heart size={22} fill={hearts.hearts > 0 ? "currentColor" : "none"} />
      {hearts.hearts}
    </span>
  );
}
