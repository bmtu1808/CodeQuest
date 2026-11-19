"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/** Keeps the sidebar and top bar alive when a single page fails. */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Card className="mx-auto mt-10 max-w-lg p-8 text-center">
      <h1 className="text-2xl font-black">This page hit a problem</h1>
      <p className="mt-2 text-muted">Nothing you did was lost. Try again, or use the menu to go somewhere else.</p>
      {error.digest && <p className="mt-2 text-xs text-muted">Reference: {error.digest}</p>}
      <Button type="button" className="mt-4" onClick={reset}>Try again</Button>
    </Card>
  );
}
