// Skeleton of the listing page: hero, gallery and contact card.
export default function Loading() {
  return (
    <main className="light bg-canvas text-ink" aria-busy="true" aria-label="Loading car">
      <section className="bg-charcoal">
        <div className="mx-auto w-full max-w-6xl px-4 pt-7 pb-9 sm:px-6">
          <div className="h-3 w-28 animate-pulse rounded bg-white/10" />
          <div className="mt-5 h-8 w-64 animate-pulse rounded bg-white/10" />
          <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-white/10" />
          <div className="mt-5 h-8 w-40 animate-pulse rounded bg-white/10" />
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-6xl items-start gap-8 px-4 pt-7 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22.625rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="aspect-[16/10] animate-pulse rounded-lg bg-line/60" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-md bg-line/60" />
            ))}
          </div>
        </div>
        <div className="h-80 animate-pulse rounded-lg bg-white" />
      </div>
    </main>
  );
}
