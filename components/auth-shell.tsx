// Frame for the public sign-in, sign-up and reset pages. On phones: a forest
// hero band with a white sheet sliding up over it. From sm up: the same two
// pieces as one centered card.
export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="light flex flex-1 flex-col bg-canvas text-ink sm:items-center sm:justify-center sm:px-6 sm:py-16">
      <div className="flex flex-1 flex-col sm:w-full sm:max-w-md sm:flex-none sm:overflow-hidden sm:rounded-3xl sm:border sm:border-line sm:shadow-[0_1px_2px_rgba(21,32,26,0.04),0_16px_40px_-16px_rgba(21,32,26,0.22)]">
        <section className="relative overflow-hidden bg-gradient-to-br from-forest to-forest-dark px-5 pt-8 pb-14 text-white sm:px-8 sm:pt-10">
          <RoadLines />
          <div className="relative">
            <p className="flex items-center gap-2 text-eyebrow font-semibold tracking-[0.16em] text-lime">
              <span className="size-1.5 rounded-full bg-lime" aria-hidden />
              {eyebrow}
            </p>
            <h1 className="mt-3 text-2xl leading-tight font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 max-w-xs text-sm text-white/70">{subtitle}</p>
          </div>
        </section>

        <div className="relative -mt-6 flex-1 rounded-t-3xl bg-white px-5 pt-7 pb-10 shadow-[0_-12px_24px_-16px_rgba(15,34,25,0.35)] sm:px-8 sm:pb-8">
          {children}
        </div>
      </div>
    </main>
  );
}

// Faint perspective road lines (lg only) and a glow behind a forest panel.
export function RoadLines() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute -top-24 -right-24 size-80 rounded-full bg-lime/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-16 size-96 rounded-full bg-brand/30 blur-3xl" />
      <svg className="absolute inset-0 hidden size-full lg:block" preserveAspectRatio="none" viewBox="0 0 400 800">
        <g stroke="white" strokeOpacity="0.06" strokeWidth="1.5" fill="none">
          <path d="M200 380 L-40 800" />
          <path d="M200 380 L440 800" />
          <path d="M200 380 L120 800" />
          <path d="M200 380 L280 800" />
        </g>
        <path d="M200 380 L200 800" stroke="#6fe07c" strokeOpacity="0.14" strokeWidth="2" strokeDasharray="14 18" fill="none" />
      </svg>
    </div>
  );
}
