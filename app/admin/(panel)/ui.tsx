import Link from "next/link";
import type { LucideIcon } from "lucide-react";

// Shared building blocks for the admin pages, so every tab has the same
// panels, tables, pills and empty states as the overview.

export function Panel({
  title,
  description,
  actions,
  children,
  flush = false,
  className = "",
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  // Flush panels let a table run edge to edge.
  flush?: boolean;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-line bg-white shadow-[0_1px_2px_rgba(21,32,26,0.04)] dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
    >
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4 dark:border-zinc-800">
          <div className="min-w-0">
            {title && <h2 className="font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  );
}

// A short note on how to work through the page, with an icon.
export function Hint({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-3 rounded-lg border border-brand/15 bg-mint/60 px-4 py-3 text-sm text-forest dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
      <Icon className="mt-0.5 size-4 shrink-0 text-brand dark:text-lime" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-mint text-brand dark:bg-zinc-800 dark:text-lime">
        <Icon className="size-6" aria-hidden />
      </span>
      <p className="mt-4 font-semibold">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">{children}</p>}
    </div>
  );
}

const PILL_TONES = {
  neutral: "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
  green: "bg-green-50 text-green-800 ring-green-200 dark:bg-green-950 dark:text-green-300 dark:ring-green-900",
  red: "bg-red-50 text-red-800 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-900",
  amber: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900",
  blue: "bg-blue-50 text-blue-800 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-900",
  brand: "bg-mint text-brand ring-brand/20 dark:bg-zinc-800 dark:text-lime dark:ring-zinc-700",
} as const;

export type PillTone = keyof typeof PILL_TONES;

export function Pill({ tone = "neutral", children }: { tone?: PillTone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${PILL_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export { Avatar } from "@/components/avatar";

// Label/value pairs, e.g. a dealer's registration numbers.
export function DetailGrid({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map(({ label, value }) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs text-zinc-500">{label}</dt>
          <dd className="mt-0.5 truncate text-sm font-medium">{value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

// Segmented links for switching between views of one page.
export function SegmentedNav({
  items,
  label,
}: {
  items: { href: string; label: string; active: boolean; count?: number }[];
  label: string;
}) {
  return (
    <nav
      aria-label={label}
      className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-lg border border-line bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900"
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap ${
            item.active
              ? "bg-forest text-white"
              : "text-zinc-600 hover:bg-canvas hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          }`}
        >
          {item.label}
          {item.count !== undefined && (
            <span
              className={`rounded-full px-1.5 text-xs tabular-nums ${
                item.active ? "bg-white/20" : "bg-zinc-100 dark:bg-zinc-800"
              }`}
            >
              {item.count}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

// Table styling shared by every admin table. Below md each row turns into a
// card: cells stack in two columns and show their data-label above the value.
// Use tdPrimary for the main cell (vehicle, user) and tdActions for the ⋮ menu.
export const table = {
  wrap: "md:overflow-x-auto",
  table: "w-full text-sm max-md:block",
  headRow:
    "border-b border-line bg-canvas/70 text-left text-xs font-medium text-zinc-500 max-md:hidden dark:border-zinc-800 dark:bg-zinc-800/40",
  th: "px-5 py-3 font-medium whitespace-nowrap",
  body: "divide-y divide-line max-md:block dark:divide-zinc-800",
  row: "hover:bg-canvas/50 max-md:relative max-md:grid max-md:grid-cols-2 max-md:gap-x-4 max-md:gap-y-3 max-md:p-4 dark:hover:bg-zinc-800/30",
  td: "align-middle md:px-5 md:py-3.5 max-md:block max-md:min-w-0 max-md:before:mb-0.5 max-md:before:block max-md:before:text-xs max-md:before:font-normal max-md:before:text-zinc-500 max-md:before:content-[attr(data-label)]",
  tdPrimary: "max-md:col-span-2 max-md:pr-10 max-md:before:hidden",
  tdActions: "max-md:absolute max-md:top-3 max-md:right-3 max-md:before:hidden",
  // Inside an ExpandableRow: hidden on the phone card until it's expanded.
  tdDetail: "max-md:hidden max-md:group-data-expanded/row:block",
};

// Text input and select styling inside admin toolbars and forms.
export const fieldClass =
  "h-9 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900";

export const primaryButtonClass =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50";

export const secondaryButtonClass =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium hover:bg-canvas disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800";

export const dangerButtonClass =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-4 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950";

export const linkClass = "font-medium hover:text-brand hover:underline underline-offset-4 dark:hover:text-lime";

export const muted = "text-zinc-600 dark:text-zinc-400";

// A private document (ID, CR certificate…) opened in a new tab. Links are
// short-lived, so the page says to reload for fresh ones.
export function DocumentTile({ href, label, isPdf }: { href: string; label: string; isPdf: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-w-44 items-center gap-3 rounded-lg border border-line bg-white px-3 py-2.5 hover:border-brand/40 hover:bg-mint/40 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-canvas text-xs font-semibold text-zinc-600 group-hover:text-brand dark:bg-zinc-800 dark:text-zinc-300">
        {isPdf ? "PDF" : "IMG"}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{label}</span>
        <span className="text-xs text-zinc-500">Open in new tab</span>
      </span>
    </a>
  );
}
