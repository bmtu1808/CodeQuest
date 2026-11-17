import { Fragment } from "react";

/** Minimal, safe text renderer: blank-line separated paragraphs, `inline code`, and line breaks. No HTML is ever injected. */
export function RichText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={className}>
      {text.split(/\n{2,}/).map((para, i) => (
        <p key={i} className="mb-3 whitespace-pre-line last:mb-0">
          {para.split(/(`[^`]+`)/g).map((part, j) =>
            part.startsWith("`") && part.endsWith("`") && part.length > 2 ? (
              <code key={j} className="rounded-md bg-code px-1.5 py-0.5 font-mono text-[0.9em]">
                {part.slice(1, -1)}
              </code>
            ) : (
              <Fragment key={j}>{part}</Fragment>
            ),
          )}
        </p>
      ))}
    </div>
  );
}
