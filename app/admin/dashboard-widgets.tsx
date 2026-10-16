import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import type { ListingStatus } from "@/lib/listings";

export const cardClass = "rounded-lg border border-line bg-white dark:border-zinc-800 dark:bg-zinc-900";

const numberFormat = new Intl.NumberFormat("en-US");
export const formatNumber = (n: number) => numberFormat.format(n);

export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`${cardClass} ${className}`}>
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <h2 className="font-semibold">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

// Percent change against the previous period, with an arrow so it doesn't
// rely on colour.
export function ChangeBadge({ change }: { change: number | null }) {
  if (change === null) return <span className="text-zinc-500">No earlier data</span>;
  const up = change >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium ${
        up ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
      }`}
    >
      <Icon className="size-4" aria-hidden />
      {up ? "+" : "−"}
      {Math.abs(change).toFixed(1)}%
    </span>
  );
}

// Tiny trend line for a stat card. Shape only, so no axes.
function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const w = 88;
  const h = 36;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => [(i * w) / (values.length - 1), h - 3 - (v / max) * (h - 6)] as const);
  const line = pts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)},${py.toFixed(1)}`).join("");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-9 w-22 shrink-0" aria-hidden>
      <path d={`${line}L${w},${h}L0,${h}Z`} fill="var(--viz-1)" opacity="0.12" />
      <path d={line} fill="none" stroke="var(--viz-1)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  iconClass,
  trend,
  href,
  footer,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  iconClass: string;
  trend?: number[];
  href?: string;
  footer: React.ReactNode;
}) {
  const body = (
    <>
      <div className="flex items-start gap-4">
        <span className={`grid size-11 shrink-0 place-items-center rounded-full ${iconClass}`}>
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
        </div>
        {trend && <Sparkline values={trend} />}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
        {footer}
      </div>
    </>
  );
  return href ? (
    <Link href={href} className={`${cardClass} block p-5 hover:border-zinc-400 dark:hover:border-zinc-600`}>
      {body}
    </Link>
  ) : (
    <div className={`${cardClass} p-5`}>{body}</div>
  );
}

const STATUS_STYLE: Record<ListingStatus, { label: string; color: string }> = {
  active: { label: "Live", color: "var(--viz-1)" },
  sold: { label: "Sold", color: "var(--viz-2)" },
  draft: { label: "Draft", color: "var(--viz-3)" },
  removed: { label: "Removed", color: "var(--viz-4)" },
};

// Share of listings in each status. The list beside the ring carries the
// exact numbers, so the ring is never read alone.
export function StatusDonut({
  statuses,
  total,
}: {
  statuses: { status: ListingStatus; count: number }[];
  total: number;
}) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const gap = total > 0 && statuses.filter((s) => s.count > 0).length > 1 ? 3 : 0;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center justify-center gap-8">
      <div className="relative size-44 shrink-0">
        <svg viewBox="0 0 180 180" className="size-full -rotate-90" aria-hidden>
          <circle cx="90" cy="90" r={r} fill="none" stroke="var(--viz-grid)" strokeWidth="26" />
          {total > 0 &&
            statuses.map(({ status, count }) => {
              const len = (count / total) * c;
              const dash = Math.max(0, len - gap);
              const segment = (
                <circle
                  key={status}
                  cx="90"
                  cy="90"
                  r={r}
                  fill="none"
                  stroke={STATUS_STYLE[status].color}
                  strokeWidth="26"
                  strokeDasharray={`${dash} ${c - dash}`}
                  strokeDashoffset={-offset}
                >
                  <title>{`${STATUS_STYLE[status].label}: ${formatNumber(count)}`}</title>
                </circle>
              );
              offset += len;
              return count > 0 ? segment : null;
            })}
        </svg>
        <div className="absolute inset-0 grid place-content-center text-center">
          <span className="text-xl font-bold tabular-nums">{formatNumber(total)}</span>
          <span className="text-xs text-zinc-600 dark:text-zinc-400">Total listings</span>
        </div>
      </div>

      <ul className="min-w-48 flex-1 divide-y divide-line dark:divide-zinc-800">
        {statuses.map(({ status, count }) => (
          <li key={status}>
            <Link
              href={`/admin/listings?status=${status}`}
              className="grid grid-cols-[auto_1fr_auto_3.5rem] items-center gap-3 py-3 text-sm tabular-nums hover:text-brand"
            >
              <span className="size-3 rounded-full" style={{ background: STATUS_STYLE[status].color }} aria-hidden />
              <span>{STATUS_STYLE[status].label}</span>
              <span className="font-semibold">{formatNumber(count)}</span>
              <span className="text-right text-xs text-zinc-500">
                {total ? `${((count / total) * 100).toFixed(1)}%` : "—"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// One line in the "Needs attention" list.
export function AttentionRow({ label, count, href }: { label: string; count: number; href: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center justify-between gap-3 py-3 text-sm hover:text-brand">
        <span>{label}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
            count > 0
              ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          {count > 0 ? count : "None"}
        </span>
      </Link>
    </li>
  );
}
