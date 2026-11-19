"use client";

import { Button } from "@/components/ui/button";

/** Last-resort error boundary for every route. The message is generic on purpose: details stay in the server logs. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-black">Something went wrong</h1>
      <p className="text-muted">The page could not be shown. Your progress is saved. Try again, and if it keeps happening, come back in a few minutes.</p>
      {error.digest && <p className="text-xs text-muted">Reference: {error.digest}</p>}
      <Button type="button" onClick={reset}>Try again</Button>
    </main>
  );
}
