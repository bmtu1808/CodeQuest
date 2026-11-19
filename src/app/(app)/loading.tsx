export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="mx-auto max-w-2xl animate-pulse space-y-4 pt-4">
      <span className="sr-only">Loading</span>
      <div className="h-9 w-1/2 rounded-xl bg-surface-2" />
      <div className="h-24 rounded-2xl bg-surface-2" />
      <div className="h-24 rounded-2xl bg-surface-2" />
    </div>
  );
}
