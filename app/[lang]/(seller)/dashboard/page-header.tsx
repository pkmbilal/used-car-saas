import type { LucideIcon } from "lucide-react";

// Eyebrow pill, title and brand underline: the Seller Center page heading,
// as on the Offers page. `actions` sit on the end side (under it on phones).
export function PageHeader({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  intro,
  actions,
}: {
  eyebrow: string;
  eyebrowIcon?: LucideIcon;
  title: string;
  intro?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-forest/5 px-2.5 py-1 text-xs font-semibold tracking-wide text-forest ring-1 ring-forest/15 print:hidden dark:bg-lime/10 dark:text-lime dark:ring-lime/25">
          {EyebrowIcon ? (
            <EyebrowIcon className="size-3.5" aria-hidden />
          ) : (
            <span className="size-1.5 rounded-full bg-brand dark:bg-lime" aria-hidden />
          )}
          {eyebrow}
        </span>
        <h1 className="mt-2.5 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <span
          aria-hidden
          className="mt-3 block h-1 w-12 rounded-full bg-gradient-to-r from-brand to-lime print:hidden rtl:bg-gradient-to-l"
        />
        {intro && <div className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-400">{intro}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 print:hidden">{actions}</div>}
    </div>
  );
}
