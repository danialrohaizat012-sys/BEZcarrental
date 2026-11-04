export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6" aria-busy="true">
      <div className="h-9 w-56 animate-pulse rounded-lg bg-sand" />
      <div className="mt-3 h-5 w-80 max-w-full animate-pulse rounded bg-sand/70" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-line bg-paper">
            <div className="aspect-[16/10] animate-pulse bg-sand/70" />
            <div className="space-y-3 p-5">
              <div className="h-4 w-24 animate-pulse rounded bg-sand" />
              <div className="h-6 w-40 animate-pulse rounded bg-sand" />
              <div className="h-4 w-full animate-pulse rounded bg-sand/70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
