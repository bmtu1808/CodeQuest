import * as Lucide from "lucide-react";
import type { LucideProps } from "lucide-react";

/** Renders a lucide icon by name (names are stored in the DB so content editors can change them). */
export function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  const Cmp = (Lucide as unknown as Record<string, React.ComponentType<LucideProps>>)[name] ?? Lucide.BookOpen;
  return <Cmp {...props} />;
}
