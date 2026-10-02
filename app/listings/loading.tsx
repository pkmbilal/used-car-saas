// Skeleton of the browse page while the search runs.
export default function Loading() {
  return (
    <main className="light bg-canvas text-ink" aria-busy="true" aria-label="Loading cars">
      <section className="bg-charcoal">
        <div className="mx-auto w-full max-w-6xl px-4 pt-10 pb-20 sm:px-6">
          <div className="h-3 w-40 animate-pulse rounded bg-white/10" />
          <div className="mt-4 h-9 w-full max-w-md animate-pulse rounded bg-white/10" />
          <div className="mt-4 h-4 w-full max-w-sm animate-pulse rounded bg-white/10" />
        </div>
      </section>

      <div className="relative mx-auto -mt-10 w-full max-w-6xl px-4 sm:px-6">
        <div className="h-24 animate-pulse rounded-xl bg-white shadow-[0_10px_30px_rgba(20,30,25,.08)]" />
      </div>

      <div className="mx-auto mt-6 grid w-full max-w-6xl items-start gap-6 px-4 sm:px-6 lg:grid-cols-[16.0625rem_minmax(0,1fr)]">
        <div className="h-[32rem] animate-pulse rounded-lg bg-white max-lg:hidden" />
        <div className="h-10 animate-pulse rounded-md bg-white lg:hidden" />

        <section>
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 animate-pulse rounded bg-line" />
            <div className="h-8 w-48 animate-pulse rounded bg-white" />
          </div>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="overflow-hidden rounded-lg bg-white">
                <div className="aspect-[4/3] animate-pulse bg-line/60" />
                <div className="flex flex-col gap-2 p-4">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-line/70" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-line/70" />
                  <div className="mt-2 h-5 w-1/3 animate-pulse rounded bg-line/70" />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
