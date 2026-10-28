export const inputClass =
  "min-h-11 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm shadow-sm transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-brand focus:ring-4 focus:ring-brand/15 focus:outline-none disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:focus:border-lime dark:focus:ring-lime/15 dark:disabled:bg-zinc-900/60";

export const selectClass = `${inputClass} select-chevron pe-10`;

export function Field({
  id,
  label,
  hint,
  suffix,
  children,
}: {
  id: string;
  label: string;
  // Small muted text under the input (e.g. a character counter).
  hint?: React.ReactNode;
  // A unit shown inside the input's end edge; the input needs room for it (pe-12).
  suffix?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {label}
      </label>
      {suffix ? (
        <div className="relative">
          {children}
          <span className="pointer-events-none absolute inset-y-0 end-3.5 flex items-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {suffix}
          </span>
        </div>
      ) : (
        children
      )}
      {hint && <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>}
    </div>
  );
}

// A numbered card grouping related fields of the listing form.
export function Section({
  step,
  title,
  subtitle,
  children,
}: {
  step: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_2px_10px_rgba(20,30,25,.05)] sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-b from-brand to-forest text-sm font-bold text-white shadow-sm shadow-forest/25">
          {step}
        </span>
        <div>
          <h2 className="font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}
